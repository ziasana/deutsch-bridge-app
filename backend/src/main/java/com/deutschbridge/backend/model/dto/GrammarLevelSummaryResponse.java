package com.deutschbridge.backend.model.dto;

/**
 * Per-level published lesson count and the current user's learned count, for the grammar level
 * selector. Computed via SQL aggregates (see GrammarLessonRepository) so the payload stays one row
 * per level regardless of how many lessons exist.
 */
public record GrammarLevelSummaryResponse(
        String level,
        long total,
        long learned
) {
}
