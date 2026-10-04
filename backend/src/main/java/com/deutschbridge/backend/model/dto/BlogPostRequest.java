package com.deutschbridge.backend.model.dto;

/** Create/update payload for an admin blog post. `status` is "DRAFT" or "PUBLISHED". */
public record BlogPostRequest(
        String title,
        String excerpt,
        String content,
        String category,
        String authorName,
        String imageUrl,
        String status,
        Boolean showOnHome
) {
}
