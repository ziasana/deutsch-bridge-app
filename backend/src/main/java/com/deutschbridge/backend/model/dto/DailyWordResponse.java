package com.deutschbridge.backend.model.dto;

public record DailyWordResponse(
        String id,
        String word,
        String meaning,
        String example,
        String synonyms,
        String level,
        boolean learned,
        /** Null unless the requesting user is A1-A2 with preferredLanguage=PR (see DailyWordService). */
        String meaningFa,
        String exampleFa
) {
}
