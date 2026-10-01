package com.deutschbridge.backend.model.dto;

import java.time.LocalDateTime;
import java.util.List;

public record WritingAttemptResponse(
        String id,
        String exerciseId,
        String mode,
        String text,
        List<String> planNotes,
        int wordCount,
        int attemptNumber,
        String parentAttemptId,
        LocalDateTime submittedAt,
        WritingFeedback feedback,
        WritingAiFeedback aiFeedback
) {
}
