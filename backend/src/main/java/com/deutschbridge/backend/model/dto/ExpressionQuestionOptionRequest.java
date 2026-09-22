package com.deutschbridge.backend.model.dto;

public record ExpressionQuestionOptionRequest(
        String text,
        boolean correct
) {
}
