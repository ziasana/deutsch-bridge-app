package com.deutschbridge.backend.model.dto;

public record ReadingArticleBulkImportRowResult(
        int index,
        String title,
        boolean success,
        String errorMessage,
        String id
) {
}
