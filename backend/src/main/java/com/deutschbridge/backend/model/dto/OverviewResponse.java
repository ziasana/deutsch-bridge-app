package com.deutschbridge.backend.model.dto;

public record OverviewResponse(
        Integer dailyGoalWords,
        int itemsLearnedToday,
        CategoryProgress dailyWords,
        CategoryProgress grammar,
        CategoryProgress nomenVerb,
        CategoryProgress reading,
        int totalLearned,
        int totalAvailable
) {
}
