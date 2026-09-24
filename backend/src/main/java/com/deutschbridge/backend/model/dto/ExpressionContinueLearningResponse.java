package com.deutschbridge.backend.model.dto;

import java.util.List;

/** The "Continue learning" shortlist for one collection, plus the total count still ready to practice. */
public record ExpressionContinueLearningResponse(
        List<ExpressionListEntryResponse> items,
        long readyCount
) {
}
