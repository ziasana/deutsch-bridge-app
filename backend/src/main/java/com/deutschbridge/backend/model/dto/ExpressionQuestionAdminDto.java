package com.deutschbridge.backend.model.dto;

import java.util.List;

public record ExpressionQuestionAdminDto(
        String id,
        String type,
        String format,
        String prompt,
        String explanation,
        List<ExpressionQuestionOptionAdminDto> options
) {
}
