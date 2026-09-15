package com.deutschbridge.backend.model.dto;

public record RecallAnswerResponse(
        boolean correct,
        String correctAnswer,
        ExpressionProgressResponse progress
) {
}
