package com.deutschbridge.backend.model.dto;

import java.time.LocalDateTime;

/** A bookmarked, not-yet-learned reading article for the "saved for later" strip. */
public record ReadingPendingBookmarkResponse(
        String id,
        String title,
        String level,
        LocalDateTime bookmarkedAt
) {
}
