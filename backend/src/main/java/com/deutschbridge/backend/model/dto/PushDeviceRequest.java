package com.deutschbridge.backend.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** {@code platform} is "ios" or "android". */
public record PushDeviceRequest(
        @NotBlank @Pattern(regexp = "^Expo(nent)?PushToken\\[[^\\]]+\\]$", message = "Not an Expo push token") String token,
        @NotBlank @Pattern(regexp = "^(ios|android)$", message = "platform must be ios or android") String platform) {
}
