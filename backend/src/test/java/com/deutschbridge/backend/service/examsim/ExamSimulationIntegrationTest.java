package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.ExamSimulationException;
import com.deutschbridge.backend.model.dto.examsim.ExamProfileRequest;
import com.deutschbridge.backend.model.dto.examsim.ExamSimulationDtos.*;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamExerciseCompletion;
import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.entity.ExamSimulationAttemptPart;
import com.deutschbridge.backend.model.enums.ExamResultStatus;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.PartScoringMethod;
import com.deutschbridge.backend.model.enums.SimulationAttemptStatus;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.ExamProfileConfig;
import com.deutschbridge.backend.model.examsim.ExamResult;
import com.deutschbridge.backend.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.mockito.Mockito;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

import static com.deutschbridge.backend.service.examsim.ExamSimulationFixtures.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * End-to-end behaviour of the exam simulation against a real PostgreSQL (Testcontainers): reservation, no-repeat,
 * concurrency, timers, autosave/resume, finalisation, assessment and profile immutability. Uses level C2 so the content the
 * application seeds for other levels never takes part in these pools.
 */
@Testcontainers
@SpringBootTest(properties = {"notifications.scheduler.enabled=false", "exam.simulation.seed-default-profile=false"})
@ActiveProfiles("test")
class ExamSimulationIntegrationTest {

    private static final LearningLevel LEVEL = LearningLevel.C2;
    private static final int POOL = 3; // exercises per part -> three exams per learner

    @TestConfiguration
    static class ClockConfig {
        @Bean
        @Primary
        MutableClock testClock() {
            return new MutableClock(T0);
        }
    }

    @MockitoBean private com.deutschbridge.backend.service.OllamaService ollamaService;
    @Autowired private MutableClock clock;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private ExamProfileService profileService;
    @Autowired private ExamSimulationService service;
    @Autowired private ExamSimulationAdminService adminService;
    @Autowired private ExamSimulationExpiryJob expiryJob;
    @Autowired private ExamSimulationOverviewService overviewService;
    @Autowired private ExamPoolService poolService;
    @Autowired private ExamExerciseRepository exerciseRepository;
    @Autowired private ExamExerciseCompletionRepository completionRepository;
    @Autowired private ExamProfileRepository profileRepository;
    @Autowired private ExamSimulationAttemptRepository attemptRepository;
    @Autowired private ExamSimulationAttemptPartRepository partRepository;
    @Autowired private ExamSimulationAnswerRepository answerRepository;
    @Autowired private ExamSimulationUsageRepository usageRepository;
    @Autowired private ExamSimulationAssessmentRepository assessmentRepository;
    @Autowired private ExamSimulationAuditRepository auditRepository;

    private final List<String> createdExerciseIds = new ArrayList<>();
    private ExamProfile profile;
    private int partCount;

    @BeforeEach
    void setUp() {
        clock.set(T0);
        profile = createPublishedProfile(POOL);
        partCount = profile.getConfig().partsOrEmpty().size();
    }

    @AfterEach
    void tearDown() {
        auditRepository.deleteAll();
        assessmentRepository.deleteAll();
        answerRepository.deleteAll();
        partRepository.deleteAll();
        usageRepository.deleteAll();
        attemptRepository.deleteAll();
        profileRepository.deleteAll();
        completionRepository.deleteAll();
        exerciseRepository.deleteAllById(createdExerciseIds);
        createdExerciseIds.clear();
    }

    // ------------------------------------------------------------------ helpers

    private ExamProfile createPublishedProfile(int perPart) {
        createPool(perPart);
        ExamProfileRequest base = TelcB1ProfileFactory.request();
        ExamProfileRequest request = new ExamProfileRequest("TEST_" + UUID.randomUUID(), base.provider(), base.examName(), "Testprofil", null, base.examType(),
                LEVEL, false, base.writtenMaxPoints(), base.writtenPassThreshold(), base.oralMaxPoints(), base.oralPassThreshold(),
                base.overallResultPolicy(), base.answerReleasePolicy(), null, false, base.config());
        ExamProfile created = profileService.create(request, "admin-1");
        try {
            return profileService.publish(created.getId(), "Gegen telc-Prüfungsordnung geprüft (Test)", "admin-1");
        } catch (DataNotFoundException e) {
            throw new IllegalStateException(e);
        }
    }

    private void createPool(int perPart) {
        createdExerciseIds.addAll(ExamSimulationFixtures.createPool(exerciseRepository, LEVEL, perPart));
    }

    private String user() {
        return "user-" + UUID.randomUUID();
    }

    private AttemptState start(String user) throws Exception {
        return service.start(user, profile.getId());
    }

    private List<ExamSimulationAttemptPart> parts(String attemptId) {
        return partRepository.findByAttemptIdOrderByPartKeyAscOrdinalAsc(attemptId);
    }

    private Set<String> reservedExercises(String attemptId) {
        return parts(attemptId).stream().map(ExamSimulationAttemptPart::getExerciseId).collect(Collectors.toSet());
    }

    private AnswerItem correct(String partKey, String questionId) {
        return new AnswerItem(partKey, questionId, "A", false, null);
    }

    /** Correct answers for every question of the given parts. */
    private List<AnswerItem> allCorrect(String attemptId, Collection<String> partKeys) {
        return parts(attemptId).stream().filter(p -> partKeys.contains(p.getPartKey()))
                .flatMap(p -> p.getSnapshot().questions().stream().map(q -> correct(p.getPartKey(), q.getId()))).toList();
    }

    private List<String> partKeysOf(AttemptState state) {
        return state.parts().stream().map(PartState::key).toList();
    }

    private ExamSimulationException assertCode(String code, org.junit.jupiter.api.function.Executable executable) {
        ExamSimulationException ex = assertThrows(ExamSimulationException.class, executable);
        assertEquals(code, ex.getCode());
        return ex;
    }

    // ------------------------------------------------------------------ start & content

    @Test
    @DisplayName("Starting reserves one exercise per part, snapshots them and exposes no answer key")
    void startReservesAndHidesAnswerKey() throws Exception {
        String user = user();
        AttemptState state = start(user);

        assertEquals(SimulationAttemptStatus.IN_PROGRESS, state.status());
        assertEquals(partCount, parts(state.attemptId()).size());
        assertEquals(partCount, usageRepository.countByUserIdAndProfileCode(user, profile.getCode()));
        assertEquals(5, state.stages().size());
        assertEquals(List.of("LESEN_1", "LESEN_2", "LESEN_3", "SPRACHBAUSTEINE_1", "SPRACHBAUSTEINE_2"), partKeysOf(state));
        assertEquals(90 * 60, state.remainingSeconds());

        String json = objectMapper.writeValueAsString(state);
        assertFalse(json.contains("correctAnswer"), "answer key leaked");
        assertFalse(json.contains("explanation"), "explanation leaked");
        assertFalse(json.contains("transcript"), "transcript leaked");
    }

    @Test
    @DisplayName("Ordinary Übung is untouched: simulation reservations do not complete practice exercises")
    void practiceNotAffected() throws Exception {
        String user = user();
        AttemptState state = start(user);
        assertEquals(0, completionRepository.findByUserId(user).size());
        // practice-side reads still see every exercise as published
        assertTrue(exerciseRepository.findAllById(reservedExercises(state.attemptId())).stream().allMatch(ExamExercise::isPublished));
    }

    @Test
    @DisplayName("Practice completions only reduce the pool when the profile says so")
    void practiceCompletionsExcludedOnlyWhenConfigured() throws Exception {
        String user = user();
        ExamPartConfig lesen1 = profile.getConfig().part("LESEN_1");
        ExamExercise practised = poolService.eligibleExercises(profile, lesen1).get(0);
        ExamExerciseCompletion completion = new ExamExerciseCompletion();
        completion.setUserId(user);
        completion.setExerciseId(practised.getId());
        completionRepository.save(completion);

        assertEquals(POOL, poolService.unusedFor(user, profile, lesen1).size());
        profile.setExcludePracticedExercises(true);
        assertEquals(POOL - 1, poolService.unusedFor(user, profile, lesen1).size());
        profile.setExcludePracticedExercises(false);
    }

    // ------------------------------------------------------------------ no-repeat / exhaustion

    @Test
    @DisplayName("Another exam never reuses reserved exercises, and an exhausted pool blocks new attempts")
    void noRepeatAndExhaustion() throws Exception {
        String user = user();
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < POOL; i++) {
            AttemptState state = start(user);
            Set<String> reserved = reservedExercises(state.attemptId());
            assertEquals(partCount, reserved.size());
            assertTrue(Collections.disjoint(seen, reserved), "exercise reused in attempt " + i);
            seen.addAll(reserved);
            service.submit(user, state.attemptId());
        }
        long usageBefore = usageRepository.count();
        long attemptsBefore = attemptRepository.count();

        ExamSimulationException ex = assertCode("INSUFFICIENT_CONTENT", () -> start(user));
        assertEquals(409, ex.getStatus().value());
        assertEquals(usageBefore, usageRepository.count(), "a failed start must not reserve anything");
        assertEquals(attemptsBefore, attemptRepository.count(), "a failed start must not leave an attempt behind");

        ProfileOverview overview = overviewService.get(user, profile.getId());
        assertFalse(overview.canStart());
        assertEquals("INSUFFICIENT_CONTENT", overview.blockedReason());
        assertTrue(overview.parts().stream().allMatch(p -> p.unused() == 0));
    }

    @Test
    @DisplayName("Different learners can receive the same exercises")
    void differentUsersShareThePool() throws Exception {
        Set<String> all = new HashSet<>();
        for (int i = 0; i < 3; i++) {
            AttemptState s = start(user());
            all.addAll(reservedExercises(s.attemptId()));
        }
        // Each learner draws from the same POOL * partCount exercises; no per-user exhaustion across learners.
        assertTrue(all.size() <= POOL * partCount);
        assertEquals(3L * partCount, usageRepository.count());
    }

    @Test
    @DisplayName("Abandoned, cancelled and expired attempts keep their reservations")
    void reservationsSurviveAbandonment() throws Exception {
        String user = user();
        AttemptState first = start(user);
        service.cancel(user, first.attemptId());
        assertEquals(partCount, usageRepository.countByUserIdAndProfileCode(user, profile.getCode()));

        AttemptState second = start(user);
        clock.advance(Duration.ofHours(6));
        assertEquals(1, expiryJob.run());
        assertEquals(SimulationAttemptStatus.EXPIRED, attemptRepository.findById(second.attemptId()).orElseThrow().getStatus());
        assertEquals(2L * partCount, usageRepository.countByUserIdAndProfileCode(user, profile.getCode()));

        AttemptState third = start(user);
        assertTrue(Collections.disjoint(reservedExercises(first.attemptId()), reservedExercises(third.attemptId())));
        assertTrue(Collections.disjoint(reservedExercises(second.attemptId()), reservedExercises(third.attemptId())));
    }

    // ------------------------------------------------------------------ concurrency

    @Test
    @DisplayName("Concurrent starts of one learner create exactly one attempt and one set of reservations")
    void concurrentStartsSameUser() throws Exception {
        String user = user();
        int threads = 8;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch go = new CountDownLatch(1);
        List<Future<Object>> futures = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            futures.add(pool.submit(() -> {
                go.await();
                try {
                    return start(user);
                } catch (ExamSimulationException e) {
                    return e;
                }
            }));
        }
        go.countDown();
        int started = 0;
        for (Future<Object> f : futures) {
            Object r = f.get(60, TimeUnit.SECONDS);
            if (r instanceof AttemptState) {
                started++;
            } else {
                assertEquals("ACTIVE_ATTEMPT_EXISTS", ((ExamSimulationException) r).getCode());
            }
        }
        pool.shutdown();
        assertEquals(1, started);
        assertEquals(1, attemptRepository.findByUserIdOrderByStartedAtDesc(user).size());
        assertEquals(partCount, usageRepository.countByUserIdAndProfileCode(user, profile.getCode()));
    }

    @Test
    @DisplayName("Concurrent starts of different learners all succeed")
    void concurrentStartsDifferentUsers() throws Exception {
        int threads = 6;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch go = new CountDownLatch(1);
        List<Future<AttemptState>> futures = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            String u = user();
            futures.add(pool.submit(() -> {
                go.await();
                return start(u);
            }));
        }
        go.countDown();
        for (Future<AttemptState> f : futures) assertNotNull(f.get(60, TimeUnit.SECONDS));
        pool.shutdown();
        assertEquals((long) threads * partCount, usageRepository.count());
    }

    // ------------------------------------------------------------------ autosave / resume

    @Test
    @DisplayName("Answers are autosaved, restored after a refresh, and saving is idempotent")
    void autosaveAndResume() throws Exception {
        String user = user();
        AttemptState state = start(user);
        String qid = parts(state.attemptId()).stream().filter(p -> p.getPartKey().equals("LESEN_1")).findFirst().orElseThrow().getSnapshot().questions().get(0).getId();

        SaveAnswersResponse saved = service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(List.of(new AnswerItem("LESEN_1", qid, "B", true, 10L))));
        assertEquals(1, saved.saved());
        assertTrue(saved.rejected().isEmpty());
        // retry of the same request after a network failure, and a delayed older edit
        service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(List.of(new AnswerItem("LESEN_1", qid, "B", true, 10L))));
        service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(List.of(new AnswerItem("LESEN_1", qid, "C", false, 5L))));
        assertEquals(1, answerRepository.findByAttemptId(state.attemptId()).size());

        clock.advance(Duration.ofMinutes(10));
        AttemptState resumed = service.resume(user, state.attemptId());
        assertEquals("B", resumed.answers().get("LESEN_1").get(qid).answer());
        assertTrue(resumed.answers().get("LESEN_1").get(qid).flagged());
        assertEquals(80 * 60, resumed.remainingSeconds(), "remaining time is computed by the server");
        assertEquals(1, resumed.resumeCount());
        assertEquals(1, resumed.progress().stream().filter(p -> p.partKey().equals("LESEN_1")).findFirst().orElseThrow().answered());
    }

    @Test
    @DisplayName("Unknown parts/questions are rejected and never stored")
    void rejectsInvalidAnswers() throws Exception {
        String user = user();
        AttemptState state = start(user);
        SaveAnswersResponse r = service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(List.of(
                new AnswerItem("NOPE", "x", "A", false, null),
                new AnswerItem("LESEN_1", "not-a-question", "A", false, null),
                new AnswerItem("LESEN_1", "__text", "A", false, null))));
        assertEquals(0, r.saved());
        assertEquals(List.of("UNKNOWN_PART", "UNKNOWN_QUESTION", "UNKNOWN_QUESTION"), r.rejected().stream().map(RejectedAnswer::reason).toList());
        assertEquals(0, answerRepository.count());
    }

    // ------------------------------------------------------------------ timers

    @Test
    @DisplayName("Sections share a timer, lock after expiry, and the server decides the deadline")
    void timersSectionsAndLocking() throws Exception {
        String user = user();
        AttemptState state = start(user);
        String hoerenQ = parts(state.attemptId()).stream().filter(p -> p.getPartKey().equals("HOEREN_1")).findFirst().orElseThrow().getSnapshot().questions().get(0).getId();
        String lesenQ = parts(state.attemptId()).stream().filter(p -> p.getPartKey().equals("LESEN_1")).findFirst().orElseThrow().getSnapshot().questions().get(0).getId();

        // a later section cannot be answered early
        SaveAnswersResponse early = service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(List.of(correct("HOEREN_1", hoerenQ))));
        assertEquals("SECTION_NOT_STARTED", early.rejected().get(0).reason());

        // 89 minutes: still the shared Lesen/Sprachbausteine timer
        clock.advance(Duration.ofMinutes(89));
        assertEquals(60, service.getState(user, state.attemptId()).remainingSeconds());
        assertEquals(1, service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(List.of(correct("LESEN_1", lesenQ)))).saved());

        // past the shared deadline: Hören is running, Lesen is locked
        clock.advance(Duration.ofMinutes(2));
        AttemptState hoeren = service.getState(user, state.attemptId());
        assertEquals(1, hoeren.currentStageIndex());
        assertEquals(List.of("HOEREN_1", "HOEREN_2", "HOEREN_3"), partKeysOf(hoeren));
        assertEquals(29 * 60, hoeren.remainingSeconds());
        SaveAnswersResponse late = service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(List.of(correct("LESEN_1", lesenQ), correct("HOEREN_1", hoerenQ))));
        assertEquals("SECTION_LOCKED", late.rejected().get(0).reason());
        assertEquals(1, late.saved());
    }

    @Test
    @DisplayName("Late saves within the grace period are accepted; after it the exam is expired and scored from saved answers")
    void graceAndExpiry() throws Exception {
        String user = user();
        AttemptState state = start(user);
        List<String> lesen = List.of("LESEN_1", "LESEN_2", "LESEN_3", "SPRACHBAUSTEINE_1", "SPRACHBAUSTEINE_2");
        service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(allCorrect(state.attemptId(), lesen)));

        // jump to the very end of the last stage: 185 minutes + 3 seconds (inside the 5s grace)
        clock.advance(Duration.ofMinutes(185).plusSeconds(3));
        String oralQ = "__done";
        AttemptState timeUp = service.getState(user, state.attemptId());
        assertTrue(timeUp.timeUp());
        SaveAnswersResponse graceSave = service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(List.of(new AnswerItem("MUENDLICH_1", oralQ, "true", false, null))));
        assertEquals(1, graceSave.saved(), "save within grace of the last deadline is accepted");

        clock.advance(Duration.ofSeconds(10));
        assertCode("EXAM_EXPIRED", () -> service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(List.of(new AnswerItem("MUENDLICH_1", oralQ, "true", false, null)))));

        ResultResponse result = service.getResult(user, state.attemptId());
        assertEquals(SimulationAttemptStatus.EXPIRED, result.status());
        assertEquals("TIME_EXPIRED", result.finishReason());
        assertEquals(0, new BigDecimal("105").compareTo(result.result().writtenScore()));
        assertEquals(ExamResultStatus.NOT_PASSED, result.result().writtenResult(), "105 of 225 points (blank writing scored 0) is below the threshold");
        assertEquals(1, result.result().parts().stream().filter(p -> p.key().equals("MUENDLICH_1") && p.completed()).count(), "oral completion saved in the grace window is kept");
    }

    @Test
    @DisplayName("Completing a section early starts the next one at once")
    void completeSectionEarly() throws Exception {
        String user = user();
        AttemptState state = start(user);
        clock.advance(Duration.ofMinutes(20));
        AttemptState next = service.completeCurrentStage(user, state.attemptId());
        assertEquals(1, next.currentStageIndex());
        assertEquals(30 * 60, next.remainingSeconds());
        assertEquals("COMPLETED", next.stages().get(0).status());
        assertEquals("RUNNING", next.stages().get(1).status());
    }

    @Test
    @DisplayName("Oral preparation previews the oral tasks but accepts no answers; oral practice is recorded as completed, unscored")
    void oralPreparationAndPractice() throws Exception {
        String user = user();
        AttemptState state = start(user);
        for (int i = 0; i < 3; i++) state = service.completeCurrentStage(user, state.attemptId());
        assertEquals("MUENDLICH_VORBEREITUNG", state.stages().get(3).key());
        assertEquals(3, state.currentStageIndex());
        assertEquals(List.of("MUENDLICH_1", "MUENDLICH_2", "MUENDLICH_3"), partKeysOf(state));
        assertTrue(state.parts().stream().allMatch(PartState::previewOnly));
        SaveAnswersResponse prep = service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(List.of(new AnswerItem("MUENDLICH_1", "__done", "true", false, null))));
        assertEquals("SECTION_NOT_STARTED", prep.rejected().get(0).reason());

        state = service.completeCurrentStage(user, state.attemptId());
        assertFalse(state.parts().get(0).previewOnly());
        assertEquals(PartScoringMethod.UNSCORED, state.parts().get(0).scoringMethod());
        service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(List.of(new AnswerItem("MUENDLICH_1", "__done", "true", false, null))));

        ResultResponse result = service.submit(user, state.attemptId());
        assertEquals(ExamResultStatus.NOT_ASSESSED, result.result().oralResult());
        assertTrue(result.result().parts().stream().filter(p -> p.key().equals("MUENDLICH_1")).findFirst().orElseThrow().completed());
        assertNull(result.result().oralScore());
    }

    // ------------------------------------------------------------------ finalisation, scoring, assessment

    @Test
    @DisplayName("Full exam: server scores the stored answers, writing awaits assessment, manual assessment completes the written result, oral stays unscored")
    void fullExamScoringAndAssessment() throws Exception {
        String user = user();
        AttemptState state = start(user);
        String id = state.attemptId();

        service.saveAnswers(user, id, new SaveAnswersRequest(allCorrect(id, List.of("LESEN_1", "LESEN_2", "LESEN_3", "SPRACHBAUSTEINE_1", "SPRACHBAUSTEINE_2"))));
        service.completeCurrentStage(user, id);
        service.saveAnswers(user, id, new SaveAnswersRequest(allCorrect(id, List.of("HOEREN_1", "HOEREN_2", "HOEREN_3"))));
        service.completeCurrentStage(user, id);
        service.saveAnswers(user, id, new SaveAnswersRequest(List.of(new AnswerItem("SCHRIFTLICHER_AUSDRUCK", "__text", "Liebe Anna, vielen Dank für deine Einladung. Ich komme gern.", false, null))));

        ResultResponse submitted = service.submit(user, id);
        assertEquals(SimulationAttemptStatus.COMPLETED, submitted.status());
        ExamResult r = submitted.result();
        assertEquals(0, new BigDecimal("180").compareTo(r.writtenScore()));
        assertEquals(ExamResultStatus.AWAITING_ASSESSMENT, r.writtenResult());
        assertEquals(ExamResultStatus.AWAITING_ASSESSMENT, r.overallResult());
        assertEquals(List.of("SCHRIFTLICHER_AUSDRUCK"), r.pendingAssessmentParts());
        assertNull(r.parts().stream().filter(p -> p.key().equals("SCHRIFTLICHER_AUSDRUCK")).findFirst().orElseThrow().score());
        assertEquals(1, adminService.queue().stream().filter(q -> q.attemptId().equals(id)).count());
        assertTrue(submitted.answersReleased());
        assertEquals(1, submitted.review().stream().filter(p -> p.partKey().equals("LESEN_1")).findFirst().orElseThrow().exercises().size());

        // invalid assessments are rejected
        assertThrows(ExamSimulationException.class, () -> adminService.assess("admin-1", id, "SCHRIFTLICHER_AUSDRUCK",
                new AssessmentRequest(Map.of("AUFGABENERFUELLUNG", new BigDecimal("16"), "KOMMUNIKATIVE_GESTALTUNG", BigDecimal.TEN, "FORMALE_RICHTIGKEIT", BigDecimal.TEN), null)));
        assertThrows(ExamSimulationException.class, () -> adminService.assess("admin-1", id, "SCHRIFTLICHER_AUSDRUCK",
                new AssessmentRequest(Map.of("AUFGABENERFUELLUNG", new BigDecimal("10.3"), "KOMMUNIKATIVE_GESTALTUNG", BigDecimal.TEN, "FORMALE_RICHTIGKEIT", BigDecimal.TEN), null)));

        ExamResult assessed = adminService.assess("admin-1", id, "SCHRIFTLICHER_AUSDRUCK", new AssessmentRequest(
                Map.of("AUFGABENERFUELLUNG", new BigDecimal("12"), "KOMMUNIKATIVE_GESTALTUNG", new BigDecimal("11.5"), "FORMALE_RICHTIGKEIT", new BigDecimal("10")), "Gut."));
        assertEquals(0, new BigDecimal("213.5").compareTo(assessed.writtenScore()));
        assertEquals(ExamResultStatus.PASSED, assessed.writtenResult());
        assertEquals(ExamResultStatus.NOT_ASSESSED, assessed.oralResult());
        assertEquals(ExamResultStatus.INCOMPLETE, assessed.overallResult(), "a written pass alone never makes the full exam passed");
        assertTrue(assessed.pendingAssessmentParts().isEmpty());
        assertEquals(0, adminService.queue().stream().filter(q -> q.attemptId().equals(id)).count());
        assertEquals(ExamResultStatus.PASSED, service.getResult(user, id).result().writtenResult());
    }

    @Test
    @DisplayName("A blank writing submission is scored 0 by rule instead of waiting for an assessor")
    void blankWritingScoredZero() throws Exception {
        String user = user();
        AttemptState state = start(user);
        ResultResponse r = service.submit(user, state.attemptId());
        assertTrue(r.result().writtenComplete());
        assertEquals(0, BigDecimal.ZERO.compareTo(r.result().writtenScore()));
        assertEquals(ExamResultStatus.NOT_PASSED, r.result().writtenResult());
        assertEquals(ExamResultStatus.NOT_PASSED, r.result().overallResult());
    }

    @Test
    @DisplayName("Submitting twice is idempotent: same result, no re-scoring, one audit entry")
    void duplicateSubmission() throws Exception {
        String user = user();
        AttemptState state = start(user);
        ResultResponse first = service.submit(user, state.attemptId());
        clock.advance(Duration.ofMinutes(5));
        ResultResponse second = service.submit(user, state.attemptId());
        assertEquals(first.result().computedAtMs(), second.result().computedAtMs());
        assertEquals(first.endedAtMs(), second.endedAtMs());
        assertEquals(1, auditRepository.findBySubjectTypeAndSubjectIdOrderByOccurredAtAsc("ATTEMPT", state.attemptId()).stream()
                .filter(a -> a.getAction().equals("SUBMITTED")).count());

        AtomicSubmitResult race = concurrentSubmits(user);
        assertEquals(1, race.distinctResults);
    }

    private record AtomicSubmitResult(int distinctResults) {
    }

    private AtomicSubmitResult concurrentSubmits(String ignored) throws Exception {
        String user = user();
        AttemptState state = start(user);
        ExecutorService pool = Executors.newFixedThreadPool(5);
        CountDownLatch go = new CountDownLatch(1);
        List<Future<Long>> futures = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            futures.add(pool.submit(() -> {
                go.await();
                return service.submit(user, state.attemptId()).result().computedAtMs();
            }));
        }
        go.countDown();
        Set<Long> results = new HashSet<>();
        for (Future<Long> f : futures) results.add(f.get(60, TimeUnit.SECONDS));
        pool.shutdown();
        assertEquals(1, auditRepository.findBySubjectTypeAndSubjectIdOrderByOccurredAtAsc("ATTEMPT", state.attemptId()).stream()
                .filter(a -> a.getAction().equals("SUBMITTED")).count());
        return new AtomicSubmitResult(results.size());
    }

    @Test
    @DisplayName("Cancelled attempts have no result, accept no answers and cannot be submitted")
    void cancelledAttempt() throws Exception {
        String user = user();
        AttemptState state = start(user);
        service.cancel(user, state.attemptId());
        service.cancel(user, state.attemptId()); // idempotent
        assertCode("ATTEMPT_CANCELLED", () -> service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(List.of())));
        assertCode("ATTEMPT_CANCELLED", () -> service.submit(user, state.attemptId()));
        assertCode("ATTEMPT_CANCELLED", () -> service.getResult(user, state.attemptId()));
    }

    @Test
    @DisplayName("Resuming can be limited by the profile")
    void resumeLimit() throws Exception {
        profile.setMaxResumes(1);
        profileRepository.save(profile);
        String user = user();
        AttemptState state = start(user);
        service.resume(user, state.attemptId());
        assertCode("RESUME_NOT_ALLOWED", () -> service.resume(user, state.attemptId()));
    }

    @Test
    @DisplayName("Pausing stops the clock, hides the tasks and continues with the same time left")
    void pauseAndContinue() throws Exception {
        String user = user();
        AttemptState state = start(user);
        String lesenQ = parts(state.attemptId()).stream().filter(p -> p.getPartKey().equals("LESEN_1")).findFirst().orElseThrow().getSnapshot().questions().get(0).getId();
        service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(List.of(new AnswerItem("LESEN_1", lesenQ, "B", false, 1L))));

        clock.advance(Duration.ofMinutes(30));
        AttemptState paused = service.pause(user, state.attemptId());
        assertTrue(paused.paused());
        assertEquals(60 * 60, paused.remainingSeconds());
        assertTrue(paused.parts().isEmpty(), "no tasks while paused");
        assertCode("ATTEMPT_PAUSED", () -> service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(List.of(correct("LESEN_1", lesenQ)))));
        assertCode("ATTEMPT_PAUSED", () -> service.completeCurrentStage(user, state.attemptId()));

        // hours later (still inside the allowed pause): the exam is still there, with the time frozen, and opening it is not a resume
        clock.advance(Duration.ofHours(5));
        AttemptState reopened = service.resume(user, state.attemptId());
        assertTrue(reopened.paused());
        assertEquals(60 * 60, reopened.remainingSeconds());
        assertEquals(0, reopened.resumeCount());
        assertEquals(0, expiryJob.run());

        AttemptState continued = service.continueAfterPause(user, state.attemptId());
        assertFalse(continued.paused());
        assertEquals(60 * 60, continued.remainingSeconds(), "exactly the time that was left");
        assertEquals("B", continued.answers().get("LESEN_1").get(lesenQ).answer());
        assertEquals(1, continued.pauseCount());

        clock.advance(Duration.ofMinutes(10));
        assertEquals(50 * 60, service.getState(user, state.attemptId()).remainingSeconds());
        assertEquals(1, service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(List.of(correct("LESEN_1", lesenQ)))).saved());
    }

    @Test
    @DisplayName("A pause nobody ends runs out after the longest allowed pause")
    void pauseLimitRunsOut() throws Exception {
        String user = user();
        AttemptState state = start(user);
        service.pause(user, state.attemptId());
        assertEquals(state.attemptId(), overviewService.get(user, profile.getId()).activeAttemptId());
        assertTrue(overviewService.get(user, profile.getId()).activeAttemptPaused());

        // The pause ran out after 24 h; the clock then ran for the following 60 of the first section's 90 minutes.
        clock.advance(Duration.ofHours(25));
        AttemptState after = service.getState(user, state.attemptId());
        assertFalse(after.paused());
        assertEquals(30 * 60, after.remainingSeconds());
    }

    @Test
    @DisplayName("Submitting a paused exam closes it and gives the result")
    void submitWhilePaused() throws Exception {
        String user = user();
        AttemptState state = start(user);
        service.pause(user, state.attemptId());
        ResultResponse result = service.submit(user, state.attemptId());
        assertEquals(SimulationAttemptStatus.COMPLETED, result.status());
        assertNull(attemptRepository.findById(state.attemptId()).orElseThrow().getPausedAt());
    }

    // ------------------------------------------------------------------ audit

    @Test
    @DisplayName("State transitions are written to the audit trail")
    void auditTrail() throws Exception {
        String user = user();
        AttemptState state = start(user);
        service.completeCurrentStage(user, state.attemptId());
        clock.advance(Duration.ofMinutes(31));
        service.getState(user, state.attemptId());
        service.submit(user, state.attemptId());
        List<String> actions = auditRepository.findBySubjectTypeAndSubjectIdOrderByOccurredAtAsc("ATTEMPT", state.attemptId()).stream().map(a -> a.getAction()).toList();
        assertEquals(List.of("STARTED", "STAGE_COMPLETED", "STAGE_EXPIRED", "SUBMITTED"), actions);
    }

    // ------------------------------------------------------------------ historical integrity

    @Test
    @DisplayName("Published profiles are immutable; a new version never changes an existing attempt or its result")
    void historicalProfileVersionIntegrity() throws Exception {
        String user = user();
        AttemptState state = start(user);
        ExamProfileRequest edit = new ExamProfileRequest(profile.getCode(), profile.getProvider(), profile.getExamName(), "Neu", null, profile.getExamType(), LEVEL,
                false, profile.getWrittenMaxPoints(), new BigDecimal("200"), profile.getOralMaxPoints(), profile.getOralPassThreshold(),
                profile.getOverallResultPolicy(), profile.getAnswerReleasePolicy(), null, false, profile.getConfig());
        assertCode("PROFILE_IMMUTABLE", () -> profileService.update(profile.getId(), edit, "admin-1"));

        ExamProfile v2 = profileService.duplicate(profile.getId(), "admin-1");
        assertEquals(2, v2.getVersion());
        profileService.update(v2.getId(), edit, "admin-1");
        profileService.publish(v2.getId(), "v2 geprüft", "admin-1");
        assertEquals(com.deutschbridge.backend.model.enums.ExamProfileStatus.DEACTIVATED, profileRepository.findById(profile.getId()).orElseThrow().getStatus());

        ResultResponse result = service.submit(user, state.attemptId());
        assertEquals(1, result.profileVersion());
        assertEquals(0, new BigDecimal("135").compareTo(result.result().writtenPassThreshold()), "the attempt keeps the thresholds of the version it started with");
        assertEquals(1, attemptRepository.findById(state.attemptId()).orElseThrow().getProfileVersion());
    }

    @Test
    @DisplayName("Exercise snapshots protect historical exams from later content edits")
    void exerciseSnapshotsAreImmutable() throws Exception {
        String user = user();
        AttemptState state = start(user);
        ExamSimulationAttemptPart part = parts(state.attemptId()).stream().filter(p -> p.getPartKey().equals("LESEN_2")).findFirst().orElseThrow();
        ExamExercise live = exerciseRepository.findById(part.getExerciseId()).orElseThrow();
        live.getQuestions().forEach(q -> q.setCorrectAnswer("C")); // admin edits the live exercise afterwards
        live.setVersion(live.getVersion() + 1);
        exerciseRepository.save(live);

        service.saveAnswers(user, state.attemptId(), new SaveAnswersRequest(allCorrect(state.attemptId(), List.of("LESEN_2"))));
        ResultResponse result = service.submit(user, state.attemptId());
        assertEquals(0, new BigDecimal("25").compareTo(result.result().parts().stream().filter(p -> p.key().equals("LESEN_2")).findFirst().orElseThrow().score()));
    }

    // ------------------------------------------------------------------ profile validation & availability

    @Test
    @DisplayName("Invalid profiles are rejected at publication and can never generate an exam")
    void invalidProfileRejected() throws Exception {
        ExamProfileRequest base = TelcB1ProfileFactory.request();
        List<ExamPartConfig> parts = new ArrayList<>(base.config().parts());
        ExamPartConfig lesen3 = parts.get(2);
        parts.set(2, new ExamPartConfig(lesen3.key(), lesen3.label(), lesen3.module(), lesen3.section(), lesen3.teil(), null, 1, 10, new BigDecimal("2"),
                lesen3.maxPoints(), PartScoringMethod.PER_QUESTION, lesen3.timerKey(), null)); // 10 x 2 != 25
        ExamProfileRequest bad = new ExamProfileRequest("TEST_BAD_" + UUID.randomUUID(), base.provider(), base.examName(), "Ungültig", null, base.examType(), LEVEL,
                false, base.writtenMaxPoints(), base.writtenPassThreshold(), base.oralMaxPoints(), base.oralPassThreshold(), base.overallResultPolicy(),
                base.answerReleasePolicy(), null, false, new ExamProfileConfig(parts, base.config().timers(), 1, "HALF_UP"));
        ExamProfile draft = profileService.create(bad, "admin-1");

        ExamSimulationException ex = assertCode("PROFILE_INVALID", () -> profileService.publish(draft.getId(), "x", "admin-1"));
        assertTrue(ex.getDetails().toString().contains("PART_POINTS_MISMATCH"));
        assertCode("PROFILE_NOT_AVAILABLE", () -> service.start(user(), draft.getId()));
    }

    @Test
    @DisplayName("Publishing needs a verification note and enough eligible content in every part")
    void publishRequiresVerificationAndContent() throws Exception {
        ExamProfileRequest base = TelcB1ProfileFactory.request();
        // level A1 has no pool at all
        ExamProfileRequest noContent = new ExamProfileRequest("TEST_EMPTY_" + UUID.randomUUID(), base.provider(), base.examName(), "Leer", null, base.examType(),
                LearningLevel.A1, false, base.writtenMaxPoints(), base.writtenPassThreshold(), base.oralMaxPoints(), base.oralPassThreshold(),
                base.overallResultPolicy(), base.answerReleasePolicy(), null, false, base.config());
        ExamProfile draft = profileService.create(noContent, "admin-1");
        assertCode("VERIFICATION_NOTE_REQUIRED", () -> profileService.publish(draft.getId(), " ", "admin-1"));
        ExamSimulationException ex = assertCode("PROFILE_INVALID", () -> profileService.publish(draft.getId(), "geprüft", "admin-1"));
        assertTrue(ex.getDetails().toString().contains("CONTENT_MISSING"));
    }

    @Test
    @DisplayName("Admins see eligible and remaining content per part")
    void adminAvailability() throws Exception {
        String user = user();
        AttemptState s = start(user);
        service.cancel(user, s.attemptId());
        AvailabilityResponse availability = adminService.availability(profile.getId());
        assertTrue(availability.sufficient());
        assertEquals(partCount, availability.parts().size());
        assertTrue(availability.parts().stream().allMatch(p -> p.eligible() == POOL && p.minRemainingAcrossUsers() == POOL - 1));
    }

    // ------------------------------------------------------------------ ownership

    @Test
    @DisplayName("Attempts of other learners look like missing attempts for every operation")
    void ownership() throws Exception {
        String owner = user();
        String intruder = user();
        AttemptState state = start(owner);
        String id = state.attemptId();
        assertThrows(DataNotFoundException.class, () -> service.getState(intruder, id));
        assertThrows(DataNotFoundException.class, () -> service.resume(intruder, id));
        assertThrows(DataNotFoundException.class, () -> service.saveAnswers(intruder, id, new SaveAnswersRequest(List.of())));
        assertThrows(DataNotFoundException.class, () -> service.completeCurrentStage(intruder, id));
        assertThrows(DataNotFoundException.class, () -> service.submit(intruder, id));
        assertThrows(DataNotFoundException.class, () -> service.cancel(intruder, id));
        assertThrows(DataNotFoundException.class, () -> service.getResult(intruder, id));
        assertTrue(service.history(intruder).attempts().isEmpty());
        assertEquals(1, service.history(owner).attempts().size());
    }

    @Test
    @DisplayName("Overview reports an unfinished attempt, best and latest results")
    void overviewReflectsAttempts() throws Exception {
        String user = user();
        AttemptState first = start(user);
        ProfileOverview running = overviewService.get(user, profile.getId());
        assertEquals(first.attemptId(), running.activeAttemptId());
        assertFalse(running.canStart());
        assertEquals("ACTIVE_ATTEMPT", running.blockedReason());

        service.submit(user, first.attemptId());
        ProfileOverview after = overviewService.get(user, profile.getId());
        assertNull(after.activeAttemptId());
        assertTrue(after.canStart());
        assertEquals(1, after.attemptCount());
        assertNotNull(after.latest());
        assertNotNull(after.best());
        assertEquals(185, after.totalMinutes());
    }

    // ------------------------------------------------------------------ audio plays / AI estimate

    private String firstPassageId(AttemptState state, String partKey) {
        return state.parts().stream().filter(p -> p.key().equals(partKey)).findFirst().orElseThrow().exercises().get(0).passages().get(0).id();
    }

    @Test
    @DisplayName("Audio play limits are counted on the server, survive a refresh and only apply while the section is open")
    void audioPlayLimit() throws Exception {
        List<ExamPartConfig> parts = new ArrayList<>(profile.getConfig().parts());
        for (int i = 0; i < parts.size(); i++) {
            ExamPartConfig p = parts.get(i);
            if (p.key().equals("HOEREN_1")) {
                parts.set(i, new ExamPartConfig(p.key(), p.label(), p.module(), p.section(), p.teil(), p.taskTypes(), p.exerciseCount(), p.questionCount(),
                        p.pointsPerQuestion(), p.maxPoints(), p.scoringMethod(), p.timerKey(), p.rubric(), 2));
            }
        }
        profile.setConfig(new ExamProfileConfig(parts, profile.getConfig().timers(), profile.getConfig().scoreScale(), profile.getConfig().roundingMode()));
        profileRepository.save(profile);

        String user = user();
        AttemptState state = start(user);
        String id = state.attemptId();
        // the Hören section has not started yet
        String clip = parts(id).stream().filter(p -> p.getPartKey().equals("HOEREN_1")).findFirst().orElseThrow().getSnapshot().passages().get(0).getId();
        assertCode("SECTION_LOCKED", () -> service.playAudio(user, id, "HOEREN_1", clip));

        AttemptState hoeren = service.completeCurrentStage(user, id);
        assertEquals(2, hoeren.parts().get(0).maxAudioPlays());
        assertEquals(clip, firstPassageId(hoeren, "HOEREN_1"));
        assertEquals(1, service.playAudio(user, id, "HOEREN_1", clip).playsRemaining());
        assertEquals(0, service.playAudio(user, id, "HOEREN_1", clip).playsRemaining());
        assertCode("AUDIO_LIMIT_REACHED", () -> service.playAudio(user, id, "HOEREN_1", clip));
        assertThrows(DataNotFoundException.class, () -> service.playAudio(user, id, "HOEREN_1", "no-such-clip"));
        assertThrows(DataNotFoundException.class, () -> service.playAudio(user(), id, "HOEREN_1", clip));

        AttemptState resumed = service.resume(user, id);
        assertEquals(2, resumed.parts().get(0).audioPlays().get(clip));
    }

    @Test
    @DisplayName("A part without a play limit never refuses a play")
    void unlimitedAudio() throws Exception {
        String user = user();
        AttemptState state = start(user);
        String clip = parts(state.attemptId()).stream().filter(p -> p.getPartKey().equals("HOEREN_2")).findFirst().orElseThrow().getSnapshot().passages().get(0).getId();
        service.completeCurrentStage(user, state.attemptId());
        for (int i = 0; i < 5; i++) assertNull(service.playAudio(user, state.attemptId(), "HOEREN_2", clip).playsRemaining());
    }

    @Test
    @DisplayName("An AI estimate helps the assessor but never changes a score or result")
    void aiEstimateIsNotOfficial() throws Exception {
        Mockito.when(ollamaService.evaluateWriting(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any())).thenReturn("Gute Struktur, einige Fehler.");
        String user = user();
        AttemptState state = start(user);
        String id = state.attemptId();
        service.completeCurrentStage(user, id);
        service.completeCurrentStage(user, id);
        service.saveAnswers(user, id, new SaveAnswersRequest(List.of(new AnswerItem("SCHRIFTLICHER_AUSDRUCK", "__text", "Liebe Anna, ich komme gern.", false, null))));
        ExamResult before = service.submit(user, id).result();

        assertEquals("Gute Struktur, einige Fehler.", adminService.estimateWriting("admin-1", id, "SCHRIFTLICHER_AUSDRUCK"));
        ExamResult after = service.getResult(user, id).result();
        assertEquals(ExamResultStatus.AWAITING_ASSESSMENT, after.writtenResult());
        assertEquals(before.writtenScore(), after.writtenScore());
        assertEquals(List.of("SCHRIFTLICHER_AUSDRUCK"), after.pendingAssessmentParts());
        assertEquals("Gute Struktur, einige Fehler.", adminService.queue().stream().filter(q -> q.attemptId().equals(id)).findFirst().orElseThrow().aiEstimate());
        assertCode("PART_NOT_WRITING", () -> adminService.estimateWriting("admin-1", id, "LESEN_1"));

        ExamResult official = adminService.assess("admin-1", id, "SCHRIFTLICHER_AUSDRUCK",
                new AssessmentRequest(Map.of("AUFGABENERFUELLUNG", BigDecimal.TEN, "KOMMUNIKATIVE_GESTALTUNG", BigDecimal.TEN, "FORMALE_RICHTIGKEIT", BigDecimal.TEN), null));
        assertEquals(0, new BigDecimal("30").compareTo(official.parts().stream().filter(p -> p.key().equals("SCHRIFTLICHER_AUSDRUCK")).findFirst().orElseThrow().score()));
    }

    @Test
    @DisplayName("Content gaps can be accepted explicitly at publication; learners then see why the exam cannot start. Structural errors can never be waived")
    void publishWithAcceptedContentGaps() throws Exception {
        ExamProfileRequest base = TelcB1ProfileFactory.request();
        ExamProfile draft = profileService.create(new ExamProfileRequest("TEST_GAP_" + UUID.randomUUID(), base.provider(), base.examName(), "Lücken", null, base.examType(),
                LearningLevel.A2, false, base.writtenMaxPoints(), base.writtenPassThreshold(), base.oralMaxPoints(), base.oralPassThreshold(),
                base.overallResultPolicy(), base.answerReleasePolicy(), null, false, base.config()), "admin-1");
        assertCode("PROFILE_INVALID", () -> profileService.publish(draft.getId(), "geprüft", "admin-1"));
        ExamProfile published = profileService.publish(draft.getId(), "geprüft", true, "admin-1");
        assertEquals(com.deutschbridge.backend.model.enums.ExamProfileStatus.PUBLISHED, published.getStatus());

        ProfileOverview overview = overviewService.get(user(), published.getId());
        assertFalse(overview.canStart());
        assertEquals("INSUFFICIENT_CONTENT", overview.blockedReason());
        assertCode("INSUFFICIENT_CONTENT", () -> service.start(user(), published.getId()));

        // structural problems are never waived
        ExamPartConfig lesen1 = base.config().parts().get(0);
        List<ExamPartConfig> parts = new ArrayList<>(base.config().parts());
        parts.set(0, new ExamPartConfig(lesen1.key(), lesen1.label(), lesen1.module(), lesen1.section(), lesen1.teil(), null, 1, 5, new BigDecimal("4"), lesen1.maxPoints(),
                lesen1.scoringMethod(), lesen1.timerKey(), null));
        ExamProfile broken = profileService.create(new ExamProfileRequest("TEST_BROKEN_" + UUID.randomUUID(), base.provider(), base.examName(), "Kaputt", null, base.examType(),
                LearningLevel.A2, false, base.writtenMaxPoints(), base.writtenPassThreshold(), base.oralMaxPoints(), base.oralPassThreshold(), base.overallResultPolicy(),
                base.answerReleasePolicy(), null, false, new ExamProfileConfig(parts, base.config().timers(), 1, "HALF_UP")), "admin-1");
        assertCode("PROFILE_INVALID", () -> profileService.publish(broken.getId(), "geprüft", true, "admin-1"));
    }

    @Test
    @DisplayName("Availability explains why exercises were rejected, including the question counts found")
    void availabilityDiagnostics() throws Exception {
        ExamExercise wrong = ExamSimulationFixtures.pooledExercise("zu-kurz", ExamSection.LESEVERSTEHEN, 3, ExamTaskType.MULTIPLE_CHOICE, 8, LEVEL);
        createdExerciseIds.add(exerciseRepository.save(wrong).getId());
        var lesen3 = adminService.availability(profile.getId()).parts().stream().filter(p -> p.partKey().equals("LESEN_3")).findFirst().orElseThrow();
        assertEquals(POOL, lesen3.eligible());
        assertEquals(10, lesen3.expectedQuestions());
        assertEquals(1, lesen3.ineligibleReasons().get("QUESTION_COUNT"));
        assertEquals(1, lesen3.questionCounts().get(8));
    }
}
