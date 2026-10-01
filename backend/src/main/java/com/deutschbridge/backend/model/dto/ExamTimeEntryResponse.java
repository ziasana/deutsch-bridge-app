package com.deutschbridge.backend.model.dto;

/** One Teil row of the admin timing settings. id and recommendedMinutes are null until the part is first configured. */
public record ExamTimeEntryResponse(
        String id,
        String section,
        int teil,
        Integer recommendedMinutes,
        boolean enabled
) {
}
