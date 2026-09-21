package com.deutschbridge.backend.model.dto;

import jakarta.validation.constraints.NotBlank;

public record FeatureLimitUpdateRequest(
        @NotBlank String featureType,
        @NotBlank String accountType,
        Integer dailyLimit,
        Boolean enabled
) {
}
