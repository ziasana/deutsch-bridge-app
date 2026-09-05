package com.deutschbridge.backend.model.dto;

public record RecentVocabularyResponse(
        String id,
        String word,
        java.util.Optional<String> meaning,
        String status
) {
}
