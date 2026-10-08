package com.deutschbridge.backend.model.dto;

import java.util.List;
import java.util.Map;

/** Request / response shapes of the admin exam-content (generator / import / review) API. */
public final class ExamContentDtos {

    private ExamContentDtos() {
    }

    public record PromptRequest(
            String exam,
            String level,
            String section,
            String part,
            Integer count,
            /** MIXED (default) | EASY | MEDIUM | HARD */
            String difficulty,
            /** Topic tokens (see ExamContentPromptBuilder.TOPICS); empty = automatic. */
            List<String> topics,
            /** Optional free-text extra instructions appended to the prompt. */
            String notes,
            /** Situation-matching specs: ask the AI for image briefs (default true). */
            Boolean includeVisuals,
            /** Sprachbausteine: preferred text type (EMAIL, BRIEF ...); null / empty = varied. */
            String textType,
            /** Sprachbausteine: grammar categories to test (see ExamContentPromptBuilder.GRAMMAR_CATEGORIES); empty = all. */
            List<String> grammarCategories,
            /** Sprachbausteine Teil 2: RANDOM (default) | WITH_ADVERTISEMENT | WITHOUT_ADVERTISEMENT. */
            String contextMode,
            /** Sprachbausteine Teil 2: kinds of function words in the word bank (see ExamContentPromptBuilder.WORD_CATEGORIES); empty = all. */
            List<String> wordCategories
    ) {
        public PromptRequest(String exam, String level, String section, String part, Integer count, String difficulty,
                             List<String> topics, String notes) {
            this(exam, level, section, part, count, difficulty, topics, notes, null, null, null, null, null);
        }

        public PromptRequest(String exam, String level, String section, String part, Integer count, String difficulty,
                             List<String> topics, String notes, Boolean includeVisuals) {
            this(exam, level, section, part, count, difficulty, topics, notes, includeVisuals, null, null, null, null);
        }

        public PromptRequest(String exam, String level, String section, String part, Integer count, String difficulty,
                             List<String> topics, String notes, Boolean includeVisuals, String textType, List<String> grammarCategories) {
            this(exam, level, section, part, count, difficulty, topics, notes, includeVisuals, textType, grammarCategories, null, null);
        }
    }

    public record PromptResponse(
            String prompt,
            String promptVersion,
            String schemaVersion,
            String jsonExample,
            int existingCount,
            String firstExternalId
    ) {
    }

    public record SpecInfo(
            String exam,
            String level,
            String section,
            String sectionLabel,
            String part,
            int headingCount,
            int textCount,
            String label,
            /** MATCHING (headings) | MULTIPLE_CHOICE (one text + questions) */
            String taskType,
            int questionCount,
            int optionCount
    ) {
    }

    public record OptionsResponse(
            List<SpecInfo> specs,
            List<String> exams,
            List<String> topics,
            List<String> difficulties,
            List<String> statuses,
            String schemaVersion,
            /** Sprachbausteine generator choices. */
            List<String> textTypes,
            List<String> grammarCategories,
            List<String> wordCategories
    ) {
    }

    public record ValidateRequest(String json) {
    }

    public record ImportRequest(
            String json,
            /** Indexes of the exercises to import; null = every importable exercise except flagged-similar ones. */
            List<Integer> selectedIndexes
    ) {
    }

    public record Issue(String severity, String code, String path, String message) {
    }

    public record Check(String label, boolean ok) {
    }

    public record HeadingView(String id, String text) {
    }

    public record TextView(String id, String content, String correctHeadingId) {
    }

    /** One multiple-choice question: the options reuse {@link HeadingView} (id + text). */
    public record QuestionView(
            String id,
            Integer number,
            String question,
            List<HeadingView> options,
            String correctOptionId,
            String questionType
    ) {
    }

    /** Lesen Teil 3: one situation with its (admin-only) answer and matching profile. */
    public record SituationView(
            String id,
            Integer number,
            String text,
            String correctAdvertisementId,
            Map<String, Object> matchingProfile
    ) {
    }

    /** Lesen Teil 3: one structured advertisement; content / visual / matchingProfile keep the import JSON shape. */
    public record AdvertisementView(
            String id,
            String type,
            String layout,
            Map<String, Object> content,
            Map<String, Object> visual,
            Map<String, Object> matchingProfile
    ) {
    }

    public record ContextView(String type, String title, String text) {
    }

    public record ExercisePreview(
            String title,
            String instructions,
            List<HeadingView> headings,
            List<TextView> texts,
            /** Multiple-choice exercises only: the reading text and its questions. */
            String readingText,
            List<QuestionView> questions,
            /** Situation-matching exercises only (Lesen Teil 3). */
            List<SituationView> situations,
            List<AdvertisementView> advertisements,
            /** Word-bank exercises (Sprachbausteine Teil 2): the optional advertisement / information before the text. */
            ContextView context
    ) {
        public ExercisePreview(String title, String instructions, List<HeadingView> headings, List<TextView> texts,
                               String readingText, List<QuestionView> questions, List<SituationView> situations,
                               List<AdvertisementView> advertisements) {
            this(title, instructions, headings, texts, readingText, questions, situations, advertisements, null);
        }

        public ExercisePreview(String title, String instructions, List<HeadingView> headings, List<TextView> texts,
                               String readingText, List<QuestionView> questions) {
            this(title, instructions, headings, texts, readingText, questions, List.of(), List.of());
        }
    }

    public record DuplicateMatch(
            /** EXACT | SIMILAR | EXTERNAL_ID | BATCH_EXACT | BATCH_SIMILAR */
            String kind,
            String newText,
            String existingText,
            String existingExerciseId,
            String existingTitle,
            String existingExternalId,
            double similarity
    ) {
    }

    public record ExerciseReport(
            int index,
            String externalId,
            String title,
            /** No structural errors. */
            boolean valid,
            /** OK | SIMILAR | EXACT_DUPLICATE | EXTERNAL_ID_EXISTS | INVALID */
            String state,
            /** Valid and not a duplicate - may be imported (similar ones only when explicitly selected). */
            boolean importable,
            List<Issue> issues,
            List<DuplicateMatch> duplicates,
            ExercisePreview preview
    ) {
    }

    public record ValidationReport(
            boolean syntaxValid,
            /** No errors at all (file-level or exercise-level). */
            boolean valid,
            String schemaVersion,
            String contentType,
            String exam,
            String level,
            String section,
            String part,
            int exerciseCount,
            int headingCount,
            int textCount,
            int questionCount,
            int importableCount,
            int similarCount,
            int duplicateCount,
            List<Check> checks,
            List<Issue> issues,
            List<ExerciseReport> exercises
    ) {
    }

    public record SkippedExercise(int index, String externalId, String title, String reason) {
    }

    public record ImportedExercise(int index, String id, String externalId, String title) {
    }

    public record ImportResult(
            List<ImportedExercise> imported,
            List<SkippedExercise> skipped
    ) {
    }

    public record StatusChangeRequest(List<String> ids, String status) {
    }

    public record StatusChangeFailure(String id, String title, String reason) {
    }

    public record StatusChangeResult(int updated, List<StatusChangeFailure> failures) {
    }
}
