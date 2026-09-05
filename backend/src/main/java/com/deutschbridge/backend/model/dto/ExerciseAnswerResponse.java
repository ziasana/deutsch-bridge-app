package com.deutschbridge.backend.model.dto;

public record ExerciseAnswerResponse(
        String questionKey,
        boolean correct
) {
}
