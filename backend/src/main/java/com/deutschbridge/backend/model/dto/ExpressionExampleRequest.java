package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.ExpressionExampleContext;

public record ExpressionExampleRequest(
        String sentence,
        String translationEn,
        String translationFa,
        ExpressionExampleContext context
) {
}
