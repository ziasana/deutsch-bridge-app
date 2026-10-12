package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.dto.ExamPassagePublic;
import com.deutschbridge.backend.model.dto.ExamQuestionPublic;
import com.deutschbridge.backend.model.dto.examsim.ExamSimulationDtos.*;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.entity.ExamSimulationAnswer;
import com.deutschbridge.backend.model.entity.ExamSimulationAttempt;
import com.deutschbridge.backend.model.entity.ExamSimulationAttemptPart;
import com.deutschbridge.backend.model.enums.AnswerReleasePolicy;
import com.deutschbridge.backend.model.enums.ExamPartModule;
import com.deutschbridge.backend.model.enums.PartScoringMethod;
import com.deutschbridge.backend.model.enums.SimulationAttemptStatus;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import com.deutschbridge.backend.model.examsim.ExamProfileConfig;
import com.deutschbridge.backend.model.examsim.ExamResult;
import com.deutschbridge.backend.model.examsim.ExamTimerConfig;
import com.deutschbridge.backend.model.examsim.ExerciseSnapshot;
import com.deutschbridge.backend.model.examsim.ProfileSnapshot;
import com.deutschbridge.backend.model.examsim.RubricCriterion;
import com.deutschbridge.backend.model.examsim.StageState;
import com.deutschbridge.backend.util.ExamExerciseMapper;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Maps stored attempt data to the learner-facing shapes. This is the single place that decides what leaves the server:
 * during the exam only answer-key-free content, after release the review with correct answers.
 */
@Component
public class ExamSimulationViewBuilder {

    /** Pseudo question ids for answers that are not tied to a stored question. */
    public static final String WRITING_TEXT_ID = "__text";
    public static final String DONE_ID = "__done";

    /** Keys of speaking content that model the answer; hidden while the exam is running. */
    private static final Set<String> SPEAKING_SOLUTION_KEYS = Set.of("exampleResponse", "exampleDialogue", "exampleProfile");

    private final Clock clock;

    public ExamSimulationViewBuilder(Clock clock) {
        this.clock = clock;
    }

    // ---------------------------------------------------------------- active state

    public AttemptState state(ExamSimulationAttempt a, List<ExamSimulationAttemptPart> parts, List<ExamSimulationAnswer> answers, boolean timeUp,
                              List<com.deutschbridge.backend.model.entity.ExamSimulationAudioPlay> plays) {
        ProfileSnapshot profile = a.getProfileSnapshot();
        ExamProfileConfig config = profile.config();
        List<ExamTimerConfig> timers = config.timersOrEmpty();
        List<StageState> stages = a.getStages();
        long now = clock.millis();
        int currentIndex = stages.size() - 1;
        StageState current = stages.get(currentIndex);
        boolean paused = a.getStatus() == SimulationAttemptStatus.IN_PROGRESS && a.getPausedAt() != null;
        boolean running = a.getStatus() == SimulationAttemptStatus.IN_PROGRESS && current.isRunning();

        List<StageStatus> stageStatuses = new ArrayList<>();
        for (int i = 0; i < timers.size(); i++) {
            ExamTimerConfig t = timers.get(i);
            StageState s = i < stages.size() ? stages.get(i) : null;
            String status = s == null ? "PENDING" : s.isRunning() ? "RUNNING" : s.endReason();
            stageStatuses.add(new StageStatus(i, t.key(), t.label(), t.minutes(), t.effectiveKind(), status,
                    s != null ? s.startedAtMs() : null, s != null ? s.deadlineAtMs() : null, partKeysShownIn(config, t)));
        }

        List<PartState> partStates = new ArrayList<>();
        Map<String, Map<String, SavedAnswer>> savedAnswers = new LinkedHashMap<>();
        // While paused the tasks are not sent at all, so a pause cannot be used to read ahead.
        if (running && !paused) {
            ExamTimerConfig timer = timers.get(currentIndex);
            for (ExamPartConfig part : config.partsOrEmpty()) {
                if (!partKeysShownIn(config, timer).contains(part.key())) continue;
                boolean preview = timer.isPreparation();
                partStates.add(new PartState(part.key(), part.label(), part.module(), part.section(), part.teil(), part.maxPoints(),
                        ExamScoringService.effectiveMethod(profile, part), preview, part.maxAudioPlays(),
                        plays.stream().filter(x -> x.getPartKey().equals(part.key())).collect(java.util.stream.Collectors.toMap(
                                com.deutschbridge.backend.model.entity.ExamSimulationAudioPlay::getPassageId, com.deutschbridge.backend.model.entity.ExamSimulationAudioPlay::getPlays)),
                        exercisesPublic(part.key(), parts)));
                Map<String, SavedAnswer> forPart = new LinkedHashMap<>();
                for (ExamSimulationAnswer an : answers) {
                    if (an.getPartKey().equals(part.key())) forPart.put(an.getQuestionId(), new SavedAnswer(an.getAnswer(), an.isFlagged()));
                }
                savedAnswers.put(part.key(), forPart);
            }
        }
        long clockMs = paused ? a.getPausedAt().toEpochMilli() : now;
        long remaining = running ? Math.max(0, (long) Math.ceil((current.deadlineAtMs() - clockMs) / 1000.0)) : 0;
        return new AttemptState(a.getId(), a.getStatus(), profile.title(), profile.version(), now, a.getStartedAt().toEpochMilli(),
                a.getFinalDeadlineAt().toEpochMilli(), timeUp, currentIndex, remaining, stageStatuses, partStates, savedAnswers,
                progress(config, parts, answers), a.getResumeCount(), profile.maxResumes(),
                paused, paused ? a.getPausedAt().toEpochMilli() : null, a.getPauseCount());
    }

    /** Parts shown in a stage: its own, or for a preparation stage those of the timer it prepares. */
    static List<String> partKeysShownIn(ExamProfileConfig config, ExamTimerConfig timer) {
        String key = timer.isPreparation() ? timer.previewTimerKey() : timer.key();
        return config.partsOrEmpty().stream().filter(p -> key != null && key.equals(p.timerKey())).map(ExamPartConfig::key).toList();
    }

    private List<ExercisePublic> exercisesPublic(String partKey, List<ExamSimulationAttemptPart> parts) {
        return parts.stream().filter(p -> p.getPartKey().equals(partKey)).sorted(Comparator.comparingInt(ExamSimulationAttemptPart::getOrdinal))
                .map(p -> {
                    ExerciseSnapshot s = p.getSnapshot();
                    List<ExamPassagePublic> passages = s.passagesOrEmpty().stream()
                            .map(x -> new ExamPassagePublic(x.getId(), x.getLabel(), x.getContent(), x.getImageUrl(), x.getAudioUrl())).toList();
                    List<ExamQuestionPublic> questions = ExamExerciseMapper.mapQuestionsToPublic(s.questionsOrEmpty());
                    return new ExercisePublic(p.getOrdinal(), s.title(), s.taskType(), s.teilDescription(), passages, questions, s.answerOptions(),
                            s.answerOptionLabels(), s.requiresPlanning(), s.leitpunkte(), withoutSpeakingSolutions(s.speaking()));
                }).toList();
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> withoutSpeakingSolutions(Map<String, Object> speaking) {
        if (speaking == null) return null;
        Map<String, Object> copy = new HashMap<>();
        speaking.forEach((k, v) -> {
            if (SPEAKING_SOLUTION_KEYS.contains(k)) return;
            if ("topics".equals(k) && v instanceof List<?> topics) {
                List<Object> cleaned = new ArrayList<>();
                for (Object t : topics) {
                    if (t instanceof Map<?, ?> m) {
                        Map<String, Object> topic = new HashMap<>((Map<String, Object>) m);
                        topic.remove("exampleAnswers");
                        cleaned.add(topic);
                    } else {
                        cleaned.add(t);
                    }
                }
                copy.put(k, cleaned);
            } else {
                copy.put(k, v);
            }
        });
        return copy;
    }

    private List<PartProgress> progress(ExamProfileConfig config, List<ExamSimulationAttemptPart> parts, List<ExamSimulationAnswer> answers) {
        List<PartProgress> result = new ArrayList<>();
        for (ExamPartConfig part : config.partsOrEmpty()) {
            int total = parts.stream().filter(p -> p.getPartKey().equals(part.key())).mapToInt(p -> p.getSnapshot().questionsOrEmpty().size()).sum();
            if (total == 0) total = 1; // writing / oral parts count as one item
            int answered = 0;
            int flagged = 0;
            for (ExamSimulationAnswer an : answers) {
                if (!an.getPartKey().equals(part.key())) continue;
                boolean has = an.getAnswer() != null && !an.getAnswer().isBlank() && !(DONE_ID.equals(an.getQuestionId()) && !"true".equals(an.getAnswer()));
                if (has) answered++;
                if (an.isFlagged()) flagged++;
            }
            result.add(new PartProgress(part.key(), part.label(), total, Math.min(answered, total), flagged));
        }
        return result;
    }

    // ---------------------------------------------------------------- result

    public ResultResponse result(ExamSimulationAttempt a, List<ExamSimulationAttemptPart> parts, List<ExamSimulationAnswer> answers) {
        ProfileSnapshot profile = a.getProfileSnapshot();
        ExamResult result = a.getResult();
        boolean released = released(profile.answerReleasePolicy(), a, result);
        Map<String, List<RubricCriterion>> rubrics = new LinkedHashMap<>();
        for (ExamPartConfig part : profile.config().partsOrEmpty()) {
            if (part.scoringMethod() == PartScoringMethod.MANUAL_RUBRIC) rubrics.put(part.key(), part.rubricOrEmpty());
        }
        Long ended = a.getEndedAt() != null ? a.getEndedAt().toEpochMilli() : null;
        return new ResultResponse(a.getId(), a.getStatus(), a.getFinishReason(), profile.title(), profile.version(), a.getStartedAt().toEpochMilli(), ended,
                ended != null ? (ended - a.getStartedAt().toEpochMilli()) / 1000 : null, result, rubrics, released, profile.answerReleasePolicy(),
                released ? review(profile, parts, answers) : List.of());
    }

    public static boolean released(AnswerReleasePolicy policy, ExamSimulationAttempt a, ExamResult result) {
        if (a.getStatus() != SimulationAttemptStatus.COMPLETED && a.getStatus() != SimulationAttemptStatus.EXPIRED) return false;
        return switch (policy) {
            case SCORE_ONLY -> false;
            case AFTER_SUBMISSION -> true;
            case AFTER_ASSESSMENT -> result != null && result.pendingAssessmentParts().isEmpty();
        };
    }

    private List<ReviewPart> review(ProfileSnapshot profile, List<ExamSimulationAttemptPart> parts, List<ExamSimulationAnswer> answers) {
        Map<String, String> byKey = new HashMap<>();
        answers.forEach(an -> byKey.put(an.getPartKey() + "|" + an.getQuestionId(), an.getAnswer()));
        List<ReviewPart> result = new ArrayList<>();
        for (ExamPartConfig part : profile.config().partsOrEmpty()) {
            List<ReviewExercise> exercises = new ArrayList<>();
            parts.stream().filter(p -> p.getPartKey().equals(part.key())).sorted(Comparator.comparingInt(ExamSimulationAttemptPart::getOrdinal)).forEach(p -> {
                ExerciseSnapshot s = p.getSnapshot();
                List<ReviewQuestion> questions = new ArrayList<>();
                for (ExamQuestion q : s.questionsOrEmpty().stream().sorted(Comparator.comparing(ExamQuestion::getQuestionNumber, Comparator.nullsLast(Comparator.naturalOrder()))).toList()) {
                    String given = byKey.get(part.key() + "|" + q.getId());
                    boolean correct = given != null && PerQuestionScorer.isCorrect(q, given);
                    questions.add(new ReviewQuestion(q.getId(), q.getQuestionNumber(), q.getPrompt(), q.getOptions(), given, q.getCorrectAnswer(), correct,
                            q.getExplanation() != null ? q.getExplanation() : s.defaultExplanation(), q.getCommonMistake()));
                }
                String transcripts = s.passagesOrEmpty().stream().map(ExamPassage::getTranscript)
                        .filter(t -> t != null && !t.isBlank()).reduce((x, y) -> x + y).orElse(null);
                exercises.add(new ReviewExercise(p.getOrdinal(), s.title(), transcripts, questions, byKey.get(part.key() + "|" + WRITING_TEXT_ID),
                        s.modelSolution(), s.speaking()));
            });
            result.add(new ReviewPart(part.key(), exercises));
        }
        return result;
    }

    // ---------------------------------------------------------------- summaries

    public AttemptSummary summary(ExamSimulationAttempt a) {
        ExamResult r = a.getResult();
        Long ended = a.getEndedAt() != null ? a.getEndedAt().toEpochMilli() : null;
        return new AttemptSummary(a.getId(), a.getStatus(), a.getProfileVersion(), a.getProfileSnapshot().title(), a.getStartedAt().toEpochMilli(), ended,
                ended != null ? (ended - a.getStartedAt().toEpochMilli()) / 1000 : null,
                r != null ? r.writtenScore() : null, r != null ? r.writtenMax() : a.getProfileSnapshot().writtenMaxPoints(),
                r != null ? r.writtenPercentage() : null, r != null && r.writtenComplete(), r != null ? r.writtenResult() : null,
                r != null ? r.oralResult() : null, r != null ? r.overallResult() : null, r != null ? r.totalScore() : null,
                a.getProfileSnapshot().totalMaxPoints(), r != null && !r.pendingAssessmentParts().isEmpty());
    }

    public static boolean isOralOrUnscored(ExamPartConfig part, ProfileSnapshot profile) {
        return part.module() == ExamPartModule.ORAL || ExamScoringService.effectiveMethod(profile, part) == PartScoringMethod.UNSCORED;
    }
}
