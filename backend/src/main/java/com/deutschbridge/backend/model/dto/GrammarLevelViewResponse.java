package com.deutschbridge.backend.model.dto;

import java.util.List;

/** Everything the grammar list shows for one level: its categories and its uncategorized lessons. */
public record GrammarLevelViewResponse(
        String level,
        List<GrammarCategorySummaryResponse> categories,
        List<GrammarLessonSummaryResponse> uncategorized
) {
}
