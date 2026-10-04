package com.deutschbridge.backend.model.dto;

import java.time.LocalDateTime;

/** A bookmarked, not-yet-mastered exam exercise for the "saved for later" strip. */
public record ExamPendingBookmarkResponse(
        String id,
        String title,
        String section,
        String level,
        LocalDateTime bookmarkedAt
) {
}
