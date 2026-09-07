package com.deutschbridge.backend.util;

import com.deutschbridge.backend.model.dto.AnnotationResponse;
import com.deutschbridge.backend.model.dto.LearningProgressResponse;
import com.deutschbridge.backend.model.dto.ReadingArticleResponse;
import com.deutschbridge.backend.model.entity.Annotation;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.ReadingArticle;

import java.util.List;
import java.util.Set;

public class ReadingArticleMapper {
    private ReadingArticleMapper() {
        throw new IllegalStateException("Mapper Utils class");
    }

    /**
     * userProgress must already be scoped to the current authenticated user
     * (see ReadingArticleService) - never pass the entity's own learningProgresses
     * collection here, as it holds every user's progress.
     * knownLemmas must likewise already be scoped to the current user; only lemmas with
     * status KNOWN belong in this set (see spec 3.2/3.4 - only non-KNOWN items are highlighted
     * and counted as "new").
     */
    public static ReadingArticleResponse mapToResponse(ReadingArticle article, LearningProgress userProgress, Set<String> knownLemmas) {
        List<Annotation> annotations = article.getAnnotations() != null ? article.getAnnotations() : List.of();

        List<AnnotationResponse> annotationResponses = annotations.stream()
                .map(a -> new AnnotationResponse(
                        a.getId(),
                        a.getSpans(),
                        a.getSurfaceText(),
                        a.getType(),
                        a.getLemma(),
                        a.getPos(),
                        a.getGender(),
                        a.getPluralForm(),
                        a.getTranslationEn(),
                        a.getLiteralTranslation(),
                        a.getCefrLevel() != null ? a.getCefrLevel().getValue() : null,
                        a.getExampleSentence(),
                        a.getLemma() != null && knownLemmas.contains(a.getLemma())
                ))
                .toList();

        int newWordCount = (int) annotationResponses.stream().filter(a -> !a.known()).count();

        return new ReadingArticleResponse(
                article.getId(),
                article.getTitle(),
                article.getTopic(),
                article.getLevel() != null ? article.getLevel().getValue() : null,
                article.getContent(),
                article.getKeyVocabulary(),
                annotationResponses,
                newWordCount,
                article.getLinkedGroupId(),
                article.getTokens(),
                userProgress != null
                        ? List.of(new LearningProgressResponse(userProgress.getId(), Boolean.TRUE.equals(userProgress.getIsLearned())))
                        : List.of()
        );
    }
}
