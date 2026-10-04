package com.deutschbridge.backend.repository;

/** Row shape for ExpressionRepository.findNextInCollection/findPreviousInCollection. */
public interface ExpressionNeighborProjection {
    String getId();
    String getExpression();
}
