package com.deutschbridge.backend.model.dto;

public record ProgressStatsResponse(
        MilestoneLadderDto milestones,
        MasteryBreakdownDto vocabulary,
        ExpressionMasteryBreakdownDto expressions,
        GrammarMasteryDto grammar,
        CategoryProgress reading,
        ExamPerformanceDto examPerformance
) {
}
