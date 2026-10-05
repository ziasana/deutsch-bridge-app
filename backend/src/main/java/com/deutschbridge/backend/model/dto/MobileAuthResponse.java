package com.deutschbridge.backend.model.dto;

public record MobileAuthResponse(String accessToken, String refreshToken, UserProfileResponse user) {
}
