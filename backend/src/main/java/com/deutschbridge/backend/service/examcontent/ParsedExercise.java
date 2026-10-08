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
        List<Question> questions,
        /** Situation-matching exercises (Lesen Teil 3): the situations to solve. */
        List<Situation> situations,
        /** Situation-matching exercises: the advertisements to choose from. */
        List<Advertisement> advertisements
) {
    /** Reading text + multiple choice. */
    public ParsedExercise(int index, ExamContentSpec spec, String externalId, String title, String instructions,
                          List<Heading> headings, List<Text> texts, Map<String, Object> metadata,
                          String readingText, List<Question> questions) {
        this(index, spec, externalId, title, instructions, headings, texts, metadata, readingText, questions, List.of(), List.of());
    }

    /** Headings-matching exercise (no reading text / questions). */
    public ParsedExercise(int index, ExamContentSpec spec, String externalId, String title, String instructions,
                          List<Heading> headings, List<Text> texts, Map<String, Object> metadata) {
        this(index, spec, externalId, title, instructions, headings, texts, metadata, null, List.of(), List.of(), List.of());
    }

    /** Every text that identifies this exercise's content: the matching texts, or the single reading text. */
    public List<String> textContents() {
        if (readingText != null) return List.of(readingText);
        if (!advertisements.isEmpty()) return advertisements.stream().map(a -> AdvertisementRenderer.toPlainText(a.content())).toList();
        return texts.stream().map(Text::content).toList();
    }

    /** {@code answer} is a..l or x; the profile maps are the optional admin-only matching metadata. */
    public record Situation(String id, Integer number, String text, String correctAdvertisementId, Map<String, Object> matchingProfile) {
    }

    /** Structured advertisement; content / visual / matchingProfile keep the import JSON shape. */
    public record Advertisement(String id, String type, String layout, Map<String, Object> content,
                                Map<String, Object> visual, Map<String, Object> matchingProfile) {
    }

    public record Option(String id, String text) {
    }

    /** {@code number} is the exam number (6..10), {@code type} the declared question type (may be null). */
    public record Question(String id, Integer number, String question, List<Option> options, String correctOptionId, String type,
                           /** Sprachbausteine only: the tested structure, e.g. "adversative_conjunction". */
                           String grammarFocus,
                           /** Sprachbausteine only: explanations by language (de, en, fa). */
                           Map<String, String> explanations) {
        public Question(String id, Integer number, String question, List<Option> options, String correctOptionId, String type) {
            this(id, number, question, options, correctOptionId, type, null, Map.of());
        }
    }

    public record Heading(String id, String text) {
    }

    public record Text(String id, String content, String correctHeadingId) {
    }
}
