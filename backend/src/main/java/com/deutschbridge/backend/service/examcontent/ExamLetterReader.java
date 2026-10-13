package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.Issue;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.deutschbridge.backend.service.examcontent.ExamContentValidator.error;
import static com.deutschbridge.backend.service.examcontent.ExamContentValidator.warning;

/**
 * Reads and validates a DTZ Lesen Teil 5 exercise: exactly one letter or email with six gaps {{40}}..{{45}}, three options (a, b, c)
 * per gap, one correct answer per gap and a German, English and Persian explanation for each. An unscored example gap (number 0) is optional.
 *
 * Structure is deterministic and reported as errors (they block the import). Whether exactly one option really fits a gap, whether a
 * distractor is plausible and whether the letter reads naturally cannot be established by a program: those checks only produce warnings
 * for patterns that often point at a problem, and passing them never proves the answer key right.
 */
final class ExamLetterReader {

    static final String EXERCISE_TYPE = "LETTER_GAP_FILL";
    static final String QUESTION_TYPE = "MULTIPLE_CHOICE";
    static final String DEFAULT_TEXT_TYPE = "FORMAL_EMAIL";
    static final Set<String> TEXT_TYPES = Set.of("FORMAL_LETTER", "FORMAL_EMAIL", "INFORMAL_EMAIL", "INFORMAL_LETTER", "COMPLAINT",
            "REQUEST_FOR_INFORMATION", "INVITATION", "INVITATION_REPLY", "APPLICATION", "APPOINTMENT", "CANCELLATION", "EVERYDAY_MESSAGE");
    static final Set<String> FORMAL_TEXT_TYPES = Set.of("FORMAL_LETTER", "FORMAL_EMAIL", "COMPLAINT", "REQUEST_FOR_INFORMATION", "APPLICATION");
    static final Set<String> INFORMAL_TEXT_TYPES = Set.of("INFORMAL_EMAIL", "INFORMAL_LETTER", "INVITATION", "INVITATION_REPLY");
    /** The tested language points; unknown categories are ignored with a warning. */
    static final Set<String> CATEGORIES = Set.of(
            "ARTIKEL", "ADJEKTIVENDUNG", "PERSONALPRONOMEN", "POSSESSIVARTIKEL", "RELATIVPRONOMEN", "VERBFORM", "KONJUNKTION",
            "ADVERBIEN_KONNEKTOREN", "PRAEPOSITION", "VERB_PRAEPOSITION", "NEGATION", "SATZSTRUKTUR", "MODALVERB", "WORTSCHATZ",
            "FESTE_WENDUNG", "INFINITIV", "KASUS");

    static final int FIRST = 40;
    static final int COUNT = 6;
    static final int MAX_TITLE = 200;
    static final int MAX_TOPIC = 200;
    static final int MAX_BODY = 4_000;
    static final int MAX_FIELD = 200;
    static final int MAX_OPTION = 80;
    static final int MAX_EXPLANATION = 1_000;
    static final int SHORT_TEXT_WORDS = 90;
    static final int LONG_TEXT_WORDS = 240;

    /** Error codes per check group, for the validation summary shown to the admin. */
    static final Set<String> TEXT_CODES = Set.of("EXERCISE_TYPE_INVALID", "TEXT_MISSING", "TEXT_NOT_OBJECT", "TEXT_BODY_MISSING", "TEXT_BODY_TOO_LONG",
            "TITLE_TOO_LONG", "TOPIC_TOO_LONG", "HTML_CONTENT", "PLACEHOLDER_CONTENT");
    static final Set<String> GAP_CODES = Set.of("GAP_MARKER_MISSING", "GAP_MARKER_DUPLICATE", "GAP_MARKER_UNEXPECTED", "GAP_MARKER_ORDER");
    static final Set<String> QUESTION_CODES = Set.of("QUESTIONS_MISSING", "QUESTION_COUNT", "QUESTION_NOT_OBJECT", "QUESTION_NUMBER_MISSING",
            "QUESTION_NUMBERS", "QUESTION_TYPE_INVALID");
    static final Set<String> OPTION_CODES = Set.of("OPTIONS_MISSING", "OPTION_COUNT", "OPTION_NOT_OBJECT", "OPTION_ID_MISSING", "OPTION_ID_DUPLICATE",
            "OPTION_IDS", "OPTION_TEXT_EMPTY", "OPTION_TEXT_TOO_LONG", "OPTION_TEXT_DUPLICATE");
    static final Set<String> ANSWER_CODES = Set.of("CORRECT_OPTION_MISSING", "CORRECT_OPTION_UNKNOWN");
    static final Set<String> EXPLANATION_CODES = Set.of("EXPLANATION_MISSING");
    static final Set<String> EXAMPLE_CODES = Set.of("EXAMPLE_NOT_OBJECT", "EXAMPLE_NUMBER", "EXAMPLE_TEXT_MISSING", "EXAMPLE_OPTIONS", "EXAMPLE_ANSWER", "EXAMPLE_EXPLANATION");

    private static final Pattern MARKER = Pattern.compile("\\{\\{\\s*(\\d{1,3})\\s*}}");
    private static final Pattern MARKUP = Pattern.compile("<\\s*/?\\s*[a-zA-Z!]|javascript:", Pattern.CASE_INSENSITIVE);
    private static final Pattern PLACEHOLDER = Pattern.compile("^\\s*(\\.{3}|…|TODO|TBD|lorem ipsum.*)\\s*$", Pattern.CASE_INSENSITIVE);
    private static final Pattern FORMAL_GREETING = Pattern.compile("\\bSehr geehrte|\\bMit freundlichen Gr(ü|ue)ßen|\\bHochachtungsvoll", Pattern.CASE_INSENSITIVE);
    private static final Pattern INFORMAL_GREETING = Pattern.compile("\\b(Liebe[rn]?|Hallo|Hi|Hey)\\b|\\b(Liebe Grüße|Viele Grüße|Bis bald|Tschüs|LG)\\b");
    private static final Pattern FORMAL_PRONOUN = Pattern.compile("\\b(Ihnen|Ihre[mnrs]?|Ihr)\\b");
    private static final Pattern INFORMAL_PRONOUN = Pattern.compile("\\b(du|dir|dich|dein|deine|deinen|deinem|deiner|euch|euer|eure)\\b");

    private final String p;
    private final List<Issue> issues;
    private final List<String> strings = new ArrayList<>();

    ExamLetterReader(String pathPrefix, List<Issue> issues) {
        this.p = pathPrefix;
        this.issues = issues;
    }

    /** The letter and the six scored gaps (as ordinary questions, so the generic counting applies). */
    record Result(ParsedExercise.Letter letter, List<ParsedExercise.Question> questions, String readingText) {
    }

    Result read(ExamContentSpec spec, JsonNode node) {
        checkExerciseType(node);
        String topic = collect(text(node, "topic"));
        if (topic != null && topic.length() > MAX_TOPIC) {
            issues.add(error("TOPIC_TOO_LONG", p + "topic", "topic is longer than " + MAX_TOPIC + " characters."));
        }
        String languageLevel = readLanguageLevel(node);
        ParsedExercise.GapExample example = readExample(node.get("example"));
        List<ParsedExercise.Question> questions = readQuestions(spec, node);

        ParsedExercise.Letter letter = readLetter(node, topic, languageLevel, example);
        String body = letter == null ? null : letter.body();
        if (body != null) checkMarkers(spec, body);
        rejectMarkup();
        rejectPlaceholders();
        warn(letter, questions);
        String readingText = body == null ? null : MARKER.matcher(body).replaceAll(m -> "[" + Integer.parseInt(m.group(1)) + "]");
        return new Result(letter, questions, readingText);
    }

    // ------------------------------------------------------------------ header

    private void checkExerciseType(JsonNode node) {
        String exerciseType = text(node, "exerciseType");
        if (exerciseType != null && !EXERCISE_TYPE.equals(exerciseType.toUpperCase(Locale.ROOT))) {
            issues.add(error("EXERCISE_TYPE_INVALID", p + "exerciseType", "exerciseType must be " + EXERCISE_TYPE + " (found: " + exerciseType + ")."));
        }
    }

    private String readLanguageLevel(JsonNode node) {
        String difficulty = text(node, "difficulty");
        if (difficulty == null) return "A2_B1";
        String normalized = difficulty.toUpperCase(Locale.ROOT).replaceAll("[-– ]", "_");
        if (!ExamTextQuestionsReader.LANGUAGE_LEVELS.contains(normalized)) {
            issues.add(warning("DIFFICULTY_UNKNOWN", p + "difficulty", "Unknown difficulty '" + difficulty + "' (use A2, A2_B1 or B1); A2_B1 is used."));
            return "A2_B1";
        }
        return normalized;
    }

    // ------------------------------------------------------------------ letter

    private ParsedExercise.Letter readLetter(JsonNode node, String topic, String languageLevel, ParsedExercise.GapExample example) {
        JsonNode t = node.get("text");
        if (t == null || t.isNull()) {
            issues.add(error("TEXT_MISSING", p + "text", "text must be an object with the letter's body."));
            return null;
        }
        if (!t.isObject()) {
            issues.add(error("TEXT_NOT_OBJECT", p + "text", "text must be a JSON object (type, subject, body ...)."));
            return null;
        }
        String path = p + "text";
        String rawType = text(t, "type");
        String type = rawType == null ? DEFAULT_TEXT_TYPE : rawType.toUpperCase(Locale.ROOT).replaceAll("[\\s-]+", "_");
        if (!TEXT_TYPES.contains(type)) {
            issues.add(warning("TEXT_TYPE_UNKNOWN", path + ".type", "Unknown text type '" + rawType + "' (use one of " + String.join(", ", new java.util.TreeSet<>(TEXT_TYPES))
                    + "); " + DEFAULT_TEXT_TYPE + " is used."));
            type = DEFAULT_TEXT_TYPE;
        }
        String sender = collect(text(t, "sender"));
        String recipient = collect(text(t, "recipient"));
        String date = collect(text(t, "date"));
        String subject = collect(text(t, "subject"));
        for (String[] field : new String[][]{{"sender", sender}, {"recipient", recipient}, {"date", date}, {"subject", subject}}) {
            if (field[1] != null && field[1].length() > MAX_FIELD) {
                issues.add(error("TITLE_TOO_LONG", path + "." + field[0], field[0] + " is longer than " + MAX_FIELD + " characters."));
            }
        }
        String body = collect(text(t, "body"));
        if (body == null) {
            issues.add(error("TEXT_BODY_MISSING", path + ".body", "The letter has no body."));
        } else if (body.length() > MAX_BODY) {
            issues.add(error("TEXT_BODY_TOO_LONG", path + ".body", "The letter is longer than " + MAX_BODY + " characters."));
        }
        return new ParsedExercise.Letter(type, topic, languageLevel, sender, recipient, date, subject, body, example);
    }

    /** Every gap number of the spec appears exactly once, in ascending order, and no other {{n}} marker (including {{0}}) does. */
    private void checkMarkers(ExamContentSpec spec, String body) {
        Map<Integer, Integer> seen = new LinkedHashMap<>();
        List<Integer> order = new ArrayList<>();
        Matcher m = MARKER.matcher(body);
        while (m.find()) {
            int n = Integer.parseInt(m.group(1));
            seen.merge(n, 1, Integer::sum);
            if (!order.contains(n)) order.add(n);
        }
        String path = p + "text.body";
        for (int n = spec.firstQuestionNumber(); n <= spec.lastQuestionNumber(); n++) {
            int count = seen.getOrDefault(n, 0);
            if (count == 0) {
                issues.add(error("GAP_MARKER_MISSING", path, "The text has no gap marker {{" + n + "}}."));
            } else if (count > 1) {
                issues.add(error("GAP_MARKER_DUPLICATE", path, "Gap marker {{" + n + "}} appears " + count + " times; every gap may appear once."));
            }
        }
        seen.keySet().stream().filter(n -> n < spec.firstQuestionNumber() || n > spec.lastQuestionNumber()).forEach(n ->
                issues.add(error("GAP_MARKER_UNEXPECTED", path, "Unexpected gap marker {{" + n + "}}; the scored gaps are numbered "
                        + spec.firstQuestionNumber() + "–" + spec.lastQuestionNumber() + " (the example is not part of the text body).")));
        List<Integer> expected = order.stream().filter(n -> n >= spec.firstQuestionNumber() && n <= spec.lastQuestionNumber()).sorted().toList();
        List<Integer> actual = order.stream().filter(n -> n >= spec.firstQuestionNumber() && n <= spec.lastQuestionNumber()).toList();
        if (!expected.equals(actual)) {
            issues.add(error("GAP_MARKER_ORDER", path, "Gap markers must appear in ascending order (40, 41, ... 45) but appear as " + actual + "."));
        }
        if (body.contains("[") && Pattern.compile("\\[\\d{1,3}]").matcher(body).find()) {
            issues.add(warning("GAP_MARKER_STYLE", path, "Markers like [40] are not recognised in this part; use {{40}}."));
        }
    }

    // ------------------------------------------------------------------ questions

    private List<ParsedExercise.Question> readQuestions(ExamContentSpec spec, JsonNode node) {
        List<ParsedExercise.Question> questions = new ArrayList<>();
        JsonNode array = node.get("questions");
        if (array == null || !array.isArray()) {
            issues.add(error("QUESTIONS_MISSING", p + "questions", "questions must be an array of exactly " + spec.questionCount() + " gap questions."));
            return questions;
        }
        if (array.size() != spec.questionCount()) {
            issues.add(error("QUESTION_COUNT", p + "questions", "Exactly " + spec.questionCount() + " questions are required (found " + array.size() + ")."));
        }
        for (int j = 0; j < array.size(); j++) {
            JsonNode q = array.get(j);
            String qPath = p + "questions[" + j + "]";
            if (q == null || !q.isObject()) {
                issues.add(error("QUESTION_NOT_OBJECT", qPath, "Each question must be a JSON object."));
                continue;
            }
            int expectedNumber = spec.firstQuestionNumber() + j;
            JsonNode numberNode = q.get("number");
            Integer number = null;
            if (numberNode == null || !numberNode.isIntegralNumber()) {
                issues.add(error("QUESTION_NUMBER_MISSING", qPath + ".number", "number must be a whole number (expected " + expectedNumber + ")."));
            } else {
                number = numberNode.asInt();
                if (number != expectedNumber) {
                    issues.add(error("QUESTION_NUMBERS", qPath + ".number", "Question numbers must be exactly " + spec.firstQuestionNumber() + " to "
                            + spec.lastQuestionNumber() + " in order (expected " + expectedNumber + ", found " + number + ")."));
                }
            }
            String rawType = text(q, "type");
            String type = rawType == null ? null : rawType.toUpperCase(Locale.ROOT).replaceAll("[\\s-]+", "_");
            if (!QUESTION_TYPE.equals(type)) {
                issues.add(error("QUESTION_TYPE_INVALID", qPath + ".type", "type must be " + QUESTION_TYPE + " (found: " + rawType + ")."));
            }
            int id = number != null ? number : expectedNumber;
            List<ParsedExercise.Option> options = readOptions(q.get("options"), qPath + ".options", 3);

            String correct = firstNonNull(text(q, "correctAnswer"), text(q, "correctOptionId"));
            correct = correct == null ? null : correct.toLowerCase(Locale.ROOT);
            if (correct == null) {
                issues.add(error("CORRECT_OPTION_MISSING", qPath + ".correctAnswer", "Question " + id + " has no correctAnswer."));
            } else {
                final String key = correct;
                if (options.stream().noneMatch(o -> key.equals(o.id()))) {
                    issues.add(error("CORRECT_OPTION_UNKNOWN", qPath + ".correctAnswer", "Question " + id + ": correctAnswer '" + correct + "' is not one of its options."));
                }
            }

            String category = collect(firstNonNull(text(q, "grammarCategory"), text(q, "category")));
            if (category != null) {
                category = category.toUpperCase(Locale.ROOT).replaceAll("[\\s-]+", "_");
                if (!CATEGORIES.contains(category)) {
                    issues.add(warning("CATEGORY_UNKNOWN", qPath + ".grammarCategory", "Unknown grammarCategory '" + category + "' (use " + String.join(", ", new java.util.TreeSet<>(CATEGORIES)) + "); ignored."));
                    category = null;
                }
            } else {
                issues.add(warning("CATEGORY_MISSING", qPath + ".grammarCategory", "Question " + id + " has no grammarCategory."));
            }
            String focus = collect(text(q, "grammarFocus"));

            Map<String, String> explanation = readExplanation(q.get("explanation"));
            for (String lang : List.of("de", "en", "fa")) {
                if (explanation.get(lang) == null) {
                    issues.add(error("EXPLANATION_MISSING", qPath + ".explanation." + lang, "Question " + id + " needs an explanation in " + languageName(lang) + " (" + lang + ")."));
                }
            }
            questions.add(new ParsedExercise.Question("question_" + id, number, null, options, correct, category, focus, explanation));
        }
        return questions;
    }

    private List<ParsedExercise.Option> readOptions(JsonNode array, String path, int expectedCount) {
        List<ParsedExercise.Option> options = new ArrayList<>();
        if (array == null || !array.isArray()) {
            issues.add(error("OPTIONS_MISSING", path, "options must be an array of exactly " + expectedCount + " options (a, b, c)."));
            return options;
        }
        Set<String> ids = new LinkedHashSet<>();
        Set<String> normalized = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode o = array.get(i);
            String oPath = path + "[" + i + "]";
            if (o == null || !o.isObject()) {
                issues.add(error("OPTION_NOT_OBJECT", oPath, "Each option must be an object with key and text."));
                continue;
            }
            String id = firstNonNull(text(o, "key"), text(o, "id"));
            id = id == null ? null : id.toLowerCase(Locale.ROOT);
            String optionText = collect(text(o, "text"));
            if (id == null) {
                issues.add(error("OPTION_ID_MISSING", oPath + ".key", "Option " + (i + 1) + " has no key."));
            } else if (!ids.add(id)) {
                issues.add(error("OPTION_ID_DUPLICATE", oPath + ".key", "Option key '" + id + "' is used more than once."));
            }
            if (optionText == null) {
                issues.add(error("OPTION_TEXT_EMPTY", oPath + ".text", "Option '" + id + "' has empty text."));
            } else {
                if (optionText.length() > MAX_OPTION) {
                    issues.add(error("OPTION_TEXT_TOO_LONG", oPath + ".text", "Option '" + id + "' is longer than " + MAX_OPTION + " characters."));
                }
                if (!normalized.add(TextSimilarity.normalize(optionText))) {
                    issues.add(error("OPTION_TEXT_DUPLICATE", oPath + ".text", "Option '" + id + "' has the same text as another option (options that differ only in punctuation or case count as the same)."));
                }
            }
            options.add(new ParsedExercise.Option(id, optionText));
        }
        if (options.size() != expectedCount) {
            issues.add(error("OPTION_COUNT", path, "Exactly " + expectedCount + " options are required (found " + options.size() + ")."));
        } else if (!ids.equals(new LinkedHashSet<>(List.of("a", "b", "c")))) {
            issues.add(error("OPTION_IDS", path, "Option keys must be exactly a, b and c."));
        }
        return options;
    }

    private Map<String, String> readExplanation(JsonNode node) {
        Map<String, String> out = new LinkedHashMap<>();
        if (node == null || node.isNull() || !node.isObject()) return out;
        for (String lang : List.of("de", "en", "fa")) {
            String value = collect(text(node, lang));
            if (value != null) out.put(lang, value.length() > MAX_EXPLANATION ? value.substring(0, MAX_EXPLANATION) : value);
        }
        return out;
    }

    // ------------------------------------------------------------------ example gap

    /** The optional unscored example (gap 0): absent or null means no example. */
    private ParsedExercise.GapExample readExample(JsonNode e) {
        if (e == null || e.isNull()) return null;
        String path = p + "example";
        if (!e.isObject()) {
            issues.add(error("EXAMPLE_NOT_OBJECT", path, "example must be an object or null."));
            return null;
        }
        JsonNode numberNode = e.get("number");
        if (numberNode == null || !numberNode.isIntegralNumber() || numberNode.asInt() != 0) {
            issues.add(error("EXAMPLE_NUMBER", path + ".number", "The example gap must be numbered 0."));
        }
        String before = rawText(e, "textBeforeGap");
        String after = rawText(e, "textAfterGap");
        if ((before == null || before.isBlank()) && (after == null || after.isBlank())) {
            issues.add(error("EXAMPLE_TEXT_MISSING", path, "The example needs textBeforeGap and/or textAfterGap (the sentence around the gap)."));
        }
        collect(before);
        collect(after);
        List<ParsedExercise.Option> options = readExampleOptions(e.get("options"), path + ".options");
        String correct = firstNonNull(text(e, "correctAnswer"), text(e, "correctOptionId"));
        correct = correct == null ? null : correct.toLowerCase(Locale.ROOT);
        final String key = correct;
        if (correct == null || options.stream().noneMatch(o -> key.equals(o.id()))) {
            issues.add(error("EXAMPLE_ANSWER", path + ".correctAnswer", "The example's correctAnswer must be one of its option keys (a, b, c)."));
        }
        Map<String, String> explanation = readExplanation(e.get("explanation"));
        if (explanation.get("de") == null) {
            issues.add(error("EXAMPLE_EXPLANATION", path + ".explanation.de", "The example needs at least a German explanation."));
        }
        for (String lang : List.of("en", "fa")) {
            if (explanation.get(lang) == null) {
                issues.add(warning("EXAMPLE_TRANSLATION_MISSING", path + ".explanation." + lang, "The example has no " + languageName(lang) + " explanation."));
            }
        }
        return new ParsedExercise.GapExample(before == null ? "" : before, after == null ? "" : after, options, correct, explanation);
    }

    private List<ParsedExercise.Option> readExampleOptions(JsonNode array, String path) {
        List<Issue> local = new ArrayList<>();
        ExamLetterReader sub = new ExamLetterReader(p, local);
        List<ParsedExercise.Option> options = sub.readOptions(array, path, 3);
        strings.addAll(sub.strings);
        for (Issue issue : local) {
            // An example problem is reported as one example error so the summary groups it correctly.
            issues.add(ExamContentValidator.ERROR.equals(issue.severity()) ? error("EXAMPLE_OPTIONS", issue.path(), "Example: " + issue.message()) : issue);
        }
        return options;
    }

    // ------------------------------------------------------------------ semantic warnings (heuristics, never blocking)

    private void warn(ParsedExercise.Letter letter, List<ParsedExercise.Question> questions) {
        issues.add(warning("SEMANTIC_REVIEW_NEEDED", p.isEmpty() ? "$" : p.substring(0, p.length() - 1),
                "The structure is valid, but whether exactly one option fits every gap, whether the distractors are plausible but wrong, and whether the letter reads "
                        + "naturally with the correct answers inserted cannot be checked automatically — solve all six gaps yourself before publishing."));
        if (letter != null && letter.body() != null) {
            String body = letter.body();
            int words = TextSimilarity.wordCount(MARKER.matcher(body).replaceAll("x"));
            if (words < SHORT_TEXT_WORDS) {
                issues.add(warning("TEXT_SHORT", p + "text.body", "The letter has only " + words + " words; 120–200 is the usual range."));
            } else if (words > LONG_TEXT_WORDS) {
                issues.add(warning("TEXT_LONG", p + "text.body", "The letter has " + words + " words; it may be too long for this task (120–200 is the usual range)."));
            }
            warnRegister(letter);
            warnGapPlacement(body);
            warnFilledText(letter, questions);
        }
        warnQuestions(questions);
    }

    /** A formal letter must not switch to du, an informal one must not use Sie / Ihnen, and the greeting should match the declared type. */
    private void warnRegister(ParsedExercise.Letter letter) {
        String all = (letter.body() == null ? "" : letter.body());
        String type = letter.type();
        boolean formalMarks = FORMAL_GREETING.matcher(all).find() || FORMAL_PRONOUN.matcher(all).find();
        boolean informalMarks = INFORMAL_GREETING.matcher(all).find() || INFORMAL_PRONOUN.matcher(all).find();
        if (FORMAL_GREETING.matcher(all).find() && INFORMAL_PRONOUN.matcher(all).find()) {
            issues.add(warning("REGISTER_INCONSISTENT", p + "text.body", "The letter has a formal greeting or closing but also uses du/dir/dein — check that the register stays consistent."));
        } else if (INFORMAL_GREETING.matcher(all).find() && FORMAL_PRONOUN.matcher(all).find() && !all.contains("Sehr geehrte")) {
            issues.add(warning("REGISTER_INCONSISTENT", p + "text.body", "The letter has an informal greeting or closing but also uses Sie/Ihnen — check that the register stays consistent."));
        }
        if (type != null && FORMAL_TEXT_TYPES.contains(type) && informalMarks && !formalMarks) {
            issues.add(warning("REGISTER_TYPE_MISMATCH", p + "text.type", "The text type is " + type + " but the letter reads informal."));
        }
        if (type != null && INFORMAL_TEXT_TYPES.contains(type) && formalMarks && !informalMarks) {
            issues.add(warning("REGISTER_TYPE_MISMATCH", p + "text.type", "The text type is " + type + " but the letter reads formal."));
        }
    }

    /** A gap directly after another gap, or as the very first thing of the body, is hard to solve and usually not intended. */
    private void warnGapPlacement(String body) {
        if (Pattern.compile("}}\\s*\\{\\{").matcher(body).find()) {
            issues.add(warning("GAPS_ADJACENT", p + "text.body", "Two gaps stand directly next to each other; each gap should have its own context."));
        }
        long starts = Pattern.compile("(^|[.!?]\\s+|\\n)\\{\\{\\s*\\d+\\s*}}").matcher(body).results().count();
        if (starts >= 4) {
            issues.add(warning("GAPS_AT_SENTENCE_START", p + "text.body", starts + " of the gaps open a sentence; vary the positions of the gaps."));
        }
    }

    /** The letter with the correct answers inserted: doubled words or a comma / full stop doubled by an option are the usual accidents. */
    private void warnFilledText(ParsedExercise.Letter letter, List<ParsedExercise.Question> questions) {
        String filled = letter.body();
        for (ParsedExercise.Question q : questions) {
            if (q.number() == null || q.correctOptionId() == null) continue;
            String answer = q.options().stream().filter(o -> q.correctOptionId().equals(o.id())).map(ParsedExercise.Option::text).findFirst().orElse(null);
            if (answer == null) continue;
            filled = filled.replace("{{" + q.number() + "}}", answer);
            if (answer.matches(".*[.,;:!?]$")) {
                issues.add(warning("OPTION_PUNCTUATION", p + "questions", "Question " + q.number() + ": the correct option ends with punctuation; options should not contain the punctuation of the sentence."));
            }
        }
        Matcher doubled = Pattern.compile("\\b(\\p{L}+)\\s+\\1\\b", Pattern.CASE_INSENSITIVE).matcher(filled);
        if (doubled.find()) {
            issues.add(warning("TEXT_DOUBLED_WORD", p + "text.body", "With the correct answers inserted the text repeats a word (\"" + doubled.group() + "\") — check that the gap replaces the right word."));
        }
        if (filled.contains("{{")) return;
        if (Pattern.compile("[.!?]\\s+[a-zäöü]").matcher(filled).find()) {
            issues.add(warning("TEXT_CAPITALISATION", p + "text.body", "A sentence starts in lower case with the correct answers inserted — check the capitalisation of the options."));
        }
    }

    private void warnQuestions(List<ParsedExercise.Question> questions) {
        if (questions.isEmpty()) return;
        // answer key
        List<String> keys = questions.stream().map(ParsedExercise.Question::correctOptionId).filter(java.util.Objects::nonNull).toList();
        if (keys.size() == questions.size() && keys.size() >= 3) {
            if (new HashSet<>(keys).size() == 1) {
                issues.add(warning("ANSWER_SEQUENCE_PREDICTABLE", p + "questions", "Every correct answer is '" + keys.get(0) + "'; the answer key should look balanced."));
            } else if (keys.stream().filter(k -> k.equals(keys.get(0))).count() >= 5) {
                issues.add(warning("ANSWER_SEQUENCE_PREDICTABLE", p + "questions", "Most correct answers are '" + keys.get(0) + "'; spread them over a, b and c."));
            }
        }
        // the correct answer is always the longest option
        int longest = 0;
        int counted = 0;
        for (ParsedExercise.Question q : questions) {
            ParsedExercise.Option correct = q.options().stream().filter(o -> o.id() != null && o.id().equals(q.correctOptionId())).findFirst().orElse(null);
            if (correct == null || correct.text() == null || q.options().stream().anyMatch(o -> o.text() == null)) continue;
            counted++;
            boolean unique = q.options().stream().filter(o -> o != correct).allMatch(o -> o.text().length() < correct.text().length());
            if (unique) longest++;
        }
        if (counted >= 5 && longest >= counted - 1) {
            issues.add(warning("CORRECT_ANSWER_LONGEST", p + "questions", "The correct option is the longest one in " + longest + " of " + counted + " questions; distractors should be similar in length."));
        }
        // all options in capitals
        boolean allUpper = questions.stream().flatMap(q -> q.options().stream()).map(ParsedExercise.Option::text)
                .filter(java.util.Objects::nonNull).filter(t -> t.chars().anyMatch(Character::isLetter)).allMatch(t -> t.equals(t.toUpperCase(Locale.ROOT)));
        if (allUpper) {
            issues.add(warning("OPTIONS_UPPERCASE", p + "questions", "All options are written in capitals; use normal German capitalisation."));
        }
        // variety of the tested language points
        Map<String, Integer> categories = new TreeMap<>();
        questions.stream().map(ParsedExercise.Question::type).filter(java.util.Objects::nonNull).forEach(c -> categories.merge(c, 1, Integer::sum));
        categories.forEach((category, count) -> {
            if (count >= 3) {
                issues.add(warning("CATEGORY_DOMINATES", p + "questions", count + " of " + questions.size() + " gaps test " + category + "; vary the tested language points."));
            }
        });
        Map<String, Integer> focuses = new LinkedHashMap<>();
        questions.stream().map(ParsedExercise.Question::grammarFocus).filter(java.util.Objects::nonNull)
                .forEach(f -> focuses.merge(TextSimilarity.normalize(f), 1, Integer::sum));
        if (focuses.values().stream().anyMatch(c -> c >= 2)) {
            issues.add(warning("FOCUS_REPEATED", p + "questions", "Two gaps share the same grammarFocus; check that the same point is not tested twice."));
        }
        // each option set should look like a set: wildly different lengths hint at an implausible distractor
        for (ParsedExercise.Question q : questions) {
            if (q.options().size() == 3 && q.options().stream().allMatch(o -> o.text() != null)) {
                int min = q.options().stream().mapToInt(o -> o.text().length()).min().orElse(0);
                int max = q.options().stream().mapToInt(o -> o.text().length()).max().orElse(0);
                if (min > 0 && max > 3 * min + 8) {
                    issues.add(warning("DISTRACTOR_IMPLAUSIBLE", p + "questions", "Question " + q.number() + ": the options differ greatly in length; check that every distractor is plausible."));
                }
                boolean mixedKinds = q.options().stream().anyMatch(o -> o.text().contains(" ")) && q.options().stream().anyMatch(o -> !o.text().contains(" "));
                if (mixedKinds && max > 20) {
                    issues.add(warning("DISTRACTOR_KIND", p + "questions", "Question " + q.number() + ": single words and phrases are mixed; the options should be of the same kind."));
                }
            }
        }
    }

    // ------------------------------------------------------------------ helpers

    private String collect(String value) {
        if (value != null) strings.add(value);
        return value;
    }

    private void rejectMarkup() {
        for (String value : strings) {
            if (MARKUP.matcher(value).find()) {
                issues.add(error("HTML_CONTENT", p.isEmpty() ? "$" : p.substring(0, p.length() - 1),
                        "Content must be plain text — HTML/script was found in: \"" + clip(value) + "\"."));
                return;
            }
        }
    }

    private void rejectPlaceholders() {
        for (String value : strings) {
            if (PLACEHOLDER.matcher(value).matches()) {
                issues.add(error("PLACEHOLDER_CONTENT", p.isEmpty() ? "$" : p.substring(0, p.length() - 1),
                        "A field still contains a placeholder (\"" + clip(value) + "\"); every field must be filled."));
                return;
            }
        }
    }

    private static String clip(String value) {
        return value.length() > 60 ? value.substring(0, 60) + "…" : value;
    }

    private static String languageName(String lang) {
        return switch (lang) {
            case "de" -> "German";
            case "en" -> "English";
            default -> "Persian";
        };
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.isObject()) return null;
        JsonNode value = node.get(field);
        if (value == null || value.isNull() || !value.isValueNode()) return null;
        String s = value.asText();
        return s.isBlank() ? null : s.trim();
    }

    /** Like {@link #text} but keeps the leading / trailing spaces that matter around a gap. */
    private static String rawText(JsonNode node, String field) {
        if (node == null || !node.isObject()) return null;
        JsonNode value = node.get(field);
        if (value == null || value.isNull() || !value.isValueNode()) return null;
        return value.asText();
    }

    private static String firstNonNull(String a, String b) {
        return a != null ? a : b;
    }
}
