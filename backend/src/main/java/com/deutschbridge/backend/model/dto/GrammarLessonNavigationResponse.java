package com.deutschbridge.backend.model.dto;

/**
 * The previous/next published lesson in the same level, in the order the learner list shows them
 * (categories by order with their lessons, then the uncategorized lessons) - either side is null at
 * the first/last lesson of the level. Not user-scoped.
 */
public record GrammarLessonNavigationResponse(GrammarLessonNeighborResponse previous, GrammarLessonNeighborResponse next) {
}
