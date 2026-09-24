package com.deutschbridge.backend.model.dto;

import java.util.List;

public record ReadingArticleBulkImportResult(
        int totalCount,
        int successCount,
        int failureCount,
        List<ReadingArticleBulkImportRowResult> rows
) {
}
