package com.deutschbridge.backend.model.dto;

import java.time.LocalDateTime;

/** Card-sized view of a published post for the home page, /blog index and "related posts". */
public record BlogPostSummaryResponse(
        String slug,
        String title,
        String excerpt,
        String category,
        String authorName,
        String imageUrl,
        LocalDateTime publishedAt,
        int readingMinutes
) {
}
