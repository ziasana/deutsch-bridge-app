package com.deutschbridge.backend.model.dto;

/** How long the learner took the last time they finished one exercise. */
public record ExamExerciseLastTimeResponse(
        String exerciseId,
        int elapsedSeconds,
        /** The recommended time the run was measured against, or null if there was none. */
        Integer targetSeconds
) {
}
