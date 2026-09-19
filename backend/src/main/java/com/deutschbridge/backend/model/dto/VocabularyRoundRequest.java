package com.deutschbridge.backend.model.dto;

public record VocabularyRoundRequest(
        String vocabularyItemId,
        boolean flashcardKnewIt,
        /** Null if the context step was skipped (no question was generated) or not answered. */
        String contextSelectedKey
) {
}
