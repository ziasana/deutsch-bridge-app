package com.deutschbridge.backend.model.dto;

import java.util.List;

/** One server-side page of a single level's reading list. page is zero-based. */
public record ReadingArticlePageResponse(
        List<ReadingArticleSummaryResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
