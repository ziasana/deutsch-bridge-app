package com.deutschbridge.backend.model.dto;

/** One adjacent article in a level's list order - just enough to render a Previous/Next link. */
public record ReadingArticleNeighborResponse(String id, String title) {
}
