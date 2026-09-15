package com.deutschbridge.backend.model.dto;

public record TransformationAnswerRequest(
        String expressionId,
        String questionId,
        String sentence
) {
}
