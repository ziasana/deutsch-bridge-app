package com.deutschbridge.backend.model.dto;

import java.time.LocalDateTime;

/**
 * Lightweight list/navigation shape for a reading article - deliberately omits content, tokens,
 * annotations, keyVocabulary and quiz, which are only fetched for a single article via
 * GET /api/reading/{id}. newWordCount and learned are scoped to the current user.
 */
public record ReadingArticleSummaryResponse(
        String id,
        String title,
        String categoryId,
        String categoryTitle,
        String level,
        String imageUrl,
        String thumbnailUrl,
        long viewCount,
        LocalDateTime createdAt,
        int newWordCount,
        boolean learned,
        boolean bookmarked
) {
}
