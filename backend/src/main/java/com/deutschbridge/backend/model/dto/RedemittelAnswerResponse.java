package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.RedemittelStatus;

import java.time.LocalDateTime;

public record RedemittelAnswerResponse(
        boolean correct,
        /** True for PRODUCTION, which is not graded - it only counts as attempted. */
        boolean attempted,
        /** What the right answer was (the blank word, the meaning, the matching expression). */
        String correctAnswer,
        /** Production: the expression plus an example to compare against. */
        String modelAnswer,
        RedemittelStatus status,
        /** Null when the answer did not touch the review schedule (practice, or not yet due). */
        LocalDateTime nextReviewAt,
        Integer nextReviewInDays
) {
}
