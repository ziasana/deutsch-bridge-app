package com.deutschbridge.backend.model.dto;

import java.time.LocalDateTime;

public record VocabularyProgressResponse(
        double recallScore,
        double contextScore,
        double overallScore,
        int reviewCount,
        int correctCount,
        int incorrectCount,
        String masteryLevel,
        LocalDateTime lastReviewedAt,
        LocalDateTime nextReviewAt
) {
}
