package com.deutschbridge.backend.model.dto;

/** One Teil of the learner's time overview. */
public record ExamTimeManagementRowResponse(
        String section,
        int teil,
        int sessions,
        int averageSeconds,
        /** Currently recommended time, or null if none is configured. */
        Integer targetSeconds,
        /** averageSeconds - targetSeconds, or null without a target. */
        Integer differenceSeconds
) {
}
