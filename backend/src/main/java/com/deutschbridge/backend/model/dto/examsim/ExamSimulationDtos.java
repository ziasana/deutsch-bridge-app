package com.deutschbridge.backend.model.dto.examsim;

import com.deutschbridge.backend.model.dto.ExamPassagePublic;
import com.deutschbridge.backend.model.dto.ExamQuestionPublic;
import com.deutschbridge.backend.model.enums.AnswerReleasePolicy;
import com.deutschbridge.backend.model.enums.ExamPartModule;
import com.deutschbridge.backend.model.enums.ExamResultStatus;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamTimerKind;
import com.deutschbridge.backend.model.enums.PartScoringMethod;
import com.deutschbridge.backend.model.enums.SimulationAttemptStatus;
import com.deutschbridge.backend.model.examsim.ExamResult;
import com.deutschbridge.backend.model.examsim.RubricCriterion;
import com.deutschbridge.backend.service.examsim.ExamPoolService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** Request/response shapes of the learner and admin exam simulation endpoints. */
public final class ExamSimulationDtos {

    private ExamSimulationDtos() {
    }

    // ---------------------------------------------------------------- requests

    public record StartAttemptRequest(String profileId) {
    }

    public record AnswerItem(String partKey, String questionId, String answer, boolean flagged, Long clientTs) {
    }

    public record SaveAnswersRequest(List<AnswerItem> answers) {
    }

    public record AssessmentRequest(Map<String, BigDecimal> criteriaScores, String comment) {
    }

    // ---------------------------------------------------------------- overview

    public record PartOverview(String key, String label, ExamPartModule module, ExamSection section, int teil, int questionCount,
                               BigDecimal pointsPerQuestion, BigDecimal maxPoints, PartScoringMethod scoringMethod, String stageKey,
                               List<RubricCriterion> rubric, int required, int eligible, int unused) {
    }

    public record StageOverview(String key, String label, int minutes, ExamTimerKind kind, List<String> partKeys) {
    }

    public record AttemptSummary(String id, SimulationAttemptStatus status, int profileVersion, String profileTitle, long startedAtMs, Long endedAtMs,
                                 Long durationSeconds, BigDecimal writtenScore, BigDecimal writtenMax, BigDecimal writtenPercentage,
                                 boolean writtenComplete, ExamResultStatus writtenResult, ExamResultStatus oralResult, ExamResultStatus overallResult,
                                 BigDecimal totalScore, BigDecimal totalMax, boolean awaitingAssessment) {
    }

    public record ProfileOverview(String id, String code, int version, String provider, String examName, String title, String description,
                                  String level, boolean oralScoringEnabled, BigDecimal writtenMaxPoints, BigDecimal writtenPassThreshold,
                                  BigDecimal oralMaxPoints, BigDecimal oralPassThreshold, BigDecimal totalMaxPoints,
                                  AnswerReleasePolicy answerReleasePolicy, int totalMinutes, List<StageOverview> stages, List<PartOverview> parts,
                                  boolean canStart, String blockedReason, String activeAttemptId, boolean activeAttemptPaused, AttemptSummary best, AttemptSummary latest,
                                  int attemptCount) {
    }

    // ---------------------------------------------------------------- public catalogue (no login)

    /** One timed stage of a mock exam, as shown to visitors. */
    public record PublicStage(String label, int minutes) {
    }

    /** One part of a mock exam, as shown to visitors: structure only, never content or user data. */
    public record PublicPart(String label, ExamPartModule module, ExamSection section, int teil, int questionCount, BigDecimal maxPoints) {
    }

    /** A published mock exam as listed on the public site: structure and rules, nothing user specific. */
    public record PublicProfile(String id, String provider, String examName, String title, String description, String level, int totalMinutes,
                                boolean oralScoringEnabled, BigDecimal writtenMaxPoints, BigDecimal writtenPassThreshold,
                                List<PublicStage> stages, List<PublicPart> parts) {
    }

    // ---------------------------------------------------------------- active exam

    public record ExercisePublic(int ordinal, String title, ExamTaskType taskType, String teilDescription, List<ExamPassagePublic> passages,
                                 List<ExamQuestionPublic> questions, List<String> answerOptions, List<String> answerOptionLabels,
                                 boolean requiresPlanning, List<String> leitpunkte, Map<String, Object> speaking) {
    }

    public record PartState(String key, String label, ExamPartModule module, ExamSection section, int teil, BigDecimal maxPoints,
                            PartScoringMethod scoringMethod, boolean previewOnly, Integer maxAudioPlays,
                            Map<String, Integer> audioPlays, List<ExercisePublic> exercises) {
    }

    public record StageStatus(int index, String key, String label, int minutes, ExamTimerKind kind, String status, Long startedAtMs, Long deadlineAtMs,
                              List<String> partKeys) {
    }

    public record SavedAnswer(String answer, boolean flagged) {
    }

    public record PartProgress(String partKey, String label, int total, int answered, int flagged) {
    }

    public record AttemptState(String attemptId, SimulationAttemptStatus status, String profileTitle, int profileVersion, long serverNowMs,
                               long startedAtMs, long finalDeadlineMs, boolean timeUp, int currentStageIndex, long remainingSeconds,
                               List<StageStatus> stages, List<PartState> parts, Map<String, Map<String, SavedAnswer>> answers,
                               List<PartProgress> progress, int resumeCount, Integer maxResumes,
                               boolean paused, Long pausedAtMs, int pauseCount) {
    }

    /** Result of asking to play a clip: how many plays remain (null = unlimited). */
    public record AudioPlayResponse(String partKey, String passageId, int playsUsed, Integer playsRemaining) {
    }

    public record RejectedAnswer(String partKey, String questionId, String reason) {
    }

    public record SaveAnswersResponse(int saved, List<RejectedAnswer> rejected, SimulationAttemptStatus status, long serverNowMs,
                                      int currentStageIndex, long remainingSeconds, boolean timeUp) {
    }

    // ---------------------------------------------------------------- results

    public record ReviewQuestion(String id, Integer questionNumber, String prompt, List<String> options, String givenAnswer, String correctAnswer,
                                 boolean correct, String explanation, String commonMistake) {
    }

    public record ReviewExercise(int ordinal, String title, String transcriptHtml, List<ReviewQuestion> questions, String writtenAnswer,
                                 String modelSolution, Map<String, Object> speaking) {
    }

    public record ReviewPart(String partKey, List<ReviewExercise> exercises) {
    }

    public record ResultResponse(String attemptId, SimulationAttemptStatus status, String finishReason, String profileTitle, int profileVersion,
                                 long startedAtMs, Long endedAtMs, Long durationSeconds, ExamResult result, Map<String, List<RubricCriterion>> rubrics,
                                 boolean answersReleased, AnswerReleasePolicy answerReleasePolicy, List<ReviewPart> review) {
    }

    public record ProgressPoint(String attemptId, long endedAtMs, BigDecimal writtenScore, BigDecimal writtenPercentage, boolean writtenComplete) {
    }

    public record HistoryResponse(List<AttemptSummary> attempts, List<ProgressPoint> progress) {
    }

    // ---------------------------------------------------------------- admin

    public record AvailabilityResponse(String profileId, List<ExamPoolService.PartAvailability> parts, boolean sufficient) {
    }

    public record ValidationResponse(boolean valid, List<com.deutschbridge.backend.service.examsim.ProfileValidationResult.Issue> errors,
                                     List<com.deutschbridge.backend.service.examsim.ProfileValidationResult.Issue> warnings) {
    }

    public record AdminAttemptRow(String id, String userId, String profileCode, int profileVersion, SimulationAttemptStatus status,
                                  long startedAtMs, Long endedAtMs, ExamResultStatus overallResult, boolean awaitingAssessment) {
    }

    public record AssessmentQueueItem(String assessmentId, String attemptId, String userId, String partKey, String partLabel, ExamPartModule module,
                                      long submittedAtMs, BigDecimal maxPoints, List<RubricCriterion> rubric, String submittedText, boolean completed, String aiEstimate) {
    }
}
