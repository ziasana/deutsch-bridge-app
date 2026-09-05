package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.LearningLevel;

public record SuggestVocabularyRequest(
        String content,
        LearningLevel level
) {
}
