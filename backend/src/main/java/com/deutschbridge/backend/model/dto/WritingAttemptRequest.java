package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.WritingMode;

import java.util.List;

public record WritingAttemptRequest(
        String exerciseId,
        String text,
        WritingMode mode,
        List<String> planNotes,
        String parentAttemptId
) {
}
