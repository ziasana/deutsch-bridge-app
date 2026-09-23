package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.entity.ExamAnswerRecord;

import java.util.List;

public record ExamAttemptResultResponse(
        String attemptId,
        double score,
        List<ExamAnswerRecord> answerBreakdown,
        /** Every audio transcript of the exercise - safe to reveal now that the attempt is finished. */
        List<ExamTranscriptDto> transcripts
) {
}
