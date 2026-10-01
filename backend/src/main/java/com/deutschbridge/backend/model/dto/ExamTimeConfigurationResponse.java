package com.deutschbridge.backend.model.dto;

/** Learner-facing recommended time for one Teil. */
public record ExamTimeConfigurationResponse(
        String examType,
        String level,
        String section,
        int teil,
        int recommendedMinutes
) {
}
