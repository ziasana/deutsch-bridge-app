package com.deutschbridge.backend.model.dto;

import java.time.LocalDateTime;

/**
 * A bookmarked, not-yet-learned lesson for the "saved for later" card: light row fields plus when it
 * was bookmarked, so the UI can order by age and flag long-waiting lessons.
 */
public record GrammarPendingBookmarkResponse(
        String id,
        String title,
        String titleFa,
        String summary,
        String summaryFa,
        String level,
        int quizCount,
        LocalDateTime bookmarkedAt
) {
}
