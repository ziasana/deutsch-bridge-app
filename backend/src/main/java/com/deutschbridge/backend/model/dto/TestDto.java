package com.deutschbridge.backend.model.dto;

import jakarta.validation.constraints.NotBlank;

public record TestDto(@NotBlank String name) {
}
