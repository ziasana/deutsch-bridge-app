package com.deutschbridge.backend.model.dto;

import java.util.List;

/** Student-facing response - answer keys/explanations stripped. */
public record ExamExercisePublicResponse(
        String id,
        String title,
        String section,
        String taskType,
        String level,
        Integer partNumber,
        List<ExamPassagePublic> passages,
        List<ExamQuestionPublic> questions,
        List<String> answerOptions,
        /** SCHRIFTLICHER_AUSDRUCK only: the "mögliche Antwort" revealed via a button - not an answer key to strip, unlike questions' correctAnswer. */
        String modelSolution,
        boolean completed
) {
}
