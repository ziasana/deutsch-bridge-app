package com.deutschbridge.backend.model.dto;

/**
 * The previous/next article in the same level's list order (see ReadingArticleRepository.findListPage) -
 * either side is null at the first/last article of the level. Not user-scoped.
 */
public record ReadingArticleNavigationResponse(ReadingArticleNeighborResponse previous, ReadingArticleNeighborResponse next) {
}
