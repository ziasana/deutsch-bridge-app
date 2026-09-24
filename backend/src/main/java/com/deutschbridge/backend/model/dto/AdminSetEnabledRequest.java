package com.deutschbridge.backend.model.dto;

import jakarta.validation.constraints.NotNull;

public record AdminSetEnabledRequest(
        @NotNull(message = "enabled is required")
        Boolean enabled
) {
}
