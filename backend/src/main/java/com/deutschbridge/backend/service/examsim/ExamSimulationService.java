package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.exception.ExamSimulationException;
import com.deutschbridge.backend.model.dto.examsim.ExamSimulationDtos.*;
import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.entity.ExamSimulationAnswer;
import com.deutschbridge.backend.model.entity.ExamSimulationAssessment;
import com.deutschbridge.backend.model.entity.ExamSimulationAttempt;
import com.deutschbridge.backend.model.entity.ExamSimulationAttemptPart;
import com.deutschbridge.backend.model.enums.AssessmentSource;
import com.deutschbridge.backend.model.enums.AssessmentStatus;
import com.deutschbridge.backend.model.enums.ExamPartModule;
import com.deutschbridge.backend.model.enums.ExamProfileStatus;
import com.deutschbridge.backend.model.enums.PartScoringMethod;
import com.deutschbridge.backend.model.enums.SimulationAttemptStatus;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.ExamResult;
import com.deutschbridge.backend.model.examsim.ExamTimerConfig;
import com.deutschbridge.backend.model.examsim.ExerciseSnapshot;
import com.deutschbridge.backend.model.examsim.ProfileSnapshot;
import com.deutschbridge.backend.model.examsim.StageState;
import com.deutschbridge.backend.repository.ExamProfileRepository;
import com.deutschbridge.backend.repository.ExamSimulationAnswerRepository;
import com.deutschbridge.backend.repository.ExamSimulationAssessmentRepository;
import com.deutschbridge.backend.repository.ExamSimulationAttemptPartRepository;
import com.deutschbridge.backend.repository.ExamSimulationAttemptRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.deutschbridge.backend.service.examsim.ExamSimulationViewBuilder.DONE_ID;
import static com.deutschbridge.backend.service.examsim.ExamSimulationViewBuilder.WRITING_TEXT_ID;

/**
 * The exam attempt state machine: IN_PROGRESS -> COMPLETED | EXPIRED | CANCELLED. Every state-changing call takes a row
 * lock on the attempt, so saves, section completion, submission and expiry can never interleave. All time decisions use the
 * injected server clock; the browser countdown is display only.
 */
@Service
public class ExamSimulationService {

    private static final String ATTEMPT_NOT_FOUND = "Exam attempt not found!";
    private static final int MAX_ANSWERS_PER_REQUEST = 200;
    private static final int MAX_TEXT_LENGTH = 20_000;
    private static final int MAX_ANSWER_LENGTH = 1_000;

    private final ExamProfileRepository profileRepository;
    private final ExamSimulationAttemptRepository attemptRepository;
    private final ExamSimulationAttemptPartRepository partRepository;
    private final ExamSimulationAnswerRepository answerRepository;
    private final ExamSimulationAssessmentRepository assessmentRepository;
    private final ExamExerciseSelectionService selectionService;
    private final ExamProfileValidator validator;
    private final ExamResultCalculator calculator;
    private final ExamSimulationViewBuilder views;
    private final ExamSimulationAuditService audit;
    private final Clock clock;
    private final long graceMs;

    public ExamSimulationService(ExamProfileRepository profileRepository, ExamSimulationAttemptRepository attemptRepository,
                                 ExamSimulationAttemptPartRepository partRepository, ExamSimulationAnswerRepository answerRepository,
                                 ExamSimulationAssessmentRepository assessmentRepository, ExamExerciseSelectionService selectionService,
                                 ExamProfileValidator validator, ExamResultCalculator calculator, ExamSimulationViewBuilder views,
                                 ExamSimulationAuditService audit, Clock clock,
                                 @Value("${exam.simulation.save-grace-seconds:5}") long graceSeconds) {
        this.profileRepository = profileRepository;
        this.attemptRepository = attemptRepository;
        this.partRepository = partRepository;
        this.answerRepository = answerRepository;
        this.assessmentRepository = assessmentRepository;
        this.selectionService = selectionService;
        this.validator = validator;
        this.calculator = calculator;
        this.views = views;
        this.audit = audit;
        this.clock = clock;
        this.graceMs = graceSeconds * 1000L;
    }

    // ================================================================ start / resume / read

    @Transactional
    public AttemptState start(String userId, String profileId) throws DataNotFoundException {
        ExamProfile profile = profileRepository.findById(profileId).orElseThrow(() -> new DataNotFoundException("Exam profile not found!"));
        if (profile.getStatus() != ExamProfileStatus.PUBLISHED) {
            throw ExamSimulationException.conflict("PROFILE_NOT_AVAILABLE", "This exam profile is not available.");
        }
        ProfileValidationResult validation = validator.validate(profile);
        if (!validation.isValid()) {
            throw new ExamSimulationException(HttpStatus.UNPROCESSABLE_ENTITY, "PROFILE_INVALID", "This exam profile is invalid and cannot generate an exam.",
                    Map.of("errors", validation.errors()));
        }

        selectionService.lockPool(userId, profile.getCode());

        Optional<ExamSimulationAttempt> running = attemptRepository.findFirstByUserIdAndProfileCodeAndStatus(userId, profile.getCode(), SimulationAttemptStatus.IN_PROGRESS);
        if (running.isPresent()) {
            ExamSimulationAttempt existing = attemptRepository.findByIdForUpdate(running.get().getId()).orElseThrow();
            sync(existing);
            if (existing.getStatus() == SimulationAttemptStatus.IN_PROGRESS) {
                throw ExamSimulationException.conflict("ACTIVE_ATTEMPT_EXISTS", "You already have an exam in progress.", Map.of("attemptId", existing.getId()));
            }
        }

        Instant now = Instant.now(clock);
        ProfileSnapshot snapshot = ProfileSnapshot.of(profile);
        List<ExamTimerConfig> timers = snapshot.config().timersOrEmpty();
        ExamSimulationAttempt attempt = new ExamSimulationAttempt();
        attempt.setUserId(userId);
        attempt.setProfileId(profile.getId());
        attempt.setProfileCode(profile.getCode());
        attempt.setProfileVersion(profile.getVersion());
        attempt.setProfileSnapshot(snapshot);
        attempt.setStatus(SimulationAttemptStatus.IN_PROGRESS);
        attempt.setStartedAt(now);
        attempt.setStages(ExamStageClock.start(timers, now.toEpochMilli()));
        attempt.setFinalDeadlineAt(Instant.ofEpochMilli(ExamStageClock.finalDeadlineMs(timers, attempt.getStages())));
        attempt.setUpdatedAt(now);
        attempt = attemptRepository.saveAndFlush(attempt);

        List<ExamExerciseSelectionService.Selection> selections = selectionService.selectAndReserve(userId, profile, attempt.getId());
        for (ExamExerciseSelectionService.Selection s : selections) {
            ExamSimulationAttemptPart part = new ExamSimulationAttemptPart();
            part.setAttemptId(attempt.getId());
            part.setPartKey(s.part().key());
            part.setOrdinal(s.ordinal());
            part.setExerciseId(s.exercise().getId());
            part.setExerciseVersion(s.exercise().getVersion());
            part.setSnapshot(s.snapshot());
            partRepository.save(part);
        }
        audit.record(ExamSimulationAuditService.ATTEMPT, attempt.getId(), "STARTED", null, SimulationAttemptStatus.IN_PROGRESS.name(), userId,
                Map.of("profileCode", profile.getCode(), "profileVersion", profile.getVersion(), "exercises", selections.stream().map(s -> s.exercise().getId()).toList()));
        return state(attempt);
    }

    /** Re-enters a running attempt (browser refresh, new device). Counts against the profile's resume limit, if any. */
    @Transactional
    public AttemptState resume(String userId, String attemptId) throws DataNotFoundException {
        ExamSimulationAttempt attempt = loadLocked(userId, attemptId);
        sync(attempt);
        if (attempt.getStatus() == SimulationAttemptStatus.IN_PROGRESS) {
            Integer max = attempt.getProfileSnapshot().maxResumes();
            if (max != null && attempt.getResumeCount() >= max) {
                throw new ExamSimulationException(HttpStatus.FORBIDDEN, "RESUME_NOT_ALLOWED", "This exam cannot be resumed again.");
            }
            attempt.setResumeCount(attempt.getResumeCount() + 1);
            attempt.setUpdatedAt(Instant.now(clock));
            attemptRepository.save(attempt);
            audit.record(ExamSimulationAuditService.ATTEMPT, attemptId, "RESUMED", null, null, userId, Map.of("resumeCount", attempt.getResumeCount()));
        }
        return state(attempt);
    }

    /** Current server-side state without counting as a resume (also advances overdue stages). */
    @Transactional
    public AttemptState getState(String userId, String attemptId) throws DataNotFoundException {
        ExamSimulationAttempt attempt = loadLocked(userId, attemptId);
        sync(attempt);
        return state(attempt);
    }

    // ================================================================ answers

    @Transactional
    public SaveAnswersResponse saveAnswers(String userId, String attemptId, SaveAnswersRequest request) throws DataNotFoundException {
        ExamSimulationAttempt attempt = loadLocked(userId, attemptId);
        sync(attempt);
        requireInProgress(attempt);
        List<AnswerItem> items = request != null && request.answers() != null ? request.answers() : List.of();
        if (items.size() > MAX_ANSWERS_PER_REQUEST) throw ExamSimulationException.badRequest("TOO_MANY_ANSWERS", "At most " + MAX_ANSWERS_PER_REQUEST + " answers per request.");

        ProfileSnapshot profile = attempt.getProfileSnapshot();
        List<ExamSimulationAttemptPart> parts = partRepository.findByAttemptIdOrderByPartKeyAscOrdinalAsc(attemptId);
        Map<String, ExamSimulationAnswer> existing = new HashMap<>();
        answerRepository.findByAttemptId(attemptId).forEach(a -> existing.put(a.getPartKey() + "|" + a.getQuestionId(), a));
        long now = clock.millis();

        int saved = 0;
        List<RejectedAnswer> rejected = new ArrayList<>();
        for (AnswerItem item : items) {
            String reason = rejectionReason(profile, attempt.getStages(), parts, item, now);
            if (reason != null) {
                rejected.add(new RejectedAnswer(item.partKey(), item.questionId(), reason));
                continue;
            }
            String key = item.partKey() + "|" + item.questionId();
            ExamSimulationAnswer stored = existing.get(key);
            long ts = item.clientTs() != null ? item.clientTs() : now;
            if (stored != null && stored.getClientTs() > ts) {
                saved++; // a delayed retry of an older edit: already superseded, nothing to do
                continue;
            }
            if (stored == null) {
                stored = new ExamSimulationAnswer();
                stored.setAttemptId(attemptId);
                stored.setPartKey(item.partKey());
                stored.setQuestionId(item.questionId());
                existing.put(key, stored);
            }
            stored.setAnswer(item.answer());
            stored.setFlagged(item.flagged());
            stored.setClientTs(ts);
            stored.setSavedAt(Instant.ofEpochMilli(now));
            answerRepository.save(stored);
            saved++;
        }
        StageState current = ExamStageClock.current(attempt.getStages());
        long remaining = current.isRunning() ? Math.max(0, (long) Math.ceil((current.deadlineAtMs() - now) / 1000.0)) : 0;
        return new SaveAnswersResponse(saved, rejected, attempt.getStatus(), now, attempt.getStages().size() - 1, remaining, !current.isRunning());
    }

    private String rejectionReason(ProfileSnapshot profile, List<StageState> stages, List<ExamSimulationAttemptPart> parts, AnswerItem item, long now) {
        if (item == null || item.partKey() == null || item.questionId() == null) return "INVALID_ITEM";
        ExamPartConfig part = profile.config().part(item.partKey());
        if (part == null) return "UNKNOWN_PART";

        StageState stage = stages.stream().filter(s -> s.timerKey().equals(part.timerKey())).findFirst().orElse(null);
        if (stage == null) return "SECTION_NOT_STARTED";
        boolean open = stage.isRunning() && now < stage.deadlineAtMs()
                || StageState.EXPIRED.equals(stage.endReason()) && now <= stage.endedAtMs() + graceMs;
        if (!open) return "SECTION_LOCKED";

        PartScoringMethod method = ExamScoringService.effectiveMethod(profile, part);
        String id = item.questionId();
        int limit = MAX_ANSWER_LENGTH;
        if (WRITING_TEXT_ID.equals(id)) {
            if (part.module() != ExamPartModule.WRITTEN || method != PartScoringMethod.MANUAL_RUBRIC) return "UNKNOWN_QUESTION";
            limit = MAX_TEXT_LENGTH;
        } else if (DONE_ID.equals(id)) {
            if (part.module() != ExamPartModule.ORAL && method != PartScoringMethod.UNSCORED) return "UNKNOWN_QUESTION";
        } else if (parts.stream().noneMatch(p -> p.getPartKey().equals(part.key())
                && p.getSnapshot().questionsOrEmpty().stream().anyMatch(q -> id.equals(q.getId())))) {
            return "UNKNOWN_QUESTION";
        }
        if (item.answer() != null && item.answer().length() > limit) return "ANSWER_TOO_LONG";
        return null;
    }

    // ================================================================ sections / submit / cancel

    /** Ends the running section early (irreversible); the next section starts now. Completing the last section submits the exam. */
    @Transactional
    public AttemptState completeCurrentStage(String userId, String attemptId) throws DataNotFoundException {
        ExamSimulationAttempt attempt = loadLocked(userId, attemptId);
        sync(attempt);
        requireInProgress(attempt);
        List<ExamTimerConfig> timers = attempt.getProfileSnapshot().config().timersOrEmpty();
        StageState current = ExamStageClock.current(attempt.getStages());
        if (!current.isRunning()) {
            finalizeAttempt(attempt, SimulationAttemptStatus.EXPIRED, "TIME_EXPIRED", ExamSimulationAuditService.SYSTEM);
            return state(attempt);
        }
        List<StageState> updated = ExamStageClock.completeCurrent(timers, attempt.getStages(), clock.millis());
        audit.record(ExamSimulationAuditService.ATTEMPT, attemptId, "STAGE_COMPLETED", null, null, userId, Map.of("stage", current.timerKey()));
        applyStages(attempt, updated, timers);
        if (ExamStageClock.allStagesEnded(timers, updated)) {
            finalizeAttempt(attempt, SimulationAttemptStatus.COMPLETED, "SUBMITTED", userId);
        } else {
            attemptRepository.save(attempt);
        }
        return state(attempt);
    }

    /** Final submission. Idempotent: submitting a finished attempt again returns the stored result without re-scoring. */
    @Transactional
    public ResultResponse submit(String userId, String attemptId) throws DataNotFoundException {
        ExamSimulationAttempt attempt = loadLocked(userId, attemptId);
        if (attempt.getStatus() == SimulationAttemptStatus.CANCELLED) {
            throw ExamSimulationException.conflict("ATTEMPT_CANCELLED", "This exam attempt was cancelled.");
        }
        if (!attempt.getStatus().isFinished()) {
            sync(attempt);
            if (attempt.getStatus() == SimulationAttemptStatus.IN_PROGRESS) {
                finalizeAttempt(attempt, SimulationAttemptStatus.COMPLETED, "SUBMITTED", userId);
            }
        }
        return resultOf(attempt);
    }

    @Transactional
    public AttemptSummary cancel(String userId, String attemptId) throws DataNotFoundException {
        ExamSimulationAttempt attempt = loadLocked(userId, attemptId);
        if (attempt.getStatus() == SimulationAttemptStatus.CANCELLED) return views.summary(attempt);
        if (attempt.getStatus().isFinished()) {
            throw ExamSimulationException.conflict("ATTEMPT_ALREADY_FINISHED", "A finished exam cannot be cancelled.");
        }
        Instant now = Instant.now(clock);
        List<StageState> stages = new ArrayList<>(attempt.getStages());
        StageState last = stages.get(stages.size() - 1);
        if (last.isRunning()) stages.set(stages.size() - 1, last.ended(now.toEpochMilli(), StageState.COMPLETED));
        attempt.setStages(stages);
        attempt.setStatus(SimulationAttemptStatus.CANCELLED);
        attempt.setFinishReason("CANCELLED");
        attempt.setEndedAt(now);
        attempt.setUpdatedAt(now);
        attemptRepository.save(attempt);
        // The usage ledger is deliberately untouched: a cancelled exam keeps its exercises consumed.
        audit.record(ExamSimulationAuditService.ATTEMPT, attemptId, "CANCELLED", SimulationAttemptStatus.IN_PROGRESS.name(), SimulationAttemptStatus.CANCELLED.name(), userId, null);
        return views.summary(attempt);
    }

    @Transactional
    public ResultResponse getResult(String userId, String attemptId) throws DataNotFoundException {
        ExamSimulationAttempt attempt = loadLocked(userId, attemptId);
        sync(attempt);
        if (attempt.getStatus() == SimulationAttemptStatus.IN_PROGRESS) {
            throw ExamSimulationException.conflict("ATTEMPT_IN_PROGRESS", "The exam is still in progress.");
        }
        if (attempt.getStatus() == SimulationAttemptStatus.CANCELLED) {
            throw ExamSimulationException.conflict("ATTEMPT_CANCELLED", "This exam attempt was cancelled and has no result.");
        }
        return resultOf(attempt);
    }

    @Transactional(readOnly = true)
    public HistoryResponse history(String userId) {
        List<ExamSimulationAttempt> attempts = attemptRepository.findByUserIdOrderByStartedAtDesc(userId);
        return historyOf(attempts);
    }

    HistoryResponse historyOf(List<ExamSimulationAttempt> attempts) {
        List<AttemptSummary> summaries = attempts.stream().map(views::summary).toList();
        List<ProgressPoint> progress = attempts.stream()
                .filter(a -> a.getResult() != null && a.getEndedAt() != null && (a.getStatus() == SimulationAttemptStatus.COMPLETED || a.getStatus() == SimulationAttemptStatus.EXPIRED))
                .sorted(java.util.Comparator.comparing(ExamSimulationAttempt::getEndedAt))
                .map(a -> new ProgressPoint(a.getId(), a.getEndedAt().toEpochMilli(), a.getResult().writtenScore(), a.getResult().writtenPercentage(), a.getResult().writtenComplete()))
                .toList();
        return new HistoryResponse(summaries, progress);
    }

    // ================================================================ scheduler hook

    /** Finalises one overdue attempt (called per attempt by the scheduler). @return true if it was expired */
    @Transactional
    public boolean expireIfOverdue(String attemptId) {
        Optional<ExamSimulationAttempt> found = attemptRepository.findByIdForUpdate(attemptId);
        if (found.isEmpty()) return false;
        ExamSimulationAttempt attempt = found.get();
        if (attempt.getStatus() != SimulationAttemptStatus.IN_PROGRESS) return false;
        sync(attempt);
        return attempt.getStatus() == SimulationAttemptStatus.EXPIRED;
    }

    public long graceMillis() {
        return graceMs;
    }

    // ================================================================ internals

    private ExamSimulationAttempt loadLocked(String userId, String attemptId) throws DataNotFoundException {
        ExamSimulationAttempt attempt = attemptRepository.findByIdForUpdate(attemptId).orElseThrow(() -> new DataNotFoundException(ATTEMPT_NOT_FOUND));
        // Ownership: other learners' attempts look exactly like missing ones.
        if (!attempt.getUserId().equals(userId)) throw new DataNotFoundException(ATTEMPT_NOT_FOUND);
        return attempt;
    }

    private void requireInProgress(ExamSimulationAttempt attempt) {
        switch (attempt.getStatus()) {
            case IN_PROGRESS -> { }
            case EXPIRED -> throw ExamSimulationException.conflict("EXAM_EXPIRED", "The exam time is over.");
            case CANCELLED -> throw ExamSimulationException.conflict("ATTEMPT_CANCELLED", "This exam attempt was cancelled.");
            default -> throw ExamSimulationException.conflict("ATTEMPT_COMPLETED", "This exam attempt is already completed.");
        }
    }

    /** Applies elapsed deadlines to the stage timeline and finalises the attempt once its last stage is over. */
    void sync(ExamSimulationAttempt attempt) {
        if (attempt.getStatus() != SimulationAttemptStatus.IN_PROGRESS) return;
        List<ExamTimerConfig> timers = attempt.getProfileSnapshot().config().timersOrEmpty();
        long now = clock.millis();
        List<StageState> advanced = ExamStageClock.advance(timers, attempt.getStages(), now);
        if (!advanced.equals(attempt.getStages())) {
            for (int i = 0; i < advanced.size(); i++) {
                boolean wasEnded = i < attempt.getStages().size() && !attempt.getStages().get(i).isRunning();
                if (!wasEnded && !advanced.get(i).isRunning()) {
                    audit.record(ExamSimulationAuditService.ATTEMPT, attempt.getId(), "STAGE_EXPIRED", null, null, ExamSimulationAuditService.SYSTEM,
                            Map.of("stage", advanced.get(i).timerKey()));
                }
            }
            applyStages(attempt, advanced, timers);
            attemptRepository.save(attempt);
        }
        if (ExamStageClock.examOver(timers, attempt.getStages(), now, graceMs)) {
            finalizeAttempt(attempt, SimulationAttemptStatus.EXPIRED, "TIME_EXPIRED", ExamSimulationAuditService.SYSTEM);
        }
    }

    private void applyStages(ExamSimulationAttempt attempt, List<StageState> stages, List<ExamTimerConfig> timers) {
        attempt.setStages(stages);
        attempt.setFinalDeadlineAt(Instant.ofEpochMilli(ExamStageClock.finalDeadlineMs(timers, stages)));
        attempt.setUpdatedAt(Instant.now(clock));
    }

    /** Scores the attempt from its stored answers and moves it to a final state. Runs at most once per attempt. */
    private void finalizeAttempt(ExamSimulationAttempt attempt, SimulationAttemptStatus target, String reason, String actor) {
        if (attempt.getStatus() != SimulationAttemptStatus.IN_PROGRESS) return;
        Instant now = Instant.now(clock);
        List<StageState> stages = new ArrayList<>(attempt.getStages());
        StageState last = stages.get(stages.size() - 1);
        if (last.isRunning()) stages.set(stages.size() - 1, last.ended(now.toEpochMilli(), StageState.COMPLETED));
        attempt.setStages(stages);

        ensureAssessments(attempt);
        attempt.setResult(computeResult(attempt));
        attempt.setStatus(target);
        attempt.setFinishReason(reason);
        // For expired exams the end is the last deadline, not the (later) moment the scheduler noticed.
        StageState finished = stages.get(stages.size() - 1);
        attempt.setEndedAt(target == SimulationAttemptStatus.EXPIRED && finished.endedAtMs() != null ? Instant.ofEpochMilli(finished.endedAtMs()) : now);
        attempt.setUpdatedAt(now);
        attemptRepository.save(attempt);
        audit.record(ExamSimulationAuditService.ATTEMPT, attempt.getId(), target == SimulationAttemptStatus.EXPIRED ? "EXPIRED" : "SUBMITTED",
                SimulationAttemptStatus.IN_PROGRESS.name(), target.name(), actor,
                Map.of("overallResult", attempt.getResult().overallResult().name(), "writtenResult", attempt.getResult().writtenResult().name()));
    }

    /** Creates the pending assessment rows of manually scored parts; blank written submissions are scored 0 by rule, not by guess. */
    private void ensureAssessments(ExamSimulationAttempt attempt) {
        ProfileSnapshot profile = attempt.getProfileSnapshot();
        Map<String, String> answers = new HashMap<>();
        answerRepository.findByAttemptId(attempt.getId()).forEach(a -> answers.put(a.getPartKey() + "|" + a.getQuestionId(), a.getAnswer()));
        for (ExamPartConfig part : profile.config().partsOrEmpty()) {
            if (ExamScoringService.effectiveMethod(profile, part) != PartScoringMethod.MANUAL_RUBRIC) continue;
            if (assessmentRepository.findByAttemptIdAndPartKeyAndSource(attempt.getId(), part.key(), AssessmentSource.MANUAL).isPresent()) continue;
            ExamSimulationAssessment assessment = new ExamSimulationAssessment();
            assessment.setAttemptId(attempt.getId());
            assessment.setPartKey(part.key());
            assessment.setSource(AssessmentSource.MANUAL);
            String text = answers.get(part.key() + "|" + WRITING_TEXT_ID);
            boolean blankWriting = part.module() == ExamPartModule.WRITTEN && (text == null || text.isBlank());
            if (blankWriting) {
                assessment.setStatus(AssessmentStatus.ASSESSED);
                assessment.setPoints(java.math.BigDecimal.ZERO);
                assessment.setCriteriaScores(new LinkedHashMap<>());
                assessment.setComment("Keine Abgabe");
                assessment.setAssessorId(ExamSimulationAuditService.SYSTEM);
                assessment.setAssessedAt(Instant.now(clock));
            } else {
                assessment.setStatus(AssessmentStatus.AWAITING);
            }
            assessmentRepository.save(assessment);
        }
    }

    ExamResult computeResult(ExamSimulationAttempt attempt) {
        ProfileSnapshot profile = attempt.getProfileSnapshot();
        List<ExamSimulationAttemptPart> parts = partRepository.findByAttemptIdOrderByPartKeyAscOrdinalAsc(attempt.getId());
        List<ExamSimulationAnswer> answers = answerRepository.findByAttemptId(attempt.getId());
        List<ExamSimulationAssessment> assessments = assessmentRepository.findByAttemptId(attempt.getId());

        Map<String, ExamResultCalculator.PartInput> inputs = new HashMap<>();
        for (ExamPartConfig part : profile.config().partsOrEmpty()) {
            List<ExerciseSnapshot> exercises = parts.stream().filter(p -> p.getPartKey().equals(part.key()))
                    .sorted(java.util.Comparator.comparingInt(ExamSimulationAttemptPart::getOrdinal)).map(ExamSimulationAttemptPart::getSnapshot).toList();
            Map<String, String> byQuestion = new HashMap<>();
            answers.stream().filter(a -> a.getPartKey().equals(part.key()) && a.getAnswer() != null).forEach(a -> byQuestion.put(a.getQuestionId(), a.getAnswer()));
            boolean completed = "true".equals(byQuestion.get(DONE_ID)) || byQuestion.get(WRITING_TEXT_ID) != null && !byQuestion.get(WRITING_TEXT_ID).isBlank();
            PartScoringContext.Assessment assessment = assessments.stream()
                    .filter(x -> x.getPartKey().equals(part.key()) && x.getSource() == AssessmentSource.MANUAL).findFirst()
                    .map(x -> new PartScoringContext.Assessment(x.getStatus() == AssessmentStatus.ASSESSED, x.getPoints(), x.getCriteriaScores(), x.getComment()))
                    .orElse(null);
            inputs.put(part.key(), new ExamResultCalculator.PartInput(exercises, byQuestion, completed, assessment));
        }
        return calculator.calculate(profile, inputs);
    }

    private AttemptState state(ExamSimulationAttempt attempt) {
        List<ExamSimulationAttemptPart> parts = partRepository.findByAttemptIdOrderByPartKeyAscOrdinalAsc(attempt.getId());
        List<ExamSimulationAnswer> answers = answerRepository.findByAttemptId(attempt.getId());
        boolean timeUp = attempt.getStatus() == SimulationAttemptStatus.IN_PROGRESS && !ExamStageClock.current(attempt.getStages()).isRunning();
        return views.state(attempt, parts, answers, timeUp);
    }

    ResultResponse resultOf(ExamSimulationAttempt attempt) {
        return views.result(attempt, partRepository.findByAttemptIdOrderByPartKeyAscOrdinalAsc(attempt.getId()), answerRepository.findByAttemptId(attempt.getId()));
    }
}
