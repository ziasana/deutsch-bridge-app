package com.deutschbridge.backend.model.dto;

import java.util.List;

public record ExpressionResponse(
        String id,
        String type,
        String expression,
        String level,
        String meaningDe,
        String meaningEn,
        String meaningFa,
        String literalMeaning,
        String figurativeMeaning,
        String grammarNote,
        String usageNote,
        String register,
        String commonMistakes,
        String status,
        List<ExpressionExampleDto> examples,
        List<ExpressionPatternDto> patterns,
        /** Admin-only - null for every student-facing response so correct answers never leak
         *  (see ExpressionMapper.mapToResponse / ExpressionService). Practice sessions get
         *  questions through a separate, answer-free PracticeQuestionDto instead. */
        List<ExpressionQuestionAdminDto> questions,
        ExpressionProgressResponse progress
) {
}
