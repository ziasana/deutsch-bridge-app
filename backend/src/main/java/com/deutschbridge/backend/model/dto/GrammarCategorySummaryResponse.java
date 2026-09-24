package com.deutschbridge.backend.model.dto;

import java.util.List;

/** A category accordion on the grammar list: light lesson rows plus the current user's test status. */
public record GrammarCategorySummaryResponse(
        String id,
        String title,
        String titleFa,
        String level,
        int sortOrder,
        int passThreshold,
        List<GrammarLessonSummaryResponse> lessons,
        CategoryTestStatusResponse testStatus
) {
}
