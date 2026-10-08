package com.deutschbridge.backend.model.dto;

import jakarta.validation.constraints.NotNull;

public record DownloadSettingRequest(@NotNull Boolean premiumOnly) {
}
