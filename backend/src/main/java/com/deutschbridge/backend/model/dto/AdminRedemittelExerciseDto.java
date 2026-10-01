package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.RedemittelExerciseType;

import java.util.List;

/** Admin read/write shape of one authored exercise. */
public record AdminRedemittelExerciseDto(
        String id,
        RedemittelExerciseType type,
        String prompt,
        String correctAnswer,
        List<String> wrongAnswers,
        int sortOrder
) {
}
