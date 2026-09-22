package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.LearningLevel;

public record GrammarCategoryManualRequest(
        String title,
        String titleFa,
        LearningLevel level,
        Integer sortOrder,
        Integer passThreshold
) {
}
