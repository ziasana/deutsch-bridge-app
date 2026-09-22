package com.deutschbridge.backend.model.dto;

public record RecallAnswerRequest(
        String expressionId,
        String userAnswer
) {
}
