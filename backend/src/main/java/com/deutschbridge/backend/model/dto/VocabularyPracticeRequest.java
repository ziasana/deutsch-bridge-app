package com.deutschbridge.backend.model.dto;

public record VocabularyPracticeRequest(
        String vocabularyId,
        boolean known
)
{
}
