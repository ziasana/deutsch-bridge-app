package com.deutschbridge.backend.model.dto;

/** An audio passage's transcript, revealed on the result page once an attempt is completed. */
public record ExamTranscriptDto(
        String label,
        String transcript
) {
}
