package com.deutschbridge.backend.model.dto;

import java.util.List;

public record ExpressionBulkImportResult(
        int totalCount,
        int successCount,
        int failureCount,
        List<ExpressionBulkImportRowResult> rows
) {
}
