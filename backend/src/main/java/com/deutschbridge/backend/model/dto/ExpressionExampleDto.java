package com.deutschbridge.backend.model.dto;

public record ExpressionExampleDto(
        String id,
        String sentence,
        String translationEn,
        String translationFa,
        String context
) {
}
