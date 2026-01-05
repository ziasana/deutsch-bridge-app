package com.deutschbridge.backend.model.dto;


import java.util.List;

public record VocabularyResponse(
        String id,
    String word,
    String example,
    String synonyms,
    String userEmail,
    List<VocabularyContentResponse> vocabularyContents
)
{
}
