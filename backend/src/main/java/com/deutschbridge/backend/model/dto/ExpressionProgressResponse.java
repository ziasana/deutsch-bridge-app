package com.deutschbridge.backend.model.dto;

import java.time.LocalDateTime;

public record ExpressionProgressResponse(
        double recognitionScore,
        double recallScore,
        double contextScore,
        double transformationScore,
        double productionScore,
        double overallScore,
        int reviewCount,
        int correctCount,
        int incorrectCount,
        String masteryLevel,
        LocalDateTime lastReviewedAt,
        LocalDateTime nextReviewAt
) {
}
