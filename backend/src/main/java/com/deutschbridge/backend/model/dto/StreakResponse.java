package com.deutschbridge.backend.model.dto;

import java.time.LocalDate;

public record StreakResponse(
        int currentStreak,
        int longestStreak,
        LocalDate lastActiveDate
) {
}
