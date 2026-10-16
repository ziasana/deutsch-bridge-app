package com.deutschbridge.backend.model.dto;

public record ExamPracticeSessionResultResponse(
        String id,
        String scope,
        String mode,
        String section,
        String level,
        Integer teil,
        int elapsedSeconds,
        Integer targetSeconds,
        /** elapsed - target (negative = faster than recommended), or null without a target. */
        Integer differenceSeconds,
        int questionsTotal,
        int questionsAnswered,
        int correctAnswers,
        Double score,
        /** TELC or DTZ: the exam the run belongs to, so a Zeit-Check is never shown for the other exam. */
        String examType
) {
}
