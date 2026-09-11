package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.ExamAnswerRecord;

import java.util.List;

public record ExamAttemptResultResponse(
        String attemptId,
        double score,
        List<ExamAnswerRecord> answerBreakdown
) {
}
