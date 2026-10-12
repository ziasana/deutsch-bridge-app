package com.deutschbridge.backend.model.examsim;

import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

/** Frozen copy of an exercise at reservation time. Contains the answer key: never serialise it to a learner before release. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ExerciseSnapshot(
        String exerciseId,
        int version,
        String title,
        ExamSection section,
        ExamTaskType taskType,
        Integer partNumber,
        String teilDescription,
        List<ExamPassage> passages,
        List<ExamQuestion> questions,
        List<String> answerOptions,
        List<String> answerOptionLabels,
        String defaultExplanation,
        String defaultCommonMistake,
        String modelSolution,
        List<String> leitpunkte,
        boolean requiresPlanning,
        Map<String, Object> speaking
) {
    public static ExerciseSnapshot of(ExamExercise e, Map<String, Object> speaking) {
        return new ExerciseSnapshot(e.getId(), e.getVersion(), e.getTitle(), e.getSection(), e.getTaskType(), e.getPartNumber(),
                e.getTeilDescription(), copy(e.getPassages()), copy(e.getQuestions()), e.getAnswerOptions(), e.getAnswerOptionLabels(),
                e.getDefaultExplanation(), e.getDefaultCommonMistake(), e.getModelSolution(), e.getLeitpunkte(), e.isRequiresPlanning(), speaking);
    }

    private static <T> List<T> copy(List<T> list) {
        return list == null ? List.of() : List.copyOf(list);
    }

    public List<ExamQuestion> questionsOrEmpty() {
        return questions != null ? questions : List.of();
    }

    public List<ExamPassage> passagesOrEmpty() {
        return passages != null ? passages : List.of();
    }
}
