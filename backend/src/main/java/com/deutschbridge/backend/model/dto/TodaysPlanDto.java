package com.deutschbridge.backend.model.dto;

import java.util.List;

public record TodaysPlanDto(
        int completed,
        int total,
        List<PlanActivityDto> activities
) {
}
