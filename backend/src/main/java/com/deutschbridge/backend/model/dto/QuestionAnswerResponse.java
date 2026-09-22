package com.deutschbridge.backend.model.dto;

public record QuestionAnswerResponse(
        boolean correct,
        String correctOptionId,
        String explanation,
        ExpressionProgressResponse progress
) {
}
