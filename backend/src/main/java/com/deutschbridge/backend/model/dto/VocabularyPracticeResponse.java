package com.deutschbridge.backend.model.dto;

public record VocabularyPracticeResponse(
        String id,
        String word,
        String example,
        String synonyms,
        java.util.Optional<String> meaning
) {
}
