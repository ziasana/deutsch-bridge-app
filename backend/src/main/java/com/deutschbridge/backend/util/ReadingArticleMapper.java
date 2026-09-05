package com.deutschbridge.backend.util;

import com.deutschbridge.backend.model.dto.LearningProgressResponse;
import com.deutschbridge.backend.model.dto.ReadingArticleResponse;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.ReadingArticle;

import java.util.List;

public class ReadingArticleMapper {
    private ReadingArticleMapper() {
        throw new IllegalStateException("Mapper Utils class");
    }

    /**
     * userProgress must already be scoped to the current authenticated user
     * (see ReadingArticleService) - never pass the entity's own learningProgresses
     * collection here, as it holds every user's progress.
     */
    public static ReadingArticleResponse mapToResponse(ReadingArticle article, LearningProgress userProgress) {
        return new ReadingArticleResponse(
                article.getId(),
                article.getTitle(),
                article.getTopic(),
                article.getLevel() != null ? article.getLevel().getValue() : null,
                article.getContent(),
                article.getKeyVocabulary(),
                userProgress != null
                        ? List.of(new LearningProgressResponse(userProgress.getId(), Boolean.TRUE.equals(userProgress.getIsLearned())))
                        : List.of()
        );
    }
}
