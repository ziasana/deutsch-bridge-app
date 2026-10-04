package com.deutschbridge.backend.model.dto;

/** One adjacent lesson in a level's list order - enough to render a localized Previous/Next link. */
public record GrammarLessonNeighborResponse(String id, String title, String titleFa, String level) {
}
