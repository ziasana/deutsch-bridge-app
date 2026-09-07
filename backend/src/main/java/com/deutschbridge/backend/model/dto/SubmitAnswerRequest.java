package com.deutschbridge.backend.model.dto;

public record SubmitAnswerRequest(
        String questionId,
        String answer
) {
}
