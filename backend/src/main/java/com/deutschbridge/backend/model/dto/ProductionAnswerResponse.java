package com.deutschbridge.backend.model.dto;

public record ProductionAnswerResponse(
        boolean usedCorrectly,
        boolean grammarCorrect,
        boolean natural,
        String feedback,
        String c1Suggestion,
        ExpressionProgressResponse progress
) {
}
