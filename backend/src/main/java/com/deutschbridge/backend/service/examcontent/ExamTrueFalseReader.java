package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.Issue;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import static com.deutschbridge.backend.service.examcontent.ExamContentValidator.error;
import static com.deutschbridge.backend.service.examcontent.ExamContentValidator.warning;

/**
 * Reads and validates a DTZ Lesen Teil 4 exercise: exactly one information text and three richtig/falsch statements numbered 37-39.
 * The result uses the same {@link ParsedExercise.TextSet} shape as Teil 3 (one text carrying three TRUE_FALSE tasks), so storage,
 * preview and the learner flow are shared.
 *
 * Structure is checked deterministically and reported as errors (they block the import). Whether a statement is really supported or
 * contradicted by the text cannot be established by a program: those checks only produce warnings for patterns that often indicate
 * such a problem, and passing them never proves the answer key right.
 */
final class ExamTrueFalseReader {

    static final String EXERCISE_TYPE = "TEXT_TRUE_FALSE";
    static final String TRUE_FALSE = "TRUE_FALSE";
    static final Set<String> TEXT_TYPES = Set.of("INFORMATION_TEXT", "INFORMATION_SHEET", "FORMAL_NOTICE", "INSTITUTIONAL_ANNOUNCEMENT",
            "RULES_AND_CONDITIONS", "PUBLIC_INFORMATION_TEXT");
    static final String DEFAULT_TEXT_TYPE = "INFORMATION_TEXT";

    static final int MAX_TITLE = 200;
    static final int MAX_TOPIC = 200;
    static final int MAX_BODY = 4_000;
    static final int MAX_STATEMENT = 400;
    static final int MAX_EXPLANATION = 1_000;
    static final int SHORT_TEXT_WORDS = 120;
    static final int LONG_TEXT_WORDS = 380;
    static final double LONG_SENTENCE_AVERAGE = 20.0;
    static final double SIMILAR_THRESHOLD = 0.6;

    /** Error codes per check group, for the validation summary shown to the admin. */
    static final Set<String> TEXT_CODES = Set.of("EXERCISE_TYPE_INVALID", "TEXT_MISSING", "TEXT_COUNT", "TEXT_NOT_OBJECT", "TEXT_TITLE_MISSING",
            "TEXT_TITLE_TOO_LONG", "TEXT_BODY_MISSING", "TEXT_BODY_TOO_LONG", "TOPIC_TOO_LONG", "HTML_CONTENT", "PLACEHOLDER_CONTENT");
    static final Set<String> QUESTION_CODES = Set.of("QUESTIONS_MISSING", "QUESTION_COUNT", "QUESTION_NOT_OBJECT", "QUESTION_NUMBER_MISSING",
            "QUESTION_NUMBERS", "QUESTION_TYPE_INVALID", "QUESTION_TEXT_EMPTY", "QUESTION_TEXT_TOO_LONG");
    static final Set<String> ANSWER_CODES = Set.of("TF_ANSWER_INVALID");
    static final Set<String> EXPLANATION_CODES = Set.of("EXPLANATION_MISSING", "EXPLANATION_TRANSLATION_MISSING");

    private static final Pattern MARKUP = Pattern.compile("<\\s*/?\\s*[a-zA-Z!]|javascript:", Pattern.CASE_INSENSITIVE);
    private static final Pattern PLACEHOLDER = Pattern.compile("^\\s*(\\.{3}|…|TODO|TBD|lorem ipsum.*)\\s*$", Pattern.CASE_INSENSITIVE);

    private final String p;
    private final List<Issue> issues;
    private final List<String> strings = new ArrayList<>();

    ExamTrueFalseReader(String pathPrefix, List<Issue> issues) {
        this.p = pathPrefix;
        this.issues = issues;
    }

    /** The parsed text with its three tasks and the three scored statements (as ordinary questions, so the generic counting applies). */
    record Result(ParsedExercise.TextSet textSet, List<ParsedExercise.Question> questions) {
    }

    Result read(ExamContentSpec spec, JsonNode node) {
        checkExerciseType(node);
        String topic = collect(text(node, "topic"));
        if (topic != null && topic.length() > MAX_TOPIC) {
            issues.add(error("TOPIC_TOO_LONG", p + "topic", "topic is longer than " + MAX_TOPIC + " characters."));
        }
        String languageLevel = readLanguageLevel(node);

        List<ParsedExercise.Question> questions = new ArrayList<>();
        List<ParsedExercise.TextTask> tasks = readTasks(spec, node, questions);
        ParsedExercise.TextItem item = readText(node, tasks);

        List<ParsedExercise.TextItem> items = item == null ? List.of() : List.of(item);
        ParsedExercise.TextSet textSet = new ParsedExercise.TextSet(topic, languageLevel, items);
        rejectMarkup();
        rejectPlaceholders();
        warn(item, tasks);
        return new Result(textSet, questions);
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

    // ------------------------------------------------------------------ text

    /** The one text: {@code text} (an object) or, as in the Teil 3 shape, a {@code texts} array holding exactly one object. */
    private ParsedExercise.TextItem readText(JsonNode node, List<ParsedExercise.TextTask> tasks) {
        JsonNode single = node.get("text");
        JsonNode array = node.get("texts");
        JsonNode t;
        String path;
        if (array != null && !array.isNull()) {
            if (!array.isArray() || array.size() != 1 || (single != null && !single.isNull())) {
                issues.add(error("TEXT_COUNT", p + "texts", "Exactly one text is required (use the \"text\" object, not several texts)."));
                return null;
            }
            t = array.get(0);
            path = p + "texts[0]";
        } else {
            t = single;
            path = p + "text";
        }
        if (t == null || t.isNull()) {
            issues.add(error("TEXT_MISSING", p + "text", "text must be an object with title and body."));
            return null;
        }
        if (!t.isObject()) {
            issues.add(error("TEXT_NOT_OBJECT", path, "text must be a JSON object with title and body."));
            return null;
        }
        String rawType = text(t, "type");
        String type = rawType == null ? DEFAULT_TEXT_TYPE : rawType.toUpperCase(Locale.ROOT).replaceAll("[\\s-]+", "_");
        if (!TEXT_TYPES.contains(type)) {
            issues.add(warning("TEXT_TYPE_UNKNOWN", path + ".type", "Unknown text type '" + rawType + "' (use one of " + String.join(", ", new java.util.TreeSet<>(TEXT_TYPES))
                    + "); " + DEFAULT_TEXT_TYPE + " is used."));
            type = DEFAULT_TEXT_TYPE;
        }
        String title = collect(text(t, "title"));
        if (title == null) {
            issues.add(error("TEXT_TITLE_MISSING", path + ".title", "The text has no title."));
        } else if (title.length() > MAX_TITLE) {
            issues.add(error("TEXT_TITLE_TOO_LONG", path + ".title", "The text title is longer than " + MAX_TITLE + " characters."));
        }
        String body = collect(text(t, "body"));
        if (body == null) {
            issues.add(error("TEXT_BODY_MISSING", path + ".body", "The text has no body."));
        } else if (body.length() > MAX_BODY) {
            issues.add(error("TEXT_BODY_TOO_LONG", path + ".body", "The text is longer than " + MAX_BODY + " characters."));
        }
        return new ParsedExercise.TextItem("text_1", 1, type, title, null, null, body, tasks);
    }

    // ------------------------------------------------------------------ statements

    private List<ParsedExercise.TextTask> readTasks(ExamContentSpec spec, JsonNode node, List<ParsedExercise.Question> questions) {
        List<ParsedExercise.TextTask> tasks = new ArrayList<>();
        JsonNode array = node.get("questions");
        if (array == null || !array.isArray()) {
            issues.add(error("QUESTIONS_MISSING", p + "questions", "questions must be an array of exactly " + spec.questionCount() + " statements."));
            return tasks;
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
                    issues.add(error("QUESTION_NUMBERS", qPath + ".number", "Question numbers must be exactly " + spec.firstQuestionNumber() + ", "
                            + (spec.firstQuestionNumber() + 1) + " and " + spec.lastQuestionNumber() + " in order (expected " + expectedNumber + ", found " + number + ")."));
                }
            }
            String rawKind = text(q, "type");
            String kind = rawKind == null ? null : rawKind.toUpperCase(Locale.ROOT).replaceAll("[\\s-]+", "_");
            if (!TRUE_FALSE.equals(kind)) {
                issues.add(error("QUESTION_TYPE_INVALID", qPath + ".type", "type must be " + TRUE_FALSE + " (found: " + rawKind + ")."));
            }
            if (q.hasNonNull("options")) {
                issues.add(warning("OPTIONS_IGNORED", qPath + ".options", "TRUE_FALSE statements have no options; the field is ignored."));
            }
            int id = number != null ? number : expectedNumber;

            String statement = collect(firstNonNull(text(q, "statement"), text(q, "prompt")));
            if (statement == null) {
                issues.add(error("QUESTION_TEXT_EMPTY", qPath + ".statement", "Statement " + (j + 1) + " is empty."));
            } else if (statement.length() > MAX_STATEMENT) {
                issues.add(error("QUESTION_TEXT_TOO_LONG", qPath + ".statement", "Statement " + (j + 1) + " is longer than " + MAX_STATEMENT + " characters."));
            }

            String correct = text(q, "correctAnswer");
            correct = correct == null ? null : correct.toUpperCase(Locale.ROOT);
            if (!"RICHTIG".equals(correct) && !"FALSCH".equals(correct)) {
                issues.add(error("TF_ANSWER_INVALID", qPath + ".correctAnswer", "correctAnswer must be RICHTIG or FALSCH (found: " + text(q, "correctAnswer") + ")."));
                correct = null;
            }

            Map<String, String> explanation = readExplanation(q.get("explanation"));
            for (String lang : List.of("de", "en", "fa")) {
                if (explanation.get(lang) == null) {
                    issues.add(error("EXPLANATION_MISSING", qPath + ".explanation." + lang, "Statement " + (j + 1) + " needs an explanation in "
                            + switch (lang) { case "de" -> "German"; case "en" -> "English"; default -> "Persian"; } + " (" + lang + ")."));
                }
            }
            tasks.add(new ParsedExercise.TextTask(number, TRUE_FALSE, statement, List.of(), correct, explanation));
            questions.add(new ParsedExercise.Question("question_" + id, number, statement, List.of(), correct, TRUE_FALSE));
        }
        return tasks;
    }

    /** explanation is {"de": ..., "en": ..., "fa": ...}. */
    private Map<String, String> readExplanation(JsonNode node) {
        Map<String, String> out = new LinkedHashMap<>();
        if (node == null || node.isNull() || !node.isObject()) return out;
        for (String lang : List.of("de", "en", "fa")) {
            String value = collect(text(node, lang));
            if (value != null) out.put(lang, value.length() > MAX_EXPLANATION ? value.substring(0, MAX_EXPLANATION) : value);
        }
        return out;
    }

    // ------------------------------------------------------------------ semantic warnings (heuristics, never blocking)

    private void warn(ParsedExercise.TextItem item, List<ParsedExercise.TextTask> tasks) {
        issues.add(warning("SEMANTIC_REVIEW_NEEDED", p.isEmpty() ? "$" : p.substring(0, p.length() - 1),
                "The structure is valid, but whether every statement is really supported or contradicted by the text (and cannot be read the other way) "
                        + "cannot be checked automatically — read the text, all three statements and the explanations before publishing."));
        if (item == null || item.body() == null) return;
        String body = item.body();
        int words = TextSimilarity.wordCount(body);
        if (words < SHORT_TEXT_WORDS) {
            issues.add(warning("TEXT_SHORT", p + "text.body", "The text has only " + words + " words; it may be too short to support three meaningful statements."));
        } else if (words > LONG_TEXT_WORDS) {
            issues.add(warning("TEXT_LONG", p + "text.body", "The text has " + words + " words; it may be too long for A2–B1."));
        }
        double sentenceLength = averageSentenceLength(body);
        if (sentenceLength > LONG_SENTENCE_AVERAGE) {
            issues.add(warning("TEXT_SENTENCES_LONG", p + "text.body", "The text averages " + Math.round(sentenceLength)
                    + " words per sentence; the language may be too difficult for A2–B1."));
        }
        List<String> answers = new ArrayList<>();
        List<String> statements = new ArrayList<>();
        for (int index = 0; index < tasks.size(); index++) {
            ParsedExercise.TextTask task = tasks.get(index);
            String path = p + "questions[" + index + "]";
            String label = "Statement " + task.number();
            if (task.correctAnswer() != null) answers.add(task.correctAnswer());
            if (task.prompt() != null) {
                statements.add(task.prompt());
                double support = ExamTextQuestionsReader.support(task.prompt(), body);
                if (support < 0.25) {
                    issues.add(warning("ANSWER_SUPPORT_UNCLEAR", path, label + ": the statement shares very few words with the text — check that the answer is clearly supported "
                            + "or contradicted by it and does not depend on outside knowledge."));
                }
                if (task.correctAnswer() != null && PARTIAL.matcher(task.prompt()).find()) {
                    issues.add(warning("STATEMENT_PARTLY_TRUE", path, label + ": the statement joins several claims (\"" + clipForMessage(task.prompt())
                            + "\") — check that it is not partly true and partly false."));
                }
            }
            String german = task.explanation().get("de");
            if (german != null && ExamTextQuestionsReader.support(german, body + " " + (task.prompt() == null ? "" : task.prompt())) < 0.2) {
                issues.add(warning("EXPLANATION_MISMATCH", path + ".explanation", label + ": the German explanation shares very few words with the text — check that it names the decisive evidence."));
            }
        }
        if (answers.size() == 3 && new HashSet<>(answers).size() == 1) {
            issues.add(warning("ANSWER_SEQUENCE_PREDICTABLE", p + "questions", "All three answers are " + answers.get(0) + "; answers should look balanced."));
        }
        for (int i = 0; i < statements.size(); i++) {
            for (int j = i + 1; j < statements.size(); j++) {
                if (TextSimilarity.similarity(statements.get(i), statements.get(j)) >= SIMILAR_THRESHOLD) {
                    issues.add(warning("QUESTION_SIMILAR", p + "questions", "Two statements are very similar (\"" + clipForMessage(statements.get(i))
                            + "\") — the same detail may be tested twice."));
                }
            }
        }
    }

    /** Statements that join two claims with "und" / "aber" / "sowie" often are partly true and partly false. */
    private static final Pattern PARTIAL = Pattern.compile("\\b(und|aber|sowie|sondern)\\b.*\\b(ist|sind|kann|können|muss|müssen|gibt|kostet|dürfen|darf|beginnt|endet)\\b", Pattern.CASE_INSENSITIVE);

    private static double averageSentenceLength(String body) {
        int count = 0;
        int words = 0;
        for (String sentence : body.split("[.!?]+\\s")) {
            int w = TextSimilarity.wordCount(sentence);
            if (w > 0) {
                count++;
                words += w;
            }
        }
        return count == 0 ? 0 : (double) words / count;
    }

    private static String clipForMessage(String value) {
        return value.length() > 60 ? value.substring(0, 60) + "…" : value;
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
                        "Content must be plain text — HTML/script was found in: \"" + clipForMessage(value) + "\"."));
                return;
            }
        }
    }

    private void rejectPlaceholders() {
        for (String value : strings) {
            if (PLACEHOLDER.matcher(value).matches()) {
                issues.add(error("PLACEHOLDER_CONTENT", p.isEmpty() ? "$" : p.substring(0, p.length() - 1),
                        "A field still contains a placeholder (\"" + clipForMessage(value) + "\"); every field must be filled."));
                return;
            }
        }
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.isObject()) return null;
        JsonNode value = node.get(field);
        if (value == null || value.isNull() || !value.isValueNode()) return null;
        String s = value.asText();
        return s.isBlank() ? null : s.trim();
    }

    private static String firstNonNull(String a, String b) {
        return a != null ? a : b;
    }
}
