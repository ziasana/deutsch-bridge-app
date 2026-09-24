package com.deutschbridge.backend.model.dto;

import java.util.List;

/** One server-side page of a single collection's expression list. page is zero-based. */
public record ExpressionPageResponse(
        List<ExpressionListEntryResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
