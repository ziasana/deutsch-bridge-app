package com.deutschbridge.backend.model.dto;

import java.util.List;

/** Everything the admin page needs for one level: the Teil targets plus the exam-level duration and its arithmetic. */
public record ExamTimeSettingsResponse(
        String examType,
        String level,
        /** Total duration of the timed block, or null if none is configured for this level. */
        Integer totalDurationMinutes,
        /** Sum of the enabled Teil targets that count towards the total duration. */
        int configuredMinutes,
        /** totalDurationMinutes - configuredMinutes (negative when over), or null without a total. */
        Integer reviewMinutes,
        /** Validation bounds, so the UI never hardcodes them. */
        int minMinutes,
        int maxMinutes,
        int maxTotalMinutes,
        List<ExamTimeEntryResponse> entries
) {
}
