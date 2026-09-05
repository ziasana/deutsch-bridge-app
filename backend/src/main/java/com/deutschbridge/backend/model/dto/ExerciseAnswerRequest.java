package com.deutschbridge.backend.model.dto;

import jakarta.validation.constraints.NotBlank;

public record ExerciseAnswerRequest(
        @NotBlank(message = "questionKey is required")
        String questionKey,
        boolean correct
) {
}
