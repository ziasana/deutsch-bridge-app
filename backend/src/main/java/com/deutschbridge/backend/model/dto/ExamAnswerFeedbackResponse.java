package com.deutschbridge.backend.model.dto;

public record ExamAnswerFeedbackResponse(
        boolean correct,
        String correctAnswer,
        String explanation,
        String commonMistake
) {
}
