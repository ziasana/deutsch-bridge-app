package com.deutschbridge.backend.model.dto;

/** type is one of DAILY_WORDS, VOCAB_REVIEW, GRAMMAR, READING. */
public record PlanActivityDto(
        String type,
        boolean completed,
        String route
) {
}
