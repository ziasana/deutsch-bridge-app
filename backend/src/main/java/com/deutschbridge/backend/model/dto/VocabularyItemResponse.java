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
        /** Part of speech or expression kind (VocabularyWordType name); null for older entries. */
        String wordType,
        String level,
        String audioUrl,
        /** Only set for source=DICTIONARY. */
        String dictionaryEntryId,
        /** Only set for source=AI_TUTOR. */
        String sourceChatId,
        String sourceMessageId,
        LocalDateTime createdAt,
        /** Null when the current user hasn't practiced this item yet. */
        VocabularyProgressResponse progress,
        boolean bookmarked
) {
}
