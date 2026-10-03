package com.deutschbridge.backend.model.dto;

/** Light row for the admin lesson list - no content, examples or quiz; the editor loads the full lesson by id. */
public record GrammarLessonAdminRow(
        String id,
        String title,
        String level,
        String status,
        String categoryId,
        String categoryTitle,
        Integer sortOrder,
        int quizCount
) {
}
