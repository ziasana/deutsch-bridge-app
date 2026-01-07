package com.deutschbridge.backend.model.dto;

import jakarta.validation.constraints.NotBlank;

public record VocabularyRequest(
        String id,
        @NotBlank(message = "Word is required")
        String word,
        String example,
        String synonyms,
        String meaning
) {
}
