package com.deutschbridge.backend.model.dto;

public record QuestionAnswerRequest(
        String expressionId,
        String questionId,
        String selectedOptionId
) {
}
