package com.deutschbridge.backend.model.dto;

/**
 * Published expression count for one type (NVV or Redewendung), used to populate the collection
 * cards without shipping any expression. Computed via a SQL aggregate (see ExpressionRepository)
 * so the payload stays two rows regardless of table size.
 */
public record ExpressionCollectionSummaryResponse(
        String type,
        long total
) {
}
