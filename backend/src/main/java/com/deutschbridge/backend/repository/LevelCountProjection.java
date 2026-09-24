package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.enums.LearningLevel;

/** Row shape for the per-level count aggregates (reading articles, grammar lessons). */
public interface LevelCountProjection {
    LearningLevel getLevel();
    Long getTotal();
}
