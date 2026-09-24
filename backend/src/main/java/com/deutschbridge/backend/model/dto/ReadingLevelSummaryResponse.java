package com.deutschbridge.backend.model.dto;

/**
 * Per-level article count and the current user's learned count, used to populate the reading
 * level selector without shipping any article. Computed via SQL aggregates (see
 * ReadingArticleRepository) so the payload stays one row per level regardless of table size.
 */
public record ReadingLevelSummaryResponse(
        String level,
        long total,
        long learned
) {
}
