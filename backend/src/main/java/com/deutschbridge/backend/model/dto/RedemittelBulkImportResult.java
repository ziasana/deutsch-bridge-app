package com.deutschbridge.backend.model.dto;

import java.util.List;

public record RedemittelBulkImportResult(
        int totalCount,
        int successCount,
        int failureCount,
        List<Row> rows
) {
    public record Row(int index, String phrase, boolean success, String errorMessage, String id) {
    }
}
