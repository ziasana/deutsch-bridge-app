package com.deutschbridge.backend.model.dto;

public record DashboardResponse(
        DashboardUserDto user,
        int currentStreak,
        ContinueLearningDto continueLearning,
        TodaysPlanDto today,
        ReviewNeededDto review,
        CurrentFocusDto focus,
        WeekSummaryDto week,
        MilestoneDto milestone,
        NewContentDto newContent
) {
}
