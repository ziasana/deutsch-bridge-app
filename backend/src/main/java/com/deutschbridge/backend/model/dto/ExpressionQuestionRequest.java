package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.ExpressionQuestionFormat;
import com.deutschbridge.backend.model.enums.ExpressionQuestionType;

import java.util.List;

public record ExpressionQuestionRequest(
        ExpressionQuestionType type,
        ExpressionQuestionFormat format,
        String prompt,
        String explanation,
        List<ExpressionQuestionOptionRequest> options
) {
}
