package com.deutschbridge.backend.model.dto;

/**
 * Lightweight list/card shape for an expression - deliberately omits patterns/questions and the
 * full example list, which are only fetched for a single expression via GET /api/expressions/{id}.
 * masteryLevel/overallScore/bookmarked are scoped to the current user.
 */
public record ExpressionListEntryResponse(
        String id,
        String expression,
        String level,
        String meaningDe,
        String meaningEn,
        String register,
        String imageUrl,
        String exampleSentence,
        String masteryLevel,
        double overallScore,
        double productionScore,
        boolean bookmarked
) {
}
