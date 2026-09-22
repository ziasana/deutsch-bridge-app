package com.deutschbridge.backend.model.dto;

public record ExpressionPatternRequest(
        String pattern,
        String grammarCase,
        String preposition,
        String example
) {
}
