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
        Map<String, Object> metadata,
        /** Multiple-choice exercises: the one reading text (null for headings matching). */
        String readingText,
        /** Multiple-choice exercises: the questions about the reading text (empty for headings matching). */
        List<Question> questions
) {
    /** Headings-matching exercise (no reading text / questions). */
    public ParsedExercise(int index, ExamContentSpec spec, String externalId, String title, String instructions,
                          List<Heading> headings, List<Text> texts, Map<String, Object> metadata) {
        this(index, spec, externalId, title, instructions, headings, texts, metadata, null, List.of());
    }

    /** Every text that identifies this exercise's content: the matching texts, or the single reading text. */
    public List<String> textContents() {
        if (readingText != null) return List.of(readingText);
        return texts.stream().map(Text::content).toList();
    }

    public record Option(String id, String text) {
    }

    /** {@code number} is the exam number (6..10), {@code type} the declared question type (may be null). */
    public record Question(String id, Integer number, String question, List<Option> options, String correctOptionId, String type) {
    }

    public record Heading(String id, String text) {
    }

    public record Text(String id, String content, String correctHeadingId) {
    }
}
