package com.deutschbridge.backend.model.dto;

public record PracticeVocabularyItemDto(
        String vocabularyItemId,
        String source,
        String word,
        String article,
        String meaning,
        String example,
        String synonyms,
        String level,
        String audioUrl,
        String masteryLevel,
        boolean isNew,
        /** Null when the user's pool has fewer than 4 items - the round is flashcard-only then. */
        PracticeContextQuestionDto contextQuestion
) {
}
