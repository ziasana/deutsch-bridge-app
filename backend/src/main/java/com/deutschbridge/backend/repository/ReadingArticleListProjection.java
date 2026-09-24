package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.enums.LearningLevel;

import java.time.LocalDateTime;

/** Row shape for ReadingArticleRepository.findListPage - list columns only, no jsonb content. */
public interface ReadingArticleListProjection {
    String getId();
    String getTitle();
    String getTopic();
    LearningLevel getLevel();
    String getImageUrl();
    long getViewCount();
    LocalDateTime getCreatedAt();
}
