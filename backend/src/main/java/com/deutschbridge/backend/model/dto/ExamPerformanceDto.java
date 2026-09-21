package com.deutschbridge.backend.model.dto;

/** averageScore is null when the user has no scored exam attempts yet. */
public record ExamPerformanceDto(
        Double averageScore,
        int attemptsCompleted
) {
}
