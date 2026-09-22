package com.deutschbridge.backend.model.dto;

/** type is one of DAILY_WORDS, VOCAB_REVIEW, GRAMMAR, READING, EXPRESSIONS, START (no activity yet).
 * title is content-specific (a lesson/article name) and only present for GRAMMAR/READING - the
 * frontend derives copy for every other type from `type` via i18n, since that copy is generic. */
public record ContinueLearningDto(
        String type,
        String title,
        Integer progressPercent,
        int completed,
        int total,
        String route
) {
}
