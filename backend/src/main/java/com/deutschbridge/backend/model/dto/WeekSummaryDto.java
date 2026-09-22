package com.deutschbridge.backend.model.dto;

import java.util.List;

/** days is a chronological list of the last 7 calendar days (oldest first, today last), each true
 * if the user learned something that day. */
public record WeekSummaryDto(
        List<Boolean> days,
        int learningDays,
        int totalDays
) {
}
