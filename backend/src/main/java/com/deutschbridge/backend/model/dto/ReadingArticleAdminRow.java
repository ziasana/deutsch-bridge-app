package com.deutschbridge.backend.model.dto;

/** Light row for the admin article list - no content, annotations or quiz; the editor loads the full article by id. */
public record ReadingArticleAdminRow(
        String id,
        String title,
        String level,
        String categoryId,
        String categoryTitle,
        String imageUrl,
        int vocabularyCount,
        int annotationCount
) {
}
