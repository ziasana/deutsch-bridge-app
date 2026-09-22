package com.deutschbridge.backend.model.dto;

import java.util.List;

public record GrammarCategoryResponse(
        String id,
        String title,
        String titleFa,
        String level,
        int sortOrder,
        int passThreshold,
        List<GrammarLessonResponse> lessons,
        CategoryTestStatusResponse testStatus
) {
}
