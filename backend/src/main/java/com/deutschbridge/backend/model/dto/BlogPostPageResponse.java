package com.deutschbridge.backend.model.dto;

import java.util.List;

public record BlogPostPageResponse(
        List<BlogPostSummaryResponse> posts,
        int page,
        int totalPages,
        long totalElements
) {
}
