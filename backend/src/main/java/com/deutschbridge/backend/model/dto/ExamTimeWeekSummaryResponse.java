package com.deutschbridge.backend.model.dto;

/** Small figure for the dashboard card. */
public record ExamTimeWeekSummaryResponse(
        /** Exercises finished this week that were measured against a recommended time. */
        int timedExercisesThisWeek
) {
}
