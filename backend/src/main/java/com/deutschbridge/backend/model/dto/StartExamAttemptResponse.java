package com.deutschbridge.backend.model.dto;

import java.util.List;

public record StartExamAttemptResponse(
        String attemptId,
        List<ExamPassagePublic> passages,
        List<ExamQuestionPublic> questions,
        List<String> answerOptions
) {
}
