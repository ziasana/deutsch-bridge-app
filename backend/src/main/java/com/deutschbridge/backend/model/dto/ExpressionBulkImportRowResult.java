package com.deutschbridge.backend.model.dto;

public record ExpressionBulkImportRowResult(
        int index,
        String expression,
        boolean success,
        String errorMessage,
        String id
) {
}
