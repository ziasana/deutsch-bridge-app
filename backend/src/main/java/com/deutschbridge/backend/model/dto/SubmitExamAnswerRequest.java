package com.deutschbridge.backend.model.dto;

public record SubmitExamAnswerRequest(
        String questionId,
        String answer
) {
}
