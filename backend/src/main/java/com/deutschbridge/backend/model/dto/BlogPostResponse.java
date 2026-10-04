package com.deutschbridge.backend.model.dto;

import java.time.LocalDateTime;

/** Full post as the admin editor needs it (raw Markdown content included). */
public record BlogPostResponse(
        String id,
        String slug,
        String title,
        String excerpt,
        String content,
        String category,
        String authorName,
        String imageUrl,
        String status,
        boolean showOnHome,
        LocalDateTime publishedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
