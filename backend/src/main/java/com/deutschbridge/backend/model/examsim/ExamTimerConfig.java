package com.deutschbridge.backend.model.examsim;

import com.deutschbridge.backend.model.enums.ExamTimerKind;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * One timed stage of the exam. Parts that reference the same timer key share this timer. The list order of the
 * timers in the profile is the order in which the stages run.
 *
 * @param previewTimerKey PREPARATION timers only: the working timer whose parts are shown (without answer saving)
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ExamTimerConfig(String key, String label, int minutes, ExamTimerKind kind, String previewTimerKey) {

    public ExamTimerKind effectiveKind() {
        return kind != null ? kind : ExamTimerKind.WORKING;
    }

    public boolean isPreparation() {
        return effectiveKind() == ExamTimerKind.PREPARATION;
    }
}
