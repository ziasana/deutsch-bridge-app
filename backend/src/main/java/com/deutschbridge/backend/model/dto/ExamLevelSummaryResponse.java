package com.deutschbridge.backend.model.dto;

/**
 * Per-level aggregate progress (across every practicable section) for the current user, used to
 * populate the level selector without shipping any individual exercise's content. Computed via a
 * SQL aggregate (see ExamExerciseRepository.aggregateByLevelForUser) so the payload stays a
 * handful of rows regardless of how many exercises exam_exercises holds.
 */
public record ExamLevelSummaryResponse(
        String level,
        long total,
        long mastered,
        int avgScore
) {
}
