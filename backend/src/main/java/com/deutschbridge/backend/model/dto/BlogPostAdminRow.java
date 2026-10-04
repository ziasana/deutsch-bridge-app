package com.deutschbridge.backend.model.dto;

import java.time.LocalDateTime;

/** Light row for the admin table - no content; the editor loads the full post by id. */
public record BlogPostAdminRow(
        String id,
        String slug,
        String title,
        String category,
        String authorName,
        String imageUrl,
        String status,
        boolean showOnHome,
        LocalDateTime publishedAt,
        LocalDateTime updatedAt
) {
}
