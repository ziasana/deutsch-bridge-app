package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.WritingMode;

import java.util.List;

/** {@code selectedTask}: DTZ Schreiben only - "A" or "B", the alternative the learner chose; null for single-task exercises. */
public record WritingAttemptRequest(
        String exerciseId,
        String text,
        WritingMode mode,
        List<String> planNotes,
        String parentAttemptId,
        String selectedTask
) {
    public WritingAttemptRequest(String exerciseId, String text, WritingMode mode, List<String> planNotes, String parentAttemptId) {
        this(exerciseId, text, mode, planNotes, parentAttemptId, null);
    }
}
