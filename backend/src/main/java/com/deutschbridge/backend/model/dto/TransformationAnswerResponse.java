package com.deutschbridge.backend.model.dto;

public record TransformationAnswerResponse(
        boolean usedExpression,
        boolean grammarCorrect,
        boolean meaningPreserved,
        String feedback,
        String c1Suggestion,
        ExpressionProgressResponse progress
) {
}
