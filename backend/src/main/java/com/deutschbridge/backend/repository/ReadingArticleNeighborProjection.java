package com.deutschbridge.backend.repository;

/** Row shape for ReadingArticleRepository.findNextInLevel/findPreviousInLevel. */
public interface ReadingArticleNeighborProjection {
    String getId();
    String getTitle();
}
