package com.deutschbridge.backend.model.dto;

import java.util.List;

/** thresholds and reached are parallel lists (same order/size). nextThreshold is null once every
 * threshold has been reached. */
public record MilestoneLadderDto(
        int wordsMastered,
        List<Integer> thresholds,
        List<Boolean> reached,
        Integer nextThreshold
) {
}
