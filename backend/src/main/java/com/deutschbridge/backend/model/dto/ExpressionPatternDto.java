package com.deutschbridge.backend.model.dto;

public record ExpressionPatternDto(
        String id,
        String pattern,
        String grammarCase,
        String preposition,
        String example
) {
}
