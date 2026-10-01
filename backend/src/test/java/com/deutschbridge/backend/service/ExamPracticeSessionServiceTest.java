package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamPracticeSessionCompleteRequest;
import com.deutschbridge.backend.model.dto.ExamPracticeSessionResponse;
import com.deutschbridge.backend.model.dto.ExamPracticeSessionResultResponse;
import com.deutschbridge.backend.model.dto.ExamPracticeSessionStartRequest;
import com.deutschbridge.backend.model.entity.ExamAnswerRecord;
import com.deutschbridge.backend.model.entity.ExamAttempt;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamPracticeSession;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.ExamPracticeScope;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamTimeMode;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExamAttemptRepository;
import com.deutschbridge.backend.repository.ExamPracticeSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExamPracticeSessionServiceTest {

    @Mock
    private ExamPracticeSessionRepository sessionRepository;
    @Mock
    private ExamAttemptRepository attemptRepository;
    @Mock
    private ExamExerciseService examExerciseService;
    @Mock
    private ExamTimeConfigurationService timeConfigurationService;
    @Mock
    private UserService userService;
    @Mock
    private RequestContext requestContext;

    private ExamPracticeSessionService service;
    private final User user = new User();

    @BeforeEach
    void setUp() {
        service = new ExamPracticeSessionService(sessionRepository, attemptRepository, examExerciseService,
                timeConfigurationService, userService, requestContext);
        lenient().when(requestContext.getUserId()).thenReturn("user-1");
        lenient().when(requestContext.getUserEmail()).thenReturn("a@b.c");
        lenient().when(userService.findByEmail("a@b.c")).thenReturn(user);
        lenient().when(sessionRepository.save(any(ExamPracticeSession.class))).thenAnswer(i -> i.getArgument(0));
    }

    private static ExamPracticeSessionStartRequest teilRequest(ExamTimeMode mode) {
        return new ExamPracticeSessionStartRequest(ExamPracticeScope.TEIL, mode, null,
                ExamSection.LESEVERSTEHEN, LearningLevel.B1, 2);
    }

    private ExamPracticeSession runningSession(ExamPracticeScope scope, Instant startedAt) {
        ExamPracticeSession s = new ExamPracticeSession();
        s.setId("s1");
        s.setUserId("user-1");
        s.setScope(scope);
        s.setMode(ExamTimeMode.TIME_TRAINING);
        s.setSection(ExamSection.LESEVERSTEHEN);
        s.setLevel(LearningLevel.B1);
        s.setTeil(2);
        s.setStartedAt(startedAt);
        s.setTargetSeconds(1200);
        when(sessionRepository.findById("s1")).thenReturn(Optional.of(s));
        return s;
    }

    private ExamExercise exercise(String id, int partNumber, int questions) {
        ExamExercise e = new ExamExercise();
        e.setId(id);
        e.setSection(ExamSection.LESEVERSTEHEN);
        e.setTaskType(ExamTaskType.MULTIPLE_CHOICE);
        e.setLevel(LearningLevel.B1);
        e.setPartNumber(partNumber);
        e.setQuestions(java.util.stream.IntStream.range(0, questions).mapToObj(i -> new ExamQuestion()).toList());
        return e;
    }

    private ExamAttempt attempt(ExamExercise exercise, int correct, int wrong, LocalDateTime completedAt) {
        ExamAttempt a = new ExamAttempt();
        a.setExercise(exercise);
        a.setCompletedAt(completedAt);
        java.util.ArrayList<ExamAnswerRecord> answers = new java.util.ArrayList<>();
        for (int i = 0; i < correct; i++) answers.add(new ExamAnswerRecord("q" + i, "x", true, null, null, null));
        for (int i = 0; i < wrong; i++) answers.add(new ExamAnswerRecord("w" + i, "x", false, null, null, null));
        a.setAnswers(answers);
        return a;
    }

    @Test
    @DisplayName("a time-training Teil session gets its target from the configuration")
    void teilSessionResolvesTarget() throws DataNotFoundException {
        when(timeConfigurationService.targetSeconds(LearningLevel.B1, ExamSection.LESEVERSTEHEN, 2))
                .thenReturn(Optional.of(1200));

        ExamPracticeSessionResponse response = service.start(teilRequest(ExamTimeMode.TIME_TRAINING));

        assertEquals(1200, response.targetSeconds());
        assertNotNull(response.startedAt());
    }

    @Test
    @DisplayName("practice mode never carries a target")
    void practiceModeHasNoTarget() throws DataNotFoundException {
        ExamPracticeSessionResponse response = service.start(teilRequest(ExamTimeMode.PRACTICE));

        assertNull(response.targetSeconds());
        verifyNoInteractions(timeConfigurationService);
    }

    @Test
    @DisplayName("missing configuration starts the session without a target instead of failing")
    void missingConfigurationStillStarts() throws DataNotFoundException {
        when(timeConfigurationService.targetSeconds(any(), any(), anyInt())).thenReturn(Optional.empty());

        ExamPracticeSessionResponse response = service.start(teilRequest(ExamTimeMode.TIME_TRAINING));

        assertNull(response.targetSeconds());
    }

    @Test
    @DisplayName("an exercise session takes section, level and Teil from the exercise and is timed against that Teil's target")
    void exerciseSessionUsesTeilTarget() throws DataNotFoundException {
        when(examExerciseService.findById("e1")).thenReturn(exercise("e1", 3, 5));
        when(timeConfigurationService.targetSeconds(LearningLevel.B1, ExamSection.LESEVERSTEHEN, 3))
                .thenReturn(Optional.of(1200));

        ExamPracticeSessionResponse response = service.start(new ExamPracticeSessionStartRequest(
                ExamPracticeScope.EXERCISE, ExamTimeMode.TIME_TRAINING, "e1", null, null, null));

        assertEquals(3, response.teil());
        assertEquals("B1", response.level());
        assertEquals(1200, response.targetSeconds());
    }

    @Test
    @DisplayName("an exercise without a level has no timing configuration to look up")
    void exerciseWithoutLevelHasNoTarget() throws DataNotFoundException {
        ExamExercise levelless = exercise("e1", 1, 2);
        levelless.setLevel(null);
        when(examExerciseService.findById("e1")).thenReturn(levelless);

        ExamPracticeSessionResponse response = service.start(new ExamPracticeSessionStartRequest(
                ExamPracticeScope.EXERCISE, ExamTimeMode.TIME_TRAINING, "e1", null, null, null));

        assertNull(response.targetSeconds());
        verifyNoInteractions(timeConfigurationService);
    }

    @Test
    @DisplayName("a Teil session requires section, level and Teil")
    void teilSessionRequiresIdentity() {
        assertThrows(IllegalArgumentException.class, () -> service.start(new ExamPracticeSessionStartRequest(
                ExamPracticeScope.TEIL, ExamTimeMode.PRACTICE, null, ExamSection.LESEVERSTEHEN, null, 1)));
    }

    @Test
    @DisplayName("elapsed time comes from the server clock, minus reported pause time")
    void elapsedIsServerDerived() throws DataNotFoundException {
        runningSession(ExamPracticeScope.TEIL, Instant.now().minus(600, ChronoUnit.SECONDS));
        when(attemptRepository.findByUserAndCompletedAtGreaterThanEqual(any(), any())).thenReturn(List.of());

        ExamPracticeSessionResultResponse result = service.complete("s1", new ExamPracticeSessionCompleteRequest(100));

        assertTrue(result.elapsedSeconds() >= 499 && result.elapsedSeconds() <= 502, "was " + result.elapsedSeconds());
        assertEquals(result.elapsedSeconds() - 1200, result.differenceSeconds());
    }

    @Test
    @DisplayName("a client cannot claim more pause time than the session has existed")
    void pausedSecondsAreClamped() throws DataNotFoundException {
        runningSession(ExamPracticeScope.TEIL, Instant.now().minus(60, ChronoUnit.SECONDS));
        when(attemptRepository.findByUserAndCompletedAtGreaterThanEqual(any(), any())).thenReturn(List.of());

        ExamPracticeSessionResultResponse result = service.complete("s1", new ExamPracticeSessionCompleteRequest(99999));

        assertEquals(0, result.elapsedSeconds());
    }

    @Test
    @DisplayName("negative or missing pause time is ignored")
    void negativePauseIgnored() throws DataNotFoundException {
        runningSession(ExamPracticeScope.TEIL, Instant.now().minus(60, ChronoUnit.SECONDS));
        when(attemptRepository.findByUserAndCompletedAtGreaterThanEqual(any(), any())).thenReturn(List.of());

        ExamPracticeSessionResultResponse result = service.complete("s1", new ExamPracticeSessionCompleteRequest(-500));

        assertTrue(result.elapsedSeconds() >= 59 && result.elapsedSeconds() <= 62);
    }

    @Test
    @DisplayName("Teil sessions total the latest attempt per exercise in that Teil only")
    void teilStatsCoverMatchingExercisesOnly() throws DataNotFoundException {
        ExamPracticeSession session = runningSession(ExamPracticeScope.TEIL, Instant.now().minus(600, ChronoUnit.SECONDS));
        ExamExercise inTeil = exercise("e1", 2, 4);
        ExamExercise otherTeil = exercise("e2", 1, 10);
        LocalDateTime now = LocalDateTime.now();
        when(attemptRepository.findByUserAndCompletedAtGreaterThanEqual(any(), any())).thenReturn(List.of(
                attempt(inTeil, 1, 3, now.minusMinutes(5)),   // superseded by the retry below
                attempt(inTeil, 3, 1, now.minusMinutes(1)),
                attempt(otherTeil, 10, 0, now)));

        ExamPracticeSessionResultResponse result = service.complete("s1", null);

        assertEquals(4, result.questionsTotal());
        assertEquals(4, result.questionsAnswered());
        assertEquals(3, result.correctAnswers());
        assertEquals(75.0, result.score());
        assertNotNull(session.getCompletedAt());
    }

    @Test
    @DisplayName("exercise-scope stats only count that exercise")
    void exerciseStatsCoverOneExercise() throws DataNotFoundException {
        ExamPracticeSession session = runningSession(ExamPracticeScope.EXERCISE, Instant.now().minus(60, ChronoUnit.SECONDS));
        session.setExerciseId("e1");
        when(attemptRepository.findByUserAndCompletedAtGreaterThanEqual(any(), any())).thenReturn(List.of(
                attempt(exercise("e1", 2, 2), 2, 0, LocalDateTime.now()),
                attempt(exercise("e9", 2, 5), 0, 5, LocalDateTime.now())));

        ExamPracticeSessionResultResponse result = service.complete("s1", null);

        assertEquals(2, result.questionsTotal());
        assertEquals(100.0, result.score());
    }

    @Test
    @DisplayName("a session with no finished attempts is completed with zero counts and no score")
    void incompleteSessionHandled() throws DataNotFoundException {
        runningSession(ExamPracticeScope.TEIL, Instant.now().minus(60, ChronoUnit.SECONDS));
        when(attemptRepository.findByUserAndCompletedAtGreaterThanEqual(any(), any())).thenReturn(List.of());

        ExamPracticeSessionResultResponse result = service.complete("s1", null);

        assertEquals(0, result.questionsTotal());
        assertNull(result.score());
    }

    @Test
    @DisplayName("completing twice returns the stored result without recomputing it")
    void completeIsIdempotent() throws DataNotFoundException {
        ExamPracticeSession session = runningSession(ExamPracticeScope.TEIL, Instant.now().minus(60, ChronoUnit.SECONDS));
        session.setCompletedAt(Instant.now());
        session.setElapsedSeconds(42);

        ExamPracticeSessionResultResponse result = service.complete("s1", new ExamPracticeSessionCompleteRequest(0));

        assertEquals(42, result.elapsedSeconds());
        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("another user's session is reported as not found")
    void otherUsersSessionIsHidden() {
        ExamPracticeSession session = runningSession(ExamPracticeScope.TEIL, Instant.now());
        session.setUserId("someone-else");

        assertThrows(DataNotFoundException.class, () -> service.complete("s1", null));
    }

    private ExamPracticeSession finished(int teil, int elapsed, Integer target) {
        ExamPracticeSession s = new ExamPracticeSession();
        s.setSection(ExamSection.LESEVERSTEHEN);
        s.setLevel(LearningLevel.B1);
        s.setTeil(teil);
        s.setElapsedSeconds(elapsed);
        s.setTargetSeconds(target);
        return s;
    }

    @Test
    @DisplayName("week summary counts only finished runs that were measured against a target")
    void weekSummaryCountsTimedRunsOnly() {
        when(sessionRepository.findByUserIdAndCompletedAtGreaterThanEqual(eq("user-1"), any())).thenReturn(List.of(
                finished(1, 600, 900), finished(2, 700, 1200), finished(2, 300, null)));

        assertEquals(2, service.weekSummary().timedExercisesThisWeek());
    }

    @Test
    @DisplayName("time management averages per Teil, compares with today's target and skips untouched Teile")
    void timeManagementAveragesPerTeil() {
        when(sessionRepository.findByUserIdAndLevelAndCompletedAtIsNotNull("user-1", LearningLevel.B1)).thenReturn(List.of(
                finished(2, 1200, 1200), finished(2, 1500, 1200), finished(1, 600, 900)));
        when(timeConfigurationService.targetSeconds(LearningLevel.B1, ExamSection.LESEVERSTEHEN, 1)).thenReturn(Optional.of(900));
        when(timeConfigurationService.targetSeconds(LearningLevel.B1, ExamSection.LESEVERSTEHEN, 2)).thenReturn(Optional.empty());

        var rows = service.timeManagement(LearningLevel.B1);

        assertEquals(2, rows.size());
        assertEquals(1, rows.get(0).teil());
        assertEquals(-300, rows.get(0).differenceSeconds());
        assertEquals(2, rows.get(1).teil());
        assertEquals(1350, rows.get(1).averageSeconds());
        assertEquals(2, rows.get(1).sessions());
        assertNull(rows.get(1).targetSeconds());
        assertNull(rows.get(1).differenceSeconds());
    }

    @Test
    @DisplayName("last times keep only the newest finished run per exercise")
    void lastTimesKeepNewestPerExercise() {
        ExamPracticeSession newest = finished(1, 600, 1800);
        newest.setExerciseId("e1");
        ExamPracticeSession older = finished(1, 900, 1800);
        older.setExerciseId("e1");
        ExamPracticeSession other = finished(1, 300, null);
        other.setExerciseId("e2");
        ExamPracticeSession noExercise = finished(1, 100, null);
        when(sessionRepository.findByUserIdAndScopeAndSectionAndLevelAndCompletedAtIsNotNullOrderByCompletedAtDesc(
                "user-1", ExamPracticeScope.EXERCISE, ExamSection.LESEVERSTEHEN, LearningLevel.B1))
                .thenReturn(List.of(newest, older, other, noExercise));

        var times = service.lastTimes(ExamSection.LESEVERSTEHEN, LearningLevel.B1);

        assertEquals(2, times.size());
        assertEquals(600, times.get(0).elapsedSeconds());
        assertEquals("e2", times.get(1).exerciseId());
        assertNull(times.get(1).targetSeconds());
    }
}
