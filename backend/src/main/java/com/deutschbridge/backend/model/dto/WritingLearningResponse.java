package com.deutschbridge.backend.model.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

/** Everything the "Schreiben lernen" area needs for one level, in a single payload. */
public record WritingLearningResponse(
        String level,
        List<GuideItem> items,
        List<Phrase> phrases
) {
    public record GuideItem(String id, String kind, String title, String content, JsonNode data, int sortOrder) {
    }

    public record Phrase(String id, String category, String categoryLabel, String phrase, String explanation, String example,
                         String formality, String usageNote, int sortOrder) {
    }
}
