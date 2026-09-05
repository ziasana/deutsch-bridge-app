package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.KeyVocabularyItem;

import java.util.List;

public record ReadingArticleResponse(
        String id,
        String title,
        String topic,
        String level,
        String content,
        List<KeyVocabularyItem> keyVocabulary,
        List<LearningProgressResponse> learningProgresses
) {
}
