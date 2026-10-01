package com.deutschbridge.backend.model.dto;

import java.time.Instant;

public record ExamPracticeSessionResponse(
        String id,
        String scope,
        String mode,
        String section,
        String level,
        Integer teil,
        String exerciseId,
        /** Server clock - the authoritative start the browser derives elapsed time from. */
        Instant startedAt,
        /** Null when there is no applicable target (practice mode, single exercise, or no configuration). */
        Integer targetSeconds
) {
}
