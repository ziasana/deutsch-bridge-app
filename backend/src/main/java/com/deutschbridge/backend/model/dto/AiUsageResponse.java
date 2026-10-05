package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.FeatureType;

import java.util.Map;

/**
 * Today's AI allowance for the signed-in learner. {@code enforced} is false while the global
 * Premium switch is off - then no limits apply and clients should not show a counter.
 */
public record AiUsageResponse(boolean enforced, Map<FeatureType, FeatureUsageDto> features) {

    public record FeatureUsageDto(int limit, int used, int remaining, boolean enabled) {
    }
}
