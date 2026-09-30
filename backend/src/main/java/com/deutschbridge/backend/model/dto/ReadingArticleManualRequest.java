package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.Annotation;
import com.deutschbridge.backend.model.entity.KeyVocabularyItem;
import com.deutschbridge.backend.model.entity.ReadingQuizQuestion;
import com.deutschbridge.backend.model.enums.LearningLevel;

import java.util.List;

public record ReadingArticleManualRequest(
        String title,
        /** Existing category id, from the admin form's dropdown. Takes precedence over categoryTitle. */
        String categoryId,
        /** Bulk-import convenience: a category title to find-or-create, used only when categoryId is absent. */
        String categoryTitle,
        LearningLevel level,
        String content,
        String imageUrl,
        String thumbnailUrl,
        List<KeyVocabularyItem> keyVocabulary,
        List<Annotation> annotations,
        List<ReadingQuizQuestion> quiz,
        String linkedGroupId
) {
}
