package com.deutschbridge.backend.model.dto;

import java.util.List;

public record PracticeExpressionDto(
        String expressionId,
        String type,
        String expression,
        String level,
        String meaningDe,
        String meaningEn,
        String meaningFa,
        String grammarNote,
        String exampleSentence,
        String maskedSentence,
        String masteryLevel,
        boolean isNew,
        /** Ordered warm-up steps before Production, e.g. ["RECALL","CONTEXT"] - rotated per session so
         *  repeated reviews of the same expression don't always look identical (spec section 16/23). */
        List<String> warmupSteps,
        PracticeQuestionDto contextQuestion,
        PracticeQuestionDto completionQuestion,
        PracticeQuestionDto transformationQuestion
) {
}
