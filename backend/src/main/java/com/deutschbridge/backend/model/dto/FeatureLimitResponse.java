package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.FeatureLimit;

public record FeatureLimitResponse(
        String featureType,
        String accountType,
        int dailyLimit,
        boolean enabled
) {
    public static FeatureLimitResponse fromEntity(FeatureLimit limit) {
        return new FeatureLimitResponse(
                limit.getFeatureType().name(),
                limit.getAccountType().name(),
                limit.getDailyLimit(),
                limit.isEnabled()
        );
    }
}
