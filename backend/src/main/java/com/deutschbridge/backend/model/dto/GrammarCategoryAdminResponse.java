package com.deutschbridge.backend.model.dto;

public record GrammarCategoryAdminResponse(
        String id,
        String title,
        String titleFa,
        String level,
        int sortOrder,
        int passThreshold,
        int lessonCount
) {
}
