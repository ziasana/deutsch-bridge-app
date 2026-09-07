package com.deutschbridge.backend.model.dto;

import java.util.List;

public record StartAttemptResponse(
        String attemptId,
        List<QuizQuestionPublic> questions
) {
}
