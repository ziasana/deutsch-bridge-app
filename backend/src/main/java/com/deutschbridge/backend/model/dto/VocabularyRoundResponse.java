package com.deutschbridge.backend.model.dto;

public record VocabularyRoundResponse(
        boolean flashcardCorrect,
        /** Null when no context question was asked this round. */
        Boolean contextCorrect,
        /** Null when no context question was asked this round; set whenever one was, regardless
         *  of whether the user answered it. */
        String correctContextKey,
        VocabularyProgressResponse progress
) {
}
