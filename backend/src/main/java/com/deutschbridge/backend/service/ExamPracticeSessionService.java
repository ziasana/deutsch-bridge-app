package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamExerciseLastTimeResponse;
import com.deutschbridge.backend.model.dto.ExamPracticeSessionCompleteRequest;
import com.deutschbridge.backend.model.dto.ExamPracticeSessionResponse;
import com.deutschbridge.backend.model.dto.ExamPracticeSessionResultResponse;
import com.deutschbridge.backend.model.dto.ExamPracticeSessionStartRequest;
import com.deutschbridge.backend.model.dto.ExamTimeManagementRowResponse;
import com.deutschbridge.backend.model.dto.ExamTimeWeekSummaryResponse;
import com.deutschbridge.backend.model.entity.ExamAnswerRecord;
import com.deutschbridge.backend.model.entity.ExamAttempt;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamPracticeSession;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.ExamPracticeScope;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTimeMode;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExamAttemptRepository;
import com.deutschbridge.backend.repository.ExamPracticeSessionRepository;
import com.deutschbridge.backend.util.ExamTeilResolver;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.DayOfWeek;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.LinkedHashMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Records timed practice runs. The server stamps startedAt and completedAt and derives the
 * duration itself; the client only reports how long it was paused. Question counts and score come
 * from the learner's own completed attempts, never from the request.
 */
@Service
public class ExamPracticeSessionService {

    private static final String SESSION_NOT_FOUND_MSG = "Practice session not found!";

    private final ExamPracticeSessionRepository sessionRepository;
    private final ExamAttemptRepository attemptRepository;
    private final ExamExerciseService examExerciseService;
    private final ExamTimeConfigurationService timeConfigurationService;
    private final UserService userService;
    private final RequestContext requestContext;

    public ExamPracticeSessionService(ExamPracticeSessionRepository sessionRepository,
                                      ExamAttemptRepository attemptRepository,
                                      ExamExerciseService examExerciseService,
                                      ExamTimeConfigurationService timeConfigurationService,
                                      UserService userService,
                                      RequestContext requestContext) {
        this.sessionRepository = sessionRepository;
        this.attemptRepository = attemptRepository;
        this.examExerciseService = examExerciseService;
        this.timeConfigurationService = timeConfigurationService;
        this.userService = userService;
        this.requestContext = requestContext;
    }

    @Transactional
    public ExamPracticeSessionResponse start(ExamPracticeSessionStartRequest request) throws DataNotFoundException {
        if (request == null || request.scope() == null || request.mode() == null) {
            throw new IllegalArgumentException("Scope and mode are required");
        }

        ExamPracticeSession session = new ExamPracticeSession();
        session.setUserId(requestContext.getUserId());
        session.setScope(request.scope());
        session.setMode(request.mode());
        session.setStartedAt(Instant.now());

        if (request.scope() == ExamPracticeScope.EXERCISE) {
            applyExercise(session, request);
        } else {
            applyTeil(session, request);
        }

        // Every exercise is measured against its Teil's recommended time (a training target, not an exam rule).
        if (request.mode() == ExamTimeMode.TIME_TRAINING && session.getLevel() != null && session.getTeil() != null) {
            timeConfigurationService.targetSeconds(session.getLevel(), session.getSection(), session.getTeil())
                    .ifPresent(session::setTargetSeconds);
        }

        return toResponse(sessionRepository.save(session));
    }

    @Transactional
    public ExamPracticeSessionResultResponse complete(String sessionId, ExamPracticeSessionCompleteRequest request)
            throws DataNotFoundException {
        ExamPracticeSession session = sessionRepository.findById(sessionId)
                .filter(s -> Objects.equals(s.getUserId(), requestContext.getUserId()))
                .orElseThrow(() -> new DataNotFoundException(SESSION_NOT_FOUND_MSG));

        // Completing twice (e.g. a retried request) returns the stored result instead of rewriting it.
        if (session.getCompletedAt() == null) {
            Instant now = Instant.now();
            long wallSeconds = Math.max(0, Duration.between(session.getStartedAt(), now).getSeconds());
            long paused = request != null && request.pausedSeconds() != null ? request.pausedSeconds() : 0;
            long pausedClamped = Math.min(Math.max(paused, 0), wallSeconds);

            session.setCompletedAt(now);
            session.setElapsedSeconds((int) (wallSeconds - pausedClamped));
            applyAttemptStats(session);
            sessionRepository.save(session);
        }
        return toResult(session);
    }

    /** Finished timed exercises since Monday: the dashboard's "this week" figure. */
    public ExamTimeWeekSummaryResponse weekSummary() {
        Instant weekStart = LocalDateTime.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .toLocalDate().atStartOfDay(ZoneId.systemDefault()).toInstant();
        int timed = (int) sessionRepository
                .findByUserIdAndCompletedAtGreaterThanEqual(requestContext.getUserId(), weekStart).stream()
                .filter(s -> s.getTargetSeconds() != null)
                .count();
        return new ExamTimeWeekSummaryResponse(timed);
    }

    /**
     * Average finished time per Teil at a level, next to today's recommended time. Only Teile the
     * learner has actually practised appear, in the usual exam order.
     */
    public List<ExamTimeManagementRowResponse> timeManagement(LearningLevel level) {
        List<ExamPracticeSession> finished = sessionRepository
                .findByUserIdAndLevelAndCompletedAtIsNotNull(requestContext.getUserId(), level);

        return ExamTimeDefaults.SUPPORTED_PARTS.stream()
                .map(part -> {
                    List<Integer> times = finished.stream()
                            .filter(s -> s.getSection() == part.section() && Objects.equals(s.getTeil(), part.teil()))
                            .map(ExamPracticeSession::getElapsedSeconds)
                            .filter(Objects::nonNull)
                            .toList();
                    if (times.isEmpty()) return null;
                    int average = (int) Math.round(times.stream().mapToInt(Integer::intValue).average().orElse(0));
                    Integer target = timeConfigurationService.targetSeconds(level, part.section(), part.teil()).orElse(null);
                    return new ExamTimeManagementRowResponse(part.section().name(), part.teil(), times.size(), average,
                            target, target != null ? average - target : null);
                })
                .filter(Objects::nonNull)
                .toList();
    }

    /** Each exercise's most recent finished time in a section and level, for the exercise list. */
    public List<ExamExerciseLastTimeResponse> lastTimes(ExamSection section, LearningLevel level) {
        Map<String, ExamExerciseLastTimeResponse> latest = new LinkedHashMap<>();
        sessionRepository
                .findByUserIdAndScopeAndSectionAndLevelAndCompletedAtIsNotNullOrderByCompletedAtDesc(
                        requestContext.getUserId(), ExamPracticeScope.EXERCISE, section, level)
                .stream()
                .filter(s -> s.getExerciseId() != null && s.getElapsedSeconds() != null)
                .forEach(s -> latest.putIfAbsent(s.getExerciseId(),
                        new ExamExerciseLastTimeResponse(s.getExerciseId(), s.getElapsedSeconds(), s.getTargetSeconds())));
        return List.copyOf(latest.values());
    }

    private void applyExercise(ExamPracticeSession session, ExamPracticeSessionStartRequest request)
            throws DataNotFoundException {
        if (request.exerciseId() == null || request.exerciseId().isBlank()) {
            throw new IllegalArgumentException("Exercise is required");
        }
        ExamExercise exercise = examExerciseService.findById(request.exerciseId());
        session.setExerciseId(exercise.getId());
        session.setSection(exercise.getSection());
        session.setLevel(exercise.getLevel());
        session.setTeil(ExamTeilResolver.teilOf(exercise));
    }

    private void applyTeil(ExamPracticeSession session, ExamPracticeSessionStartRequest request) {
        if (request.section() == null || request.level() == null || request.teil() == null) {
            throw new IllegalArgumentException("Section, level and Teil are required");
        }
        session.setSection(request.section());
        session.setLevel(request.level());
        session.setTeil(request.teil());
    }

    /** Totals the learner's latest finished attempt per matching exercise since the session started. */
    private void applyAttemptStats(ExamPracticeSession session) {
        User user = userService.findByEmail(requestContext.getUserEmail());
        LocalDateTime since = LocalDateTime.ofInstant(session.getStartedAt(), ZoneId.systemDefault());

        Map<String, ExamAttempt> latestByExercise = new HashMap<>();
        for (ExamAttempt attempt : attemptRepository.findByUserAndCompletedAtGreaterThanEqual(user, since)) {
            if (attempt.getCompletedAt() == null || !matches(session, attempt.getExercise())) continue;
            latestByExercise.merge(attempt.getExercise().getId(), attempt,
                    (a, b) -> a.getCompletedAt().isAfter(b.getCompletedAt()) ? a : b);
        }

        int total = 0;
        int answered = 0;
        int correct = 0;
        for (ExamAttempt attempt : latestByExercise.values()) {
            List<ExamAnswerRecord> answers = attempt.getAnswers() != null ? attempt.getAnswers() : List.of();
            total += attempt.getExercise().getQuestions() != null ? attempt.getExercise().getQuestions().size() : 0;
            answered += answers.size();
            correct += (int) answers.stream().filter(ExamAnswerRecord::isCorrect).count();
        }
        session.setQuestionsTotal(total);
        session.setQuestionsAnswered(answered);
        session.setCorrectAnswers(correct);
        session.setScore(total > 0 ? correct * 100.0 / total : null);
    }

    private static boolean matches(ExamPracticeSession session, ExamExercise exercise) {
        if (exercise == null) return false;
        if (session.getScope() == ExamPracticeScope.EXERCISE) {
            return Objects.equals(session.getExerciseId(), exercise.getId());
        }
        ExamSection section = exercise.getSection();
        LearningLevel level = exercise.getLevel();
        return section == session.getSection()
                && (level == null || level == session.getLevel())
                && Objects.equals(ExamTeilResolver.teilOf(exercise), session.getTeil());
    }

    private static ExamPracticeSessionResponse toResponse(ExamPracticeSession s) {
        return new ExamPracticeSessionResponse(s.getId(), s.getScope().name(), s.getMode().name(),
                s.getSection().name(), s.getLevel() != null ? s.getLevel().getValue() : null, s.getTeil(),
                s.getExerciseId(), s.getStartedAt(), s.getTargetSeconds());
    }

    private static ExamPracticeSessionResultResponse toResult(ExamPracticeSession s) {
        int elapsed = s.getElapsedSeconds() != null ? s.getElapsedSeconds() : 0;
        return new ExamPracticeSessionResultResponse(s.getId(), s.getScope().name(), s.getMode().name(),
                s.getSection().name(), s.getLevel() != null ? s.getLevel().getValue() : null, s.getTeil(),
                elapsed, s.getTargetSeconds(),
                s.getTargetSeconds() != null ? elapsed - s.getTargetSeconds() : null,
                s.getQuestionsTotal() != null ? s.getQuestionsTotal() : 0,
                s.getQuestionsAnswered() != null ? s.getQuestionsAnswered() : 0,
                s.getCorrectAnswers() != null ? s.getCorrectAnswers() : 0,
                s.getScore());
    }
}
