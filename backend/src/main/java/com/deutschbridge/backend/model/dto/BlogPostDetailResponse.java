package com.deutschbridge.backend.model.dto;

import java.time.LocalDateTime;
import java.util.List;

/** A published post with its Markdown content, plus a few related posts for the "keep reading" strip. */
public record BlogPostDetailResponse(
        String slug,
        String title,
        String excerpt,
        String content,
        String category,
        String authorName,
        String imageUrl,
        LocalDateTime publishedAt,
        int readingMinutes,
        List<BlogPostSummaryResponse> related
) {
}
