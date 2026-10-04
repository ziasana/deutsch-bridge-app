package com.deutschbridge.backend.model.dto;

/**
 * The previous/next published expression of the same collection (type) and level, in the list's
 * default order (newest first, see ExpressionRepository.findListPage) - either side is null at the
 * first/last expression. Not user-scoped.
 */
public record ExpressionNavigationResponse(ExpressionNeighborResponse previous, ExpressionNeighborResponse next) {
}
