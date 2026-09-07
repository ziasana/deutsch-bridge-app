package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.ArticleTokenItem;
import com.deutschbridge.backend.model.entity.KeyVocabularyItem;

import java.util.List;

public record ReadingArticleResponse(
        String id,
        String title,
        String topic,
        String level,
        String content,
        List<KeyVocabularyItem> keyVocabulary,
        List<AnnotationResponse> annotations,
        int newWordCount,
        String linkedGroupId,
        List<ArticleTokenItem> tokens,
        List<LearningProgressResponse> learningProgresses
) {
}
