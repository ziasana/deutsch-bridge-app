package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.LearningLevel;

public record ReadingArticleGenerateRequest(
        String topic,
        LearningLevel level
) {
}
