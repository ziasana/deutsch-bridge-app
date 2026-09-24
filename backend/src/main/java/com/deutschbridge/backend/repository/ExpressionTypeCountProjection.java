package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.enums.ExpressionType;

/** Row shape for the per-type published-count aggregate, used by the collection-summary cards. */
public interface ExpressionTypeCountProjection {
    ExpressionType getType();
    Long getTotal();
}
