package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.LearningLevel;

/** Partial update - null fields are left unchanged (same idiom as ExpressionManualRequest). */
public record VocabularyUpdateRequest(
        String word,
        String article,
        String meaning,
        String language,
        String example,
        LearningLevel level
) {
}
