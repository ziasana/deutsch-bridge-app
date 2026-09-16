package com.deutschbridge.backend.model.dto;

public record CategoryTestStatusResponse(
        boolean attempted,
        int score,
        int total,
        boolean passed,
        boolean completed,
        int passThreshold
) {
    public static CategoryTestStatusResponse notAttempted(int passThreshold) {
        return new CategoryTestStatusResponse(false, 0, 0, false, false, passThreshold);
    }
}
