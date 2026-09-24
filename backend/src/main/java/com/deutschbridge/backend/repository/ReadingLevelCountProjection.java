package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.enums.LearningLevel;

/** Row shape for ReadingArticleRepository's per-level count aggregates. */
public interface ReadingLevelCountProjection {
    LearningLevel getLevel();
    Long getTotal();
}
