package com.deutschbridge.backend.model.dto;

import java.util.List;

/** The learner's writing progress: what they did and which areas keep needing work. */
public record WritingProgressResponse(
        int attemptsCount,
        int exercisesWritten,
        int revisedTexts,
        int totalWords,
        /** When the learner last submitted a text, or null if never. */
        java.time.LocalDateTime lastAttemptAt,
        /** Dimensions that most often had open improvement points in the recent attempts, most frequent first. */
        List<Issue> topIssues,
        /** Most recent concrete grammar corrections from AI feedback. */
        List<WritingAiFeedback.GrammarFix> recentGrammarFixes
) {
    /** key = WritingFeedback.Dimension key (TASK, STRUCTURE, VOCABULARY, FORM). */
    public record Issue(String key, String title, int count) {
    }
}
