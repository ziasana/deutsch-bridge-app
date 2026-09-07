package com.deutschbridge.backend.model.dto;

public record AnswerFeedbackResponse(
        boolean correct,
        String correctAnswer,
        String explanation,
        String supportingSentence,
        String relatedLemma
) {
}
