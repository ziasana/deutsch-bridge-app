package com.deutschbridge.backend.model.dto;

/** Expression mastery distribution for the current user, mirroring MasteryBreakdownDto but with
 * the extra ACTIVE tier (recognized but not yet freely produced) that expressions track. */
public record ExpressionMasteryBreakdownDto(
        int newCount,
        int learning,
        int familiar,
        int active,
        int mastered,
        int total
) {
}
