package com.deutschbridge.backend.model.dto;

/** The only thing the client reports: how long the learner paused. Elapsed time is computed server-side. */
public record ExamPracticeSessionCompleteRequest(Integer pausedSeconds) {
}
