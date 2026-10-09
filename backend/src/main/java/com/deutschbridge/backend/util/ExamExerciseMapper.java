package com.deutschbridge.backend.util;

import com.deutschbridge.backend.model.dto.ExamExercisePublicResponse;
import com.deutschbridge.backend.model.dto.ExamExerciseResponse;
import com.deutschbridge.backend.model.dto.ExamExerciseSummaryResponse;
import com.deutschbridge.backend.model.dto.ExamPassagePublic;
import com.deutschbridge.backend.model.dto.ExamQuestionPublic;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamExerciseCompletion;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamSection;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

public class ExamExerciseMapper {
    private ExamExerciseMapper() {
        throw new IllegalStateException("Mapper Utils class");
    }

    public static ExamExerciseResponse mapToResponse(ExamExercise exercise) {
        return new ExamExerciseResponse(
                exercise.getId(),
                exercise.getTitle(),
                exercise.getSection() != null ? exercise.getSection().name() : null,
                exercise.getTaskType() != null ? exercise.getTaskType().name() : null,
                exercise.getLevel() != null ? exercise.getLevel().getValue() : null,
                exercise.getPartNumber(),
                exercise.getPassages(),
                exercise.getQuestions(),
                exercise.getAnswerOptions(),
                exercise.getAnswerOptionLabels(),
                exercise.getDefaultExplanation(),
                exercise.getDefaultCommonMistake(),
                exercise.getTeilDescription(),
                exercise.getModelSolution(),
                exercise.isPublished(),
                exercise.getCreatedAt(),
                exercise.isRequiresPlanning(),
                exercise.getLeitpunkte(),
                exercise.getExamType() != null ? exercise.getExamType().name() : null,
                exercise.getStatus() != null ? exercise.getStatus().name() : null,
                exercise.getExternalId(),
                exercise.getVersion(),
                exercise.getMetadata()
        );
    }

    /**
     * Answer-key-stripped shape for students - unlike Reading, exam content itself (not just the
     * start-attempt flow) is fetched directly, so passages/questions must never leak answers here.
     */
    public static ExamExercisePublicResponse mapToPublicResponse(ExamExercise exercise) {
        return mapToPublicResponse(exercise, Map.of(), false);
    }

    public static ExamExercisePublicResponse mapToPublicResponse(ExamExercise exercise, Map<String, ExamExerciseCompletion> completionsByExerciseId,
                                                                 boolean bookmarked) {
        List<ExamPassage> passages = exercise.getPassages() != null ? exercise.getPassages() : List.of();
        List<ExamQuestion> questions = exercise.getQuestions() != null ? exercise.getQuestions() : List.of();
        ExamExerciseCompletion completion = completionsByExerciseId.get(exercise.getId());

        return new ExamExercisePublicResponse(
                exercise.getId(),
                exercise.getTitle(),
                exercise.getSection() != null ? exercise.getSection().name() : null,
                exercise.getTaskType() != null ? exercise.getTaskType().name() : null,
                exercise.getLevel() != null ? exercise.getLevel().getValue() : null,
                exercise.getPartNumber(),
                ExamTeilResolver.teilOf(exercise),
                passages.stream().map(p -> new ExamPassagePublic(p.getId(), p.getLabel(), p.getContent(), p.getImageUrl(), p.getAudioUrl())).toList(),
                mapQuestionsToPublic(questions),
                exercise.getAnswerOptions(),
                exercise.getAnswerOptionLabels(),
                exercise.getTeilDescription(),
                exercise.getModelSolution(),
                exercise.getDefaultExplanation(),
                exercise.getDefaultCommonMistake(),
                completion != null,
                completion != null ? completion.getLastScore() : null,
                exercise.isRequiresPlanning(),
                exercise.getLeitpunkte(),
                bookmarked,
                speakingOf(exercise)
        );
    }

    /** The stored speaking content of an imported Mündlicher Ausdruck exercise; null for everything else. */
    @SuppressWarnings("unchecked")
    private static Map<String, Object> speakingOf(ExamExercise exercise) {
        if (exercise.getSection() != ExamSection.MUENDLICHER_AUSDRUCK || exercise.getMetadata() == null) return null;
        return exercise.getMetadata().get("speaking") instanceof Map<?, ?> speaking ? (Map<String, Object>) speaking : null;
    }

    /**
     * Navigation/summary shape - deliberately omits passages/questions/answerOptions so browsing
     * (section tabs, level selector, Teil listings) never pays for an exercise's full content.
     */
    public static ExamExerciseSummaryResponse mapToSummaryResponse(ExamExercise exercise, Map<String, ExamExerciseCompletion> completionsByExerciseId,
                                                                    boolean bookmarked) {
        ExamExerciseCompletion completion = completionsByExerciseId.get(exercise.getId());
        List<ExamQuestion> questions = exercise.getQuestions();

        return new ExamExerciseSummaryResponse(
                exercise.getId(),
                exercise.getTitle(),
                exercise.getSection() != null ? exercise.getSection().name() : null,
                exercise.getTaskType() != null ? exercise.getTaskType().name() : null,
                exercise.getLevel() != null ? exercise.getLevel().getValue() : null,
                exercise.getPartNumber(),
                ExamTeilResolver.teilOf(exercise),
                exercise.getTeilDescription(),
                questions != null ? questions.size() : 0,
                completion != null,
                completion != null ? completion.getLastScore() : null,
                bookmarked
        );
    }

    /**
     * Answer-key-stripped question list, sorted ascending by the admin-assigned questionNumber
     * (questions without one sort after those with one, keeping their original relative order) -
     * shared by the exercise-fetch and start-attempt endpoints so students always see the same order.
     */
    public static List<ExamQuestionPublic> mapQuestionsToPublic(List<ExamQuestion> questions) {
        if (questions == null) return List.of();
        return questions.stream()
                .sorted(Comparator.comparing(ExamQuestion::getQuestionNumber, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(q -> new ExamQuestionPublic(q.getId(), q.getTaskType(), q.getPrompt(), q.getSectionIndex(), q.getOptions(), q.getGapNumber(), q.getQuestionNumber()))
                .toList();
    }
}
