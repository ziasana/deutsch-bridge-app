package com.deutschbridge.backend.model.dto;

/**
 * Lightweight list row for a grammar lesson - title/summary (plus Persian) only, no content,
 * examples, usage tips or quiz. The full lesson is fetched via GET /api/grammar/{id}.
 * learned is scoped to the current user.
 */
public record GrammarLessonSummaryResponse(
        String id,
        String title,
        String titleFa,
        String summary,
        String summaryFa,
        String level,
        int quizCount,
        boolean learned
) {
}
