package com.deutschbridge.backend.model.dto;

public record DailyWordResponse(
        String id,
        String word,
        String meaning,
        String example,
        String synonyms,
        String level,
        boolean learned
) {
}
