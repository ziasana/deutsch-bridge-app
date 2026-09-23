package com.deutschbridge.backend.model.dto.recommendation;

import java.time.LocalDateTime;

/** A specific piece of content the learner can open: a grammar lesson, reading article or exam exercise. */
public record ActivityRef(
        String entityType,
        String id,
        String title,
        String actionUrl,
        LocalDateTime startedAt
) {
}
