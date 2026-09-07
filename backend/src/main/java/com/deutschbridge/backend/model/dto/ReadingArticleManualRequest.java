package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.Annotation;
import com.deutschbridge.backend.model.entity.KeyVocabularyItem;
import com.deutschbridge.backend.model.entity.ReadingQuizQuestion;
import com.deutschbridge.backend.model.enums.LearningLevel;

import java.util.List;

public record ReadingArticleManualRequest(
        String title,
        String topic,
        LearningLevel level,
        String content,
        List<KeyVocabularyItem> keyVocabulary,
        List<Annotation> annotations,
        List<ReadingQuizQuestion> quiz,
        String linkedGroupId
) {
}
