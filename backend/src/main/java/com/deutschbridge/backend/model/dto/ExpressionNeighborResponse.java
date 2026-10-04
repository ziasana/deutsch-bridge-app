package com.deutschbridge.backend.model.dto;

/** One adjacent expression in a collection's list order - just enough to render a Previous/Next link. */
public record ExpressionNeighborResponse(String id, String expression) {
}
