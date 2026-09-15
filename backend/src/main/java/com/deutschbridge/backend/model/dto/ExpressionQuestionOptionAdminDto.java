package com.deutschbridge.backend.model.dto;

public record ExpressionQuestionOptionAdminDto(
        String id,
        String text,
        boolean correct
) {
}
