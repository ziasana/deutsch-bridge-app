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
        List<Advertisement> advertisements,
        /** Word-bank exercises (Sprachbausteine Teil 2): the shared words a..o (id = key, text = the word in capitals). */
        List<Option> wordBank,
        /** Word-bank exercises: optional advertisement / information shown before the text. */
        Context context,
        /** Writing tasks (Schriftlicher Ausdruck): the incoming email, the four points and the classification. */
        Writing writing,
        /** Speaking tasks (Mündlicher Ausdruck): the validated, part-specific learner content. */
        Speaking speaking,
        /** DTZ Lesen Teil 1 (directory matching): the shared information source, the optional example and per-situation extras. */
        Directory directory,
        /** DTZ Lesen Teil 3 (texts with richtig/falsch + multiple choice): the three texts with their two tasks each. */
        TextSet textSet
) {
    /** Everything except the text set (all shapes before DTZ Lesen Teil 3). */
    public ParsedExercise(int index, ExamContentSpec spec, String externalId, String title, String instructions,
                          List<Heading> headings, List<Text> texts, Map<String, Object> metadata,
                          String readingText, List<Question> questions, List<Situation> situations,
                          List<Advertisement> advertisements, List<Option> wordBank, Context context, Writing writing,
                          Speaking speaking, Directory directory) {
        this(index, spec, externalId, title, instructions, headings, texts, metadata, readingText, questions, situations,
                advertisements, wordBank, context, writing, speaking, directory, null);
    }

    /** Everything except the directory task (all pre-DTZ shapes). */
    public ParsedExercise(int index, ExamContentSpec spec, String externalId, String title, String instructions,
                          List<Heading> headings, List<Text> texts, Map<String, Object> metadata,
                          String readingText, List<Question> questions, List<Situation> situations,
                          List<Advertisement> advertisements, List<Option> wordBank, Context context, Writing writing,
                          Speaking speaking) {
        this(index, spec, externalId, title, instructions, headings, texts, metadata, readingText, questions, situations,
                advertisements, wordBank, context, writing, speaking, null);
    }

    /** Everything except the speaking task (the writing task and the pre-writing shapes). */
    public ParsedExercise(int index, ExamContentSpec spec, String externalId, String title, String instructions,
                          List<Heading> headings, List<Text> texts, Map<String, Object> metadata,
                          String readingText, List<Question> questions, List<Situation> situations,
                          List<Advertisement> advertisements, List<Option> wordBank, Context context, Writing writing) {
        this(index, spec, externalId, title, instructions, headings, texts, metadata, readingText, questions, situations,
                advertisements, wordBank, context, writing, null);
    }

    /** Everything except the writing and speaking tasks (the pre-writing shapes). */
    public ParsedExercise(int index, ExamContentSpec spec, String externalId, String title, String instructions,
                          List<Heading> headings, List<Text> texts, Map<String, Object> metadata,
                          String readingText, List<Question> questions, List<Situation> situations,
                          List<Advertisement> advertisements, List<Option> wordBank, Context context) {
        this(index, spec, externalId, title, instructions, headings, texts, metadata, readingText, questions, situations,
                advertisements, wordBank, context, null, null);
    }

    /** Situation matching (12 components, no word bank). */
    public ParsedExercise(int index, ExamContentSpec spec, String externalId, String title, String instructions,
                          List<Heading> headings, List<Text> texts, Map<String, Object> metadata,
                          String readingText, List<Question> questions, List<Situation> situations, List<Advertisement> advertisements) {
        this(index, spec, externalId, title, instructions, headings, texts, metadata, readingText, questions, situations,
                advertisements, List.of(), null);
    }

    /** Reading text + multiple choice. */
    public ParsedExercise(int index, ExamContentSpec spec, String externalId, String title, String instructions,
                          List<Heading> headings, List<Text> texts, Map<String, Object> metadata,
                          String readingText, List<Question> questions) {
        this(index, spec, externalId, title, instructions, headings, texts, metadata, readingText, questions, List.of(), List.of(), List.of(), null);
    }

    /** Headings-matching exercise (no reading text / questions). */
    public ParsedExercise(int index, ExamContentSpec spec, String externalId, String title, String instructions,
                          List<Heading> headings, List<Text> texts, Map<String, Object> metadata) {
        this(index, spec, externalId, title, instructions, headings, texts, metadata, null, List.of(), List.of(), List.of());
    }

    /** Every text that identifies this exercise's content: the matching texts, or the single reading text. */
    public List<String> textContents() {
        if (textSet != null) {
            return textSet.texts().stream().map(TextItem::body).toList();
        }
        if (directory != null) {
            return List.of(directory.plainText());
        }
        if (speaking != null) {
            // Same text the stored passage yields, so duplicate detection compares like with like.
            return List.of(ExamContentMapper.toPlainText(ExamContentMapper.toSpeakingHtml(speaking, instructions)));
        }
        if (writing != null) {
            // Same text the stored passage yields, so duplicate detection compares like with like.
            return List.of(ExamContentMapper.toPlainText(ExamContentMapper.toWritingHtml(writing, instructions)));
        }
        if (!wordBank.isEmpty() && readingText != null) {
            return context == null ? List.of(readingText) : List.of(context.title() + "\n" + context.text(), readingText);
        }
        if (readingText != null) return List.of(readingText);
        if (!advertisements.isEmpty()) return advertisements.stream().map(a -> AdvertisementRenderer.toPlainText(a.content())).toList();
        return texts.stream().map(Text::content).toList();
    }

    /**
     * DTZ Lesen Teil 1: {@code sourceType} is DIRECTORY | REGISTER | CATALOGUE | SERVICE_LIST. The five scored situations are
     * {@link #questions()} of the exercise (options a, b, c, correct option id); this holds what they share and what only
     * the admin sees: {@code sourceEntryIds} and the de/en/fa explanations per question id, plus the unscored example.
     */
    public record Directory(String sourceType, String topic, String languageLevel, String sourceTitle, String introduction,
                            List<Entry> entries, String displayText, Example example,
                            Map<String, List<String>> sourceEntryIdsByQuestion, Map<String, Map<String, String>> explanationsByQuestion) {

        /** The source as plain text (entries, not the free-form displayText): what the learner reads and what duplicate detection compares. */
        public String plainText() {
            StringBuilder b = new StringBuilder();
            if (sourceTitle != null) b.append(sourceTitle).append('\n');
            if (introduction != null) b.append(introduction).append('\n');
            for (Entry entry : entries) {
                b.append('\n').append(entry.heading());
                for (String detail : entry.details()) b.append('\n').append(detail);
            }
            return b.toString().strip();
        }
    }

    /**
     * DTZ Lesen Teil 3: {@code texts} are the three texts in order. The six scored tasks are also {@link #questions()} of the
     * exercise (TRUE_FALSE: correctOptionId RICHTIG / FALSCH, no options; MULTIPLE_CHOICE: options a, b, c); this holds the
     * text structure and the de/en/fa explanations that only the admin sees.
     */
    public record TextSet(String topic, String languageLevel, List<TextItem> texts) {
        /** The distinct text types in order of appearance, e.g. PRESS_TEXT, EMAIL, FORMAL_NOTICE. */
        public List<String> textTypes() {
            return texts.stream().map(TextItem::type).filter(java.util.Objects::nonNull).distinct().toList();
        }
    }

    public record TextItem(String id, int number, String type, String title, String sender, String date, String body, List<TextTask> tasks) {
    }

    /** {@code kind} is TRUE_FALSE or MULTIPLE_CHOICE; {@code options} is empty for TRUE_FALSE; {@code correctAnswer} RICHTIG / FALSCH or a, b, c. */
    public record TextTask(Integer number, String kind, String prompt, List<Option> options, String correctAnswer, Map<String, String> explanation) {
    }

    public record Entry(String id, String heading, List<String> details) {
    }

    /** The unscored example; {@code correctOptionId} is a, b or c. */
    public record Example(String situation, List<Option> options, String correctOptionId, Map<String, String> explanation) {
    }

    /**
     * A TELC "Mündlicher Ausdruck" task. {@code data} is the complete, validated learner content of the part (German text only):
     * topic, selfAssessment and the part-specific fields (topics / person + opinionText + communicationGoals / scenario + planningPoints ...).
     * Only whitelisted keys, strings, lists and maps are ever put in here by the validator.
     */
    public record Speaking(String taskType, String topic, Map<String, Object> data) {
    }

    /**
     * A TELC "Schriftlicher Ausdruck" email-response task. {@code points} are in number order.
     * {@code modelSubject} / {@code modelBody} are the optional model answer.
     */
    public record Writing(String taskType, String scenarioType, String topic, String communicationType, String relationship,
                          String situation, String greeting, String body, String closing, String sender,
                          List<String> points, String writingGuidance, String modelSubject, String modelBody) {
    }

    /** {@code answer} is a..l or x; the profile maps are the optional admin-only matching metadata. */
    public record Situation(String id, Integer number, String text, String correctAdvertisementId, Map<String, Object> matchingProfile,
                            Map<String, String> explanation) {
        public Situation(String id, Integer number, String text, String correctAdvertisementId, Map<String, Object> matchingProfile) {
            this(id, number, text, correctAdvertisementId, matchingProfile, Map.of());
        }
    }

    /** Structured advertisement; content / visual / matchingProfile keep the import JSON shape. */
    public record Advertisement(String id, String type, String layout, Map<String, Object> content,
                                Map<String, Object> visual, Map<String, Object> matchingProfile) {
    }

    /** Optional context material (type e.g. ADVERTISEMENT) that the main text refers to. */
    public record Context(String type, String title, String text) {
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
