package com.deutschbridge.backend.service.examcontent;

import java.util.List;
import java.util.Map;

/** A structurally read (not necessarily valid) exercise from an import file. */
public record ParsedExercise(
        int index,
        /** Null when the exam/level/section/part combination has no registered spec. */
        ExamContentSpec spec,
        String externalId,
        String title,
        String instructions,
        List<Heading> headings,
        List<Text> texts,
        Map<String, Object> metadata
) {
    public record Heading(String id, String text) {
    }

    public record Text(String id, String content, String correctHeadingId) {
    }
}
