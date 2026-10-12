package com.deutschbridge.backend.model.examsim;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * One reached stage of an attempt. Times are epoch millis (JSONB friendly, no time-zone ambiguity).
 *
 * @param endReason null while running; COMPLETED (learner moved on) or EXPIRED (deadline passed)
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record StageState(String timerKey, long startedAtMs, long deadlineAtMs, Long endedAtMs, String endReason) {

    public static final String COMPLETED = "COMPLETED";
    public static final String EXPIRED = "EXPIRED";

    public boolean isRunning() {
        return endedAtMs == null;
    }

    public StageState ended(long atMs, String reason) {
        return new StageState(timerKey, startedAtMs, deadlineAtMs, atMs, reason);
    }
}
