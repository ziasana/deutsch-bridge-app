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
            List<String> wordCategories,
            /** Schriftlicher Ausdruck: STANDARD_EMAIL | ALTERNATIVE_EMAIL | RANDOM (default). */
            String scenarioType,
            /** Schriftlicher Ausdruck: FRIEND, FAMILY ... ; null / empty = chosen by the AI to fit the situation. */
            String relationship,
            /** Schriftlicher Ausdruck: INFORMAL_EMAIL | SEMI_FORMAL_EMAIL | FORMAL_EMAIL; null / empty = fits the relationship. */
            String communicationType,
            /** DTZ Lesen Teil 1: DIRECTORY | REGISTER | CATALOGUE | SERVICE_LIST | RANDOM (default). */
            String sourceType,
            /** DTZ Lesen Teil 1: include an unscored example (default true). */
            Boolean includeExample,
            /** DTZ Lesen Teil 1: NEW_SCENARIO | AVOID_KNOWN_TOPICS | RANDOM (default). */
            String variation,
            /** DTZ Lesen Teil 2: advertisement categories (see ExamContentPromptBuilder.AD_CATEGORIES); empty = the AI chooses. */
            List<String> adCategories,
            /** DTZ Lesen Teil 3: RANDOM_MIX (default) | PRESS_EMAIL_NOTICE | THREE_PRESS | THREE_EMAILS | THREE_NOTICES | CUSTOM. */
            String textMix,
            /** DTZ Lesen Teil 3, textMix CUSTOM: the type of text 1, 2 and 3 (see ExamContentPromptBuilder.LESEN_TEXT_TYPES). */
            List<String> customTextTypes,
            /** DTZ Lesen Teil 3: SHORT | MEDIUM | LONG (default MEDIUM). */
            String textLength,
            /** DTZ Lesen Teil 3: include dates and times where appropriate (default true). */
            Boolean includeDatesTimes,
            /** DTZ Lesen Teil 3: optional metadata tags the AI should put into metadata.tags. */
            List<String> tags
    ) {
        /** The request shape before the Teil 3 text settings existed. */
        public PromptRequest(String exam, String level, String section, String part, Integer count, String difficulty,
                             List<String> topics, String notes, Boolean includeVisuals, String textType, List<String> grammarCategories,
                             String contextMode, List<String> wordCategories, String scenarioType, String relationship,
                             String communicationType, String sourceType, Boolean includeExample, String variation, List<String> adCategories) {
            this(exam, level, section, part, count, difficulty, topics, notes, includeVisuals, textType, grammarCategories,
                    contextMode, wordCategories, scenarioType, relationship, communicationType, sourceType, includeExample, variation,
                    adCategories, null, null, null, null, null);
        }

        /** The request shape before the Teil 2 advertisement categories existed. */
        public PromptRequest(String exam, String level, String section, String part, Integer count, String difficulty,
                             List<String> topics, String notes, Boolean includeVisuals, String textType, List<String> grammarCategories,
                             String contextMode, List<String> wordCategories, String scenarioType, String relationship,
                             String communicationType, String sourceType, Boolean includeExample, String variation) {
            this(exam, level, section, part, count, difficulty, topics, notes, includeVisuals, textType, grammarCategories,
                    contextMode, wordCategories, scenarioType, relationship, communicationType, sourceType, includeExample, variation, null);
        }

        /** The request shape before the DTZ settings existed. */
        public PromptRequest(String exam, String level, String section, String part, Integer count, String difficulty,
                             List<String> topics, String notes, Boolean includeVisuals, String textType, List<String> grammarCategories,
                             String contextMode, List<String> wordCategories, String scenarioType, String relationship, String communicationType) {
            this(exam, level, section, part, count, difficulty, topics, notes, includeVisuals, textType, grammarCategories,
                    contextMode, wordCategories, scenarioType, relationship, communicationType, null, null, null, null);
        }

        public PromptRequest(String exam, String level, String section, String part, Integer count, String difficulty,
                             List<String> topics, String notes) {
            this(exam, level, section, part, count, difficulty, topics, notes, null, null, null, null, null, null, null, null);
        }

        public PromptRequest(String exam, String level, String section, String part, Integer count, String difficulty,
                             List<String> topics, String notes, Boolean includeVisuals) {
            this(exam, level, section, part, count, difficulty, topics, notes, includeVisuals, null, null, null, null, null, null, null);
        }

        public PromptRequest(String exam, String level, String section, String part, Integer count, String difficulty,
                             List<String> topics, String notes, Boolean includeVisuals, String textType, List<String> grammarCategories) {
            this(exam, level, section, part, count, difficulty, topics, notes, includeVisuals, textType, grammarCategories, null, null, null, null, null);
        }

        public PromptRequest(String exam, String level, String section, String part, Integer count, String difficulty,
                             List<String> topics, String notes, Boolean includeVisuals, String textType, List<String> grammarCategories,
                             String contextMode, List<String> wordCategories) {
            this(exam, level, section, part, count, difficulty, topics, notes, includeVisuals, textType, grammarCategories,
                    contextMode, wordCategories, null, null, null);
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
            List<String> wordCategories,
            /** Schriftlicher Ausdruck generator choices. */
            List<String> scenarioTypes,
            List<String> relationships,
            List<String> communicationTypes,
            /** DTZ Lesen Teil 1 generator choices (first entry = default). */
            List<String> directoryTopics,
            List<String> directorySourceTypes,
            List<String> directoryLevels,
            List<String> directoryVariations,
            /** DTZ Lesen Teil 2 generator choices (first entry = default). */
            List<String> adTopics,
            List<String> adCategories,
            /** DTZ Lesen Teil 3 generator choices (first entry = default). */
            List<String> lesenTextTopics,
            List<String> lesenTextMixes,
            List<String> lesenTextTypes,
            List<String> lesenTextLengths
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
            Map<String, Object> matchingProfile,
            /** DTZ Lesen Teil 2 (admin only): the German explanation of the answer; empty for other content. */
            Map<String, String> explanation
    ) {
        public SituationView(String id, Integer number, String text, String correctAdvertisementId, Map<String, Object> matchingProfile) {
            this(id, number, text, correctAdvertisementId, matchingProfile, Map.of());
        }
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

    /** Schriftlicher Ausdruck: the task as the learner will see it. */
    public record WritingView(
            String taskType,
            String scenarioType,
            String topic,
            String communicationType,
            String relationship,
            String situation,
            String greeting,
            String body,
            String closing,
            String sender,
            List<String> points,
            String writingGuidance,
            String modelSubject,
            String modelBody
    ) {
    }

    /** Mündlicher Ausdruck: the validated, German-only learner content of the part (see SpeakingSchema) as the learner will see it. */
    public record SpeakingView(
            String taskType,
            String topic,
            Map<String, Object> content
    ) {
    }

    /** DTZ Lesen Teil 1: the shared information source as the learner reads it. */
    public record DirectoryEntryView(String id, String heading, List<String> details) {
    }

    /** DTZ Lesen Teil 1: the unscored example (options reuse {@link HeadingView}: key + text). */
    public record DirectoryExampleView(
            String situation,
            List<HeadingView> options,
            String correctOptionId,
            Map<String, String> explanation
    ) {
    }

    /** DTZ Lesen Teil 1, admin only: what supports a question's answer and why (the answer-key view of the preview). */
    public record DirectoryQuestionDetail(Integer number, List<String> sourceEntryIds, Map<String, String> explanation) {
    }

    public record DirectoryView(
            String sourceType,
            String topic,
            String languageLevel,
            String sourceTitle,
            String introduction,
            List<DirectoryEntryView> entries,
            String displayText,
            DirectoryExampleView example,
            List<DirectoryQuestionDetail> questionDetails
    ) {
    }

    /** DTZ Lesen Teil 3: one task of a text; options are empty for TRUE_FALSE, correctAnswer is RICHTIG / FALSCH or a, b, c (admin preview only). */
    public record TextTaskView(Integer number, String type, String prompt, List<HeadingView> options, String correctAnswer, Map<String, String> explanation) {
    }

    public record TextItemView(String id, Integer number, String type, String title, String sender, String date, String body, List<TextTaskView> tasks) {
    }

    public record TextQuestionsView(String topic, String languageLevel, List<TextItemView> texts) {
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
            ContextView context,
            /** Writing tasks (Schriftlicher Ausdruck) only. */
            WritingView writing,
            /** Speaking tasks (Mündlicher Ausdruck) only. */
            SpeakingView speaking,
            /** DTZ Lesen Teil 1 (directory matching) only: the information source, the example and the answer-key details. */
            DirectoryView directory,
            /** DTZ Lesen Teil 3 (texts with richtig/falsch + multiple choice) only: the three texts with their tasks and the answer key. */
            TextQuestionsView textQuestions
    ) {
        public ExercisePreview(String title, String instructions, List<HeadingView> headings, List<TextView> texts,
                               String readingText, List<QuestionView> questions, List<SituationView> situations,
                               List<AdvertisementView> advertisements, ContextView context, WritingView writing, SpeakingView speaking,
                               DirectoryView directory) {
            this(title, instructions, headings, texts, readingText, questions, situations, advertisements, context, writing, speaking, directory, null);
        }

        public ExercisePreview(String title, String instructions, List<HeadingView> headings, List<TextView> texts,
                               String readingText, List<QuestionView> questions, List<SituationView> situations,
                               List<AdvertisementView> advertisements, ContextView context, WritingView writing, SpeakingView speaking) {
            this(title, instructions, headings, texts, readingText, questions, situations, advertisements, context, writing, speaking, null);
        }

        public ExercisePreview(String title, String instructions, List<HeadingView> headings, List<TextView> texts,
                               String readingText, List<QuestionView> questions, List<SituationView> situations,
                               List<AdvertisementView> advertisements, ContextView context, WritingView writing) {
            this(title, instructions, headings, texts, readingText, questions, situations, advertisements, context, writing, null);
        }

        public ExercisePreview(String title, String instructions, List<HeadingView> headings, List<TextView> texts,
                               String readingText, List<QuestionView> questions, List<SituationView> situations,
                               List<AdvertisementView> advertisements, ContextView context) {
            this(title, instructions, headings, texts, readingText, questions, situations, advertisements, context, null, null);
        }

        public ExercisePreview(String title, String instructions, List<HeadingView> headings, List<TextView> texts,
                               String readingText, List<QuestionView> questions, List<SituationView> situations,
                               List<AdvertisementView> advertisements) {
            this(title, instructions, headings, texts, readingText, questions, situations, advertisements, null, null, null);
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
