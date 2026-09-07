package com.deutschbridge.backend.model.dto;

/**
 * Adaptive difficulty suggestion shown after a quiz (spec section 5). type is one of
 * LEVEL_UP, EASIER, CONTINUE; suggestedArticleId is null when no concrete article could be
 * found (e.g. nothing authored yet at the target level) but the level recommendation still holds.
 */
public record ArticleRecommendation(
        String type,
        String suggestedArticleId,
        String suggestedTitle,
        String suggestedLevel,
        String message
) {
}
