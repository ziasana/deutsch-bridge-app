package com.deutschbridge.backend.model.dto;

public record AttemptResultResponse(
        String attemptId,
        double comprehensionScore,
        double vocabScore,
        ArticleRecommendation recommendation
) {
}
