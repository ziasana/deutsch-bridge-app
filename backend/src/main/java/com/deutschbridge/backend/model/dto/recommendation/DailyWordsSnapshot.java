package com.deutschbridge.backend.model.dto.recommendation;

/** Today's daily-word progress. {@code total} is the learner's goal when today's words aren't generated yet. */
public record DailyWordsSnapshot(int total, int learned) {
}
