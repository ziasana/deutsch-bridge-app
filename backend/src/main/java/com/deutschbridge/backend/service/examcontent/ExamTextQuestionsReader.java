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
import java.util.regex.Pattern;

import static com.deutschbridge.backend.service.examcontent.ExamContentValidator.error;
import static com.deutschbridge.backend.service.examcontent.ExamContentValidator.warning;

/**
 * Reads and validates a DTZ Lesen Teil 3 exercise ("Informationen und Meinungen in Pressetexten, formelle Mitteilungen verstehen"):
 * exactly three independent texts, each followed by one richtig/falsch task and one multiple-choice task (a, b, c), numbered 31-36.
 *
 * Structure is checked deterministically and reported as errors (they block the import). Whether an answer is really supported by
 * its text, or two options could both be defended, cannot be established by a program: those checks only produce warnings for
 * patterns that often indicate such a problem, and passing them never proves the answer key right.
 */
final class ExamTextQuestionsReader {

    static final String EXERCISE_TYPE = "TEXT_COMPREHENSION_MIXED";
    static final String SKILL = "PRESS_TEXTS_AND_FORMAL_NOTICES";
    static final Set<String> TEXT_TYPES = Set.of("PRESS_TEXT", "EMAIL", "FORMAL_NOTICE", "PUBLIC_ANNOUNCEMENT", "INFORMATION_TEXT");
    static final Set<String> LANGUAGE_LEVELS = Set.of("A2", "A2_B1", "B1");
    static final String TRUE_FALSE = "TRUE_FALSE";
    static final String MULTIPLE_CHOICE = "MULTIPLE_CHOICE";
    /** Fixed by the DTZ format: every text carries a richtig/falsch task first and a multiple-choice task second. */
    static final List<String> TASK_SEQUENCE = List.of(TRUE_FALSE, MULTIPLE_CHOICE);

    static final int MAX_TITLE = 200;
    static final int MAX_META = 200;
    static final int MAX_BODY = 3_000;
    static final int MAX_PROMPT = 400;
    static final int MAX_OPTION = 250;
    static final int MAX_EXPLANATION = 1_000;
    static final int SHORT_TEXT_WORDS = 40;
    static final int LONG_TEXT_WORDS = 260;
    static final double LONG_SENTENCE_AVERAGE = 20.0;
    static final double SIMILAR_THRESHOLD = 0.65;

    /** Error codes per check group, for the validation summary shown to the admin. */
    static final Set<String> TEXT_CODES = Set.of("EXERCISE_TYPE_INVALID", "TEXTS_MISSING", "TEXT_COUNT", "TEXT_NOT_OBJECT", "TEXT_ID_MISSING",
            "TEXT_ID_DUPLICATE", "TEXT_NUMBER_INVALID", "TEXT_TYPE_INVALID", "TEXT_TITLE_MISSING", "TEXT_TITLE_TOO_LONG", "TEXT_BODY_MISSING",
            "TEXT_BODY_TOO_LONG", "TEXT_META_TOO_LONG", "HTML_CONTENT");
    static final Set<String> QUESTION_CODES = Set.of("QUESTIONS_MISSING", "QUESTION_COUNT", "QUESTION_NUMBER_MISSING", "QUESTION_NUMBER_DUPLICATE",
            "QUESTION_NUMBERS", "QUESTION_TYPE_SEQUENCE", "QUESTION_TEXT_EMPTY", "QUESTION_TEXT_TOO_LONG");
    static final Set<String> ANSWER_CODES = Set.of("TF_ANSWER_INVALID", "CORRECT_OPTION_MISSING", "CORRECT_OPTION_UNKNOWN");
    static final Set<String> OPTION_CODES = Set.of("OPTIONS_MISSING", "OPTION_COUNT", "OPTION_IDS", "OPTION_ID_MISSING", "OPTION_ID_DUPLICATE",
            "OPTION_TEXT_EMPTY", "OPTION_TEXT_TOO_LONG", "OPTION_TEXT_DUPLICATE");
    static final Set<String> EXPLANATION_CODES = Set.of("EXPLANATION_MISSING");

    private static final Pattern MARKUP = Pattern.compile("<\\s*/?\\s*[a-zA-Z!]|javascript:", Pattern.CASE_INSENSITIVE);

    private final String p;
    private final List<Issue> issues;
    private final List<String> strings = new ArrayList<>();

    ExamTextQuestionsReader(String pathPrefix, List<Issue> issues) {
        this.p = pathPrefix;
        this.issues = issues;
    }

    /** The parsed texts and the six scored tasks (as ordinary questions, so the generic counting applies). */
    record Result(ParsedExercise.TextSet textSet, List<ParsedExercise.Question> questions) {
    }

    Result read(ExamContentSpec spec, JsonNode node) {
        checkExerciseType(node);
        String topic = text(node, "topic");
        String languageLevel = readLanguageLevel(node);

        List<ParsedExercise.TextItem> items = new ArrayList<>();
        List<ParsedExercise.Question> questions = new ArrayList<>();
        readTexts(spec, node, items, questions);

        rejectMarkup();
        ParsedExercise.TextSet textSet = new ParsedExercise.TextSet(topic, languageLevel, items);
        warn(textSet);
        return new Result(textSet, questions);
    }

    // ------------------------------------------------------------------ header

    private void checkExerciseType(JsonNode node) {
        String exerciseType = text(node, "exerciseType");
        if (exerciseType != null && !EXERCISE_TYPE.equals(exerciseType.toUpperCase(Locale.ROOT))) {
            issues.add(error("EXERCISE_TYPE_INVALID", p + "exerciseType", "exerciseType must be " + EXERCISE_TYPE + " (found: " + exerciseType + ")."));
        }
        String skill = text(node, "skill");
        if (skill != null && !SKILL.equals(skill.toUpperCase(Locale.ROOT))) {
            issues.add(warning("SKILL_UNEXPECTED", p + "skill", "skill is normally " + SKILL + " (found: " + skill + ")."));
        }
    }

    private String readLanguageLevel(JsonNode node) {
        String difficulty = text(node, "difficulty");
        if (difficulty == null) return "A2_B1";
        String normalized = difficulty.toUpperCase(Locale.ROOT).replaceAll("[-– ]", "_");
        if (!LANGUAGE_LEVELS.contains(normalized)) {
            issues.add(warning("DIFFICULTY_UNKNOWN", p + "difficulty", "Unknown difficulty '" + difficulty + "' (use A2, A2_B1 or B1); A2_B1 is used."));
            return "A2_B1";
        }
        return normalized;
    }

    // ------------------------------------------------------------------ texts

    private void readTexts(ExamContentSpec spec, JsonNode node, List<ParsedExercise.TextItem> items, List<ParsedExercise.Question> questions) {
        JsonNode array = node.get("texts");
        if (array == null || !array.isArray()) {
            issues.add(error("TEXTS_MISSING", p + "texts", "texts must be an array of exactly " + spec.textCount() + " texts."));
            return;
        }
        if (array.size() != spec.textCount()) {
            issues.add(error("TEXT_COUNT", p + "texts", "Exactly " + spec.textCount() + " texts are required (found " + array.size() + ")."));
        }
        Set<String> ids = new LinkedHashSet<>();
        Set<Integer> numbers = new HashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode t = array.get(i);
            String path = p + "texts[" + i + "]";
            if (t == null || !t.isObject()) {
                issues.add(error("TEXT_NOT_OBJECT", path, "Each text must be a JSON object."));
                continue;
            }
            String id = text(t, "id");
            if (id == null) {
                issues.add(error("TEXT_ID_MISSING", path + ".id", "Text " + (i + 1) + " has no id."));
            } else if (!ids.add(id)) {
                issues.add(error("TEXT_ID_DUPLICATE", path + ".id", "Text id '" + id + "' is used more than once."));
            }
            JsonNode numberNode = t.get("number");
            int number = i + 1;
            if (numberNode == null || !numberNode.isIntegralNumber() || numberNode.asInt() != i + 1 || !numbers.add(numberNode.asInt())) {
                issues.add(error("TEXT_NUMBER_INVALID", path + ".number", "Text numbers must be 1, 2 and 3 in order (text " + (i + 1) + " needs number " + (i + 1) + ")."));
            }

            String rawType = text(t, "type");
            String type = rawType == null ? null : rawType.toUpperCase(Locale.ROOT).replaceAll("[\\s-]+", "_");
            if (type == null || !TEXT_TYPES.contains(type)) {
                issues.add(error("TEXT_TYPE_INVALID", path + ".type", "type must be one of " + String.join(", ", new java.util.TreeSet<>(TEXT_TYPES)) + " (found: " + rawType + ")."));
                type = null;
            }
            String title = collect(text(t, "title"));
            if (title == null) {
                issues.add(error("TEXT_TITLE_MISSING", path + ".title", "Text " + (i + 1) + " has no title."));
            } else if (title.length() > MAX_TITLE) {
                issues.add(error("TEXT_TITLE_TOO_LONG", path + ".title", "Text " + (i + 1) + " has a title longer than " + MAX_TITLE + " characters."));
            }
            String sender = meta(t, "sender", path);
            String date = meta(t, "date", path);
            String body = collect(text(t, "body"));
            if (body == null) {
                issues.add(error("TEXT_BODY_MISSING", path + ".body", "Text " + (i + 1) + " has no body."));
            } else if (body.length() > MAX_BODY) {
                issues.add(error("TEXT_BODY_TOO_LONG", path + ".body", "Text " + (i + 1) + " is longer than " + MAX_BODY + " characters."));
            }

            List<ParsedExercise.TextTask> tasks = readTasks(spec, t, path, i, questions);
            items.add(new ParsedExercise.TextItem(id, i + 1, type, title, sender, date, body, tasks));
        }
        if (array.size() == spec.textCount() && questions.size() != spec.questionCount()) {
            issues.add(error("QUESTION_COUNT", p + "texts", "Exactly " + spec.questionCount() + " scored questions are required in total (found " + questions.size() + ")."));
        }
    }

    private String meta(JsonNode t, String field, String path) {
        String value = collect(text(t, field));
        if (value != null && value.length() > MAX_META) {
            issues.add(error("TEXT_META_TOO_LONG", path + "." + field, field + " is longer than " + MAX_META + " characters."));
        }
        return value;
    }

    // ------------------------------------------------------------------ questions

    private List<ParsedExercise.TextTask> readTasks(ExamContentSpec spec, JsonNode text, String path, int textIndex,
                                                    List<ParsedExercise.Question> questions) {
        List<ParsedExercise.TextTask> tasks = new ArrayList<>();
        JsonNode array = text.get("questions");
        if (array == null || !array.isArray()) {
            issues.add(error("QUESTIONS_MISSING", path + ".questions", "questions must be an array of exactly " + TASK_SEQUENCE.size() + " questions."));
            return tasks;
        }
        if (array.size() != TASK_SEQUENCE.size()) {
            issues.add(error("QUESTION_COUNT", path + ".questions", "Every text needs exactly " + TASK_SEQUENCE.size() + " questions (found " + array.size() + ")."));
        }
        for (int j = 0; j < array.size(); j++) {
            JsonNode q = array.get(j);
            String qPath = path + ".questions[" + j + "]";
            if (q == null || !q.isObject()) {
                issues.add(error("QUESTION_TEXT_EMPTY", qPath, "Each question must be a JSON object."));
                continue;
            }
            int expectedNumber = spec.firstQuestionNumber() + textIndex * TASK_SEQUENCE.size() + j;
            JsonNode numberNode = q.get("number");
            Integer number = null;
            if (numberNode == null || !numberNode.isIntegralNumber()) {
                issues.add(error("QUESTION_NUMBER_MISSING", qPath + ".number", "number must be a whole number (expected " + expectedNumber + ")."));
            } else {
                number = numberNode.asInt();
                if (number != expectedNumber) {
                    issues.add(error("QUESTION_NUMBERS", qPath + ".number", "Question numbers must be " + spec.firstQuestionNumber() + "–" + spec.lastQuestionNumber()
                            + " in order (expected " + expectedNumber + ", found " + number + ")."));
                }
            }
            String expectedKind = j < TASK_SEQUENCE.size() ? TASK_SEQUENCE.get(j) : null;
            String rawKind = text(q, "type");
            String kind = rawKind == null ? null : rawKind.toUpperCase(Locale.ROOT).replaceAll("[\\s-]+", "_");
            if (expectedKind != null && !expectedKind.equals(kind)) {
                issues.add(error("QUESTION_TYPE_SEQUENCE", qPath + ".type", "Question " + (j + 1) + " of every text must be " + expectedKind + " (found: " + rawKind + ")."));
            }
            int id = number != null ? number : expectedNumber;
            Map<String, String> explanation = readExplanation(q.get("explanation"));
            if (explanation.get("de") == null) {
                issues.add(error("EXPLANATION_MISSING", qPath + ".explanation", "Question " + (j + 1) + " of text " + (textIndex + 1) + " needs a German explanation."));
            } else if (explanation.get("en") == null || explanation.get("fa") == null) {
                issues.add(warning("EXPLANATION_TRANSLATION_MISSING", qPath + ".explanation", "Question " + (j + 1) + " of text " + (textIndex + 1) + " has no English or Persian explanation."));
            }

            boolean trueFalse = TRUE_FALSE.equals(expectedKind != null ? expectedKind : kind);
            String prompt = collect(firstNonNull(text(q, trueFalse ? "statement" : "question"), text(q, "prompt")));
            if (prompt == null) {
                issues.add(error("QUESTION_TEXT_EMPTY", qPath + (trueFalse ? ".statement" : ".question"),
                        "Question " + (j + 1) + " of text " + (textIndex + 1) + " has no " + (trueFalse ? "statement" : "question") + "."));
            } else if (prompt.length() > MAX_PROMPT) {
                issues.add(error("QUESTION_TEXT_TOO_LONG", qPath, "Question " + (j + 1) + " of text " + (textIndex + 1) + " is longer than " + MAX_PROMPT + " characters."));
            }

            String correct = text(q, "correctAnswer");
            List<ParsedExercise.Option> options = List.of();
            if (trueFalse) {
                correct = correct == null ? null : correct.toUpperCase(Locale.ROOT);
                if (!"RICHTIG".equals(correct) && !"FALSCH".equals(correct)) {
                    issues.add(error("TF_ANSWER_INVALID", qPath + ".correctAnswer", "A TRUE_FALSE correctAnswer must be RICHTIG or FALSCH (found: " + text(q, "correctAnswer") + ")."));
                    correct = null;
                }
            } else {
                options = readOptions(spec, q, qPath);
                correct = correct == null ? null : correct.toLowerCase(Locale.ROOT);
                final String correctId = correct;
                if (correct == null) {
                    issues.add(error("CORRECT_OPTION_MISSING", qPath + ".correctAnswer", "Question " + (j + 1) + " of text " + (textIndex + 1) + " has no correctAnswer."));
                } else if (options.stream().noneMatch(o -> correctId.equals(o.id()))) {
                    issues.add(error("CORRECT_OPTION_UNKNOWN", qPath + ".correctAnswer", "correctAnswer '" + correct + "' is not one of the options "
                            + String.join(", ", spec.optionIds()) + "."));
                }
            }
            String finalKind = expectedKind != null ? expectedKind : kind;
            tasks.add(new ParsedExercise.TextTask(number, finalKind, prompt, options, correct, explanation));
            questions.add(new ParsedExercise.Question("question_" + id, number, prompt, options, correct, finalKind));
        }
        return tasks;
    }

    /** Options of a multiple-choice task: exactly the keys a, b, c, each with a distinct non-empty text. */
    private List<ParsedExercise.Option> readOptions(ExamContentSpec spec, JsonNode question, String path) {
        List<ParsedExercise.Option> options = new ArrayList<>();
        JsonNode array = question.get("options");
        if (array == null || !array.isArray()) {
            issues.add(error("OPTIONS_MISSING", path + ".options", "options must be an array of " + spec.optionCount() + " options."));
            return options;
        }
        Set<String> ids = new LinkedHashSet<>();
        Set<String> texts = new LinkedHashSet<>();
        for (int k = 0; k < array.size(); k++) {
            JsonNode o = array.get(k);
            String optionPath = path + ".options[" + k + "]";
            String id = firstNonNull(text(o, "key"), text(o, "id"));
            String optionText = collect(text(o, "text"));
            if (id != null) id = id.toLowerCase(Locale.ROOT);
            if (id == null) {
                issues.add(error("OPTION_ID_MISSING", optionPath + ".key", "Option " + (k + 1) + " has no key."));
            } else if (!ids.add(id)) {
                issues.add(error("OPTION_ID_DUPLICATE", optionPath + ".key", "Option key '" + id + "' is used more than once."));
            }
            if (optionText == null) {
                issues.add(error("OPTION_TEXT_EMPTY", optionPath + ".text", "Option '" + id + "' has empty text."));
            } else if (optionText.length() > MAX_OPTION) {
                issues.add(error("OPTION_TEXT_TOO_LONG", optionPath + ".text", "Option '" + id + "' is longer than " + MAX_OPTION + " characters."));
            } else if (!texts.add(TextSimilarity.normalize(optionText))) {
                issues.add(error("OPTION_TEXT_DUPLICATE", optionPath + ".text", "Option '" + id + "' has the same text as another option."));
            }
            options.add(new ParsedExercise.Option(id, optionText));
        }
        List<String> expected = spec.optionIds();
        if (options.size() != spec.optionCount()) {
            issues.add(error("OPTION_COUNT", path + ".options", "Exactly " + spec.optionCount() + " options are required (found " + options.size() + ")."));
        } else if (!ids.equals(new LinkedHashSet<>(expected))) {
            issues.add(error("OPTION_IDS", path + ".options", "Option keys must be exactly " + String.join(", ", expected) + "."));
        }
        return options;
    }

    /** explanation is {"de": ..., "en": ..., "fa": ...}; a plain string is taken as the German one. */
    private Map<String, String> readExplanation(JsonNode node) {
        Map<String, String> out = new LinkedHashMap<>();
        if (node == null || node.isNull()) return out;
        if (node.isTextual()) {
            String value = collect(node.asText().isBlank() ? null : node.asText().strip());
            if (value != null) out.put("de", clip(value));
        } else if (node.isObject()) {
            for (String lang : List.of("de", "en", "fa")) {
                String value = collect(text(node, lang));
                if (value != null) out.put(lang, clip(value));
            }
        }
        return out;
    }

    private static String clip(String value) {
        return value.length() > MAX_EXPLANATION ? value.substring(0, MAX_EXPLANATION) : value;
    }

    // ------------------------------------------------------------------ semantic warnings (heuristics, never blocking)

    private void warn(ParsedExercise.TextSet set) {
        List<ParsedExercise.TextItem> texts = set.texts();
        issues.add(warning("SEMANTIC_REVIEW_NEEDED", p.isEmpty() ? "$" : p.substring(0, p.length() - 1),
                "The structure is valid, but whether every answer is really supported by its text (and no second answer can be defended) "
                        + "cannot be checked automatically — read the texts and the answer key before publishing."));
        if (texts.size() == 3) {
            List<String> types = texts.stream().map(ParsedExercise.TextItem::type).filter(java.util.Objects::nonNull).toList();
            if (types.size() == 3 && new HashSet<>(types).size() == 1) {
                issues.add(warning("TEXT_TYPES_IDENTICAL", p + "texts", "All three texts have the type " + types.get(0) + "; vary the text types unless that was intended."));
            }
        }
        for (int i = 0; i < texts.size(); i++) {
            ParsedExercise.TextItem t = texts.get(i);
            String path = p + "texts[" + i + "]";
            if (t.body() != null) {
                int words = TextSimilarity.wordCount(t.body());
                if (words < SHORT_TEXT_WORDS) {
                    issues.add(warning("TEXT_SHORT", path + ".body", "Text " + (i + 1) + " has only " + words + " words; it may be too short for a meaningful task."));
                } else if (words > LONG_TEXT_WORDS) {
                    issues.add(warning("TEXT_LONG", path + ".body", "Text " + (i + 1) + " has " + words + " words; it may be too long for A2–B1."));
                }
                double sentenceLength = averageSentenceLength(t.body());
                if (sentenceLength > LONG_SENTENCE_AVERAGE) {
                    issues.add(warning("TEXT_SENTENCES_LONG", path + ".body", "Text " + (i + 1) + " averages " + Math.round(sentenceLength)
                            + " words per sentence; the language may be too difficult for A2–B1."));
                }
                for (int j = i + 1; j < texts.size(); j++) {
                    String other = texts.get(j).body();
                    if (other != null && TextSimilarity.similarity(t.body(), other) >= SIMILAR_THRESHOLD) {
                        issues.add(warning("TEXT_SIMILAR", path + ".body", "Texts " + (i + 1) + " and " + (j + 1) + " are very similar; the texts should be independent."));
                    }
                }
            }
            if (("EMAIL".equals(t.type()) || "FORMAL_NOTICE".equals(t.type())) && t.sender() == null) {
                issues.add(warning("SENDER_MISSING", path + ".sender", "Text " + (i + 1) + " is " + t.type() + " but has no sender."));
            }
            for (ParsedExercise.TextTask task : t.tasks()) {
                warnTask(t, task, path);
            }
        }
        warnPatterns(texts);
    }

    private void warnTask(ParsedExercise.TextItem t, ParsedExercise.TextTask task, String path) {
        if (t.body() == null || task.prompt() == null) return;
        String label = "Question " + task.number();
        if (ExamTextQuestionsReader.TRUE_FALSE.equals(task.kind())) {
            if (support(task.prompt(), t.body()) < 0.25) {
                issues.add(warning("ANSWER_SUPPORT_UNCLEAR", path, label + ": the statement shares very few words with its text — check that the answer is clearly supported or contradicted by it."));
            }
            return;
        }
        if (task.options().size() != 3 || task.correctAnswer() == null) return;
        ParsedExercise.Option correct = task.options().stream().filter(o -> task.correctAnswer().equals(o.id())).findFirst().orElse(null);
        if (correct == null || correct.text() == null) return;
        double correctSupport = support(correct.text(), t.body());
        if (correctSupport < 0.2) {
            issues.add(warning("ANSWER_SUPPORT_UNCLEAR", path, label + ": the correct option shares very few words with its text — check that it is supported by the text (it may rely on a paraphrase or outside knowledge)."));
        }
        for (ParsedExercise.Option o : task.options()) {
            if (o == correct || o.text() == null) continue;
            double s = support(o.text(), t.body());
            if (s >= 0.6 && s >= correctSupport) {
                issues.add(warning("OPTION_MAYBE_ALSO_CORRECT", path, label + ": option " + o.id() + " matches the text at least as well as the correct option " + correct.id() + " — check that only one answer can be defended."));
            }
            if (TextSimilarity.wordCount(o.text()) < 2) {
                issues.add(warning("DISTRACTOR_IMPLAUSIBLE", path, label + ": option " + o.id() + " is a single word and may be an obviously implausible distractor."));
            }
        }
        double others = task.options().stream().filter(o -> o != correct && o.text() != null).mapToInt(o -> o.text().length()).average().orElse(0);
        if (others > 0 && correct.text().length() > others * 2) {
            issues.add(warning("CORRECT_OPTION_LONGEST", path, label + ": the correct option is much longer than the others, which gives the answer away."));
        }
    }

    private void warnPatterns(List<ParsedExercise.TextItem> texts) {
        List<String> trueFalse = new ArrayList<>();
        List<String> choice = new ArrayList<>();
        List<String> openings = new ArrayList<>();
        List<String> prompts = new ArrayList<>();
        for (ParsedExercise.TextItem t : texts) {
            for (ParsedExercise.TextTask task : t.tasks()) {
                if (TRUE_FALSE.equals(task.kind()) && task.correctAnswer() != null) trueFalse.add(task.correctAnswer());
                if (MULTIPLE_CHOICE.equals(task.kind())) {
                    if (task.correctAnswer() != null) choice.add(task.correctAnswer());
                    if (task.prompt() != null) openings.add(firstWords(task.prompt(), 2));
                }
                if (task.prompt() != null) prompts.add(task.prompt());
            }
        }
        if (trueFalse.size() == 3 && new HashSet<>(trueFalse).size() == 1) {
            issues.add(warning("ANSWER_SEQUENCE_PREDICTABLE", p + "texts", "All three richtig/falsch answers are " + trueFalse.get(0) + "; answers should look balanced."));
        }
        if (choice.size() == 3 && new HashSet<>(choice).size() == 1) {
            issues.add(warning("ANSWER_SEQUENCE_PREDICTABLE", p + "texts", "All three multiple-choice answers are '" + choice.get(0) + "'; answers should look random."));
        }
        if (openings.size() == 3 && new HashSet<>(openings).size() == 1) {
            issues.add(warning("QUESTION_PATTERN_SAME", p + "texts", "All three multiple-choice questions start with \"" + openings.get(0) + "\"; vary the question pattern."));
        }
        for (int i = 0; i < prompts.size(); i++) {
            for (int j = i + 1; j < prompts.size(); j++) {
                if (TextSimilarity.similarity(prompts.get(i), prompts.get(j)) >= SIMILAR_THRESHOLD) {
                    issues.add(warning("QUESTION_SIMILAR", p + "texts", "Two questions are very similar (\"" + clipForMessage(prompts.get(i)) + "\") — the same information may be tested twice."));
                }
            }
        }
    }

    /** Share of the longer words (5+ letters, compared by their first five letters) of {@code claim} that also occur in {@code body}. */
    static double support(String claim, String body) {
        Set<String> bodyStems = stems(body);
        Set<String> claimStems = stems(claim);
        if (claimStems.isEmpty()) return 1.0;
        long hit = claimStems.stream().filter(bodyStems::contains).count();
        return (double) hit / claimStems.size();
    }

    private static Set<String> stems(String text) {
        Set<String> stems = new HashSet<>();
        for (String word : TextSimilarity.normalize(text).split("\\s+")) {
            if (word.length() >= 5) stems.add(word.substring(0, 5));
        }
        return stems;
    }

    private static double averageSentenceLength(String body) {
        String[] sentences = body.split("[.!?]+\\s");
        int count = 0;
        int words = 0;
        for (String sentence : sentences) {
            int w = TextSimilarity.wordCount(sentence);
            if (w > 0) {
                count++;
                words += w;
            }
        }
        return count == 0 ? 0 : (double) words / count;
    }

    private static String firstWords(String text, int n) {
        String[] words = TextSimilarity.normalize(text).split("\\s+");
        return String.join(" ", java.util.Arrays.copyOf(words, Math.min(n, words.length)));
    }

    private static String clipForMessage(String value) {
        return value.length() > 60 ? value.substring(0, 60) + "…" : value;
    }

    // ------------------------------------------------------------------ helpers

    /** Remembers every string that is shown to a learner so the plain-text (no markup) rule can be checked once at the end. */
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
