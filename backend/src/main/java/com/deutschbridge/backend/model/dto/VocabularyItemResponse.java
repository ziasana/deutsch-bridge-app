package com.deutschbridge.backend.model.dto;

import java.time.LocalDateTime;

public record VocabularyItemResponse(
        String id,
        String source,
        String word,
        String article,
        String meaning,
        String language,
        String example,
        String synonyms,
        String level,
        String audioUrl,
        /** Only set for source=DICTIONARY. */
        String dictionaryEntryId,
        LocalDateTime createdAt,
        /** Null when the current user hasn't practiced this item yet. */
        VocabularyProgressResponse progress,
        boolean bookmarked
) {
}
