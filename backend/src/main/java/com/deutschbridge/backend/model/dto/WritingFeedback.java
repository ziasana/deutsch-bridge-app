package com.deutschbridge.backend.model.dto;

import java.util.List;

/**
 * Structured, multi-dimensional feedback on one writing attempt - deliberately no single score.
 * {@code source} says who produced it ("RULES" = automatic analysis, later "AI").
 */
public record WritingFeedback(
        String source,
        List<Dimension> dimensions,
        /** What went well, across all dimensions (most useful first). */
        List<String> highlights,
        /** What to improve next, prioritised and kept short. */
        List<String> nextFocus,
        Stats stats
) {
    /** status: GOOD, OK, IMPROVE or NOT_ASSESSED. */
    public record Dimension(String key, String title, String status, List<String> positives, List<String> improvements) {
    }

    public record Stats(int wordCount, int sentenceCount, int paragraphCount, int connectorCount,
                        List<String> usedPhrases, List<String> uncoveredLeitpunkte) {
    }
}
