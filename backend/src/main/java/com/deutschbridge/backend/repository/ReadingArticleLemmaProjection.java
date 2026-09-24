package com.deutschbridge.backend.repository;

/** Row shape for ReadingArticleRepository.findAnnotationLemmas - one row per annotation. */
public interface ReadingArticleLemmaProjection {
    String getArticleId();
    String getLemma();
}
