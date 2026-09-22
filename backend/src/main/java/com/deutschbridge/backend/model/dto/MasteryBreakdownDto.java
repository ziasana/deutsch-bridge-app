package com.deutschbridge.backend.model.dto;

/** Vocabulary mastery distribution for the current user. newCount includes pool items that have
 * no VocabularyProgress row yet, since the absence of a row means "not started" (NEW). */
public record MasteryBreakdownDto(
        int newCount,
        int learning,
        int familiar,
        int mastered,
        int total
) {
}
