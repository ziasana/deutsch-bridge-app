package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.enums.LearningLevel;

import java.time.LocalDateTime;

/** Just the columns the "saved for later" row needs - never the article's content, tokens or quiz. */
public interface PendingReadingBookmarkProjection {
    String getId();
    String getTitle();
    LearningLevel getLevel();
    LocalDateTime getBookmarkedAt();
}
