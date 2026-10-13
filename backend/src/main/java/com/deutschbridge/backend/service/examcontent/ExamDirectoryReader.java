package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.Issue;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
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
 * Reads and validates a DTZ Lesen Teil 1 exercise ("Kataloge, Register, Verzeichnisse verstehen"): one shared information source,
 * an optional unscored example and exactly five scored situations with three options each.
 *
 * Structural rules are errors (they block the import). What a program cannot establish - whether a question is ambiguous or an
 * explanation is right - is never claimed: the checks below only produce warnings for patterns that often indicate such a problem.
 */
final class ExamDirectoryReader {

    static final Set<String> SOURCE_TYPES = Set.of("DIRECTORY", "REGISTER", "CATALOGUE", "SERVICE_LIST");
    static final Set<String> LANGUAGE_LEVELS = Set.of("A2", "A2_B1", "B1");
    static final String EXERCISE_TYPE = "DIRECTORY_MATCHING";
    static final String SKILL = "KATALOGE_REGISTER_VERZEICHNISSE";

    static final int MIN_ENTRIES = 3;
    static final int MAX_ENTRIES = 30;
    static final int MAX_DETAILS = 15;
    static final int MAX_HEADING = 200;
    static final int MAX_DETAIL = 300;
    static final int MAX_SITUATION = 400;
    static final int MAX_OPTION = 200;
    static final int MAX_EXPLANATION = 1000;
    static final int MAX_DISPLAY_TEXT = 10_000;
    /** A situation longer than this is more than a short practical need and may be too hard for A2-B1. */
    static final int LONG_SITUATION_WORDS = 30;
    static final double SIMILAR_SITUATION_THRESHOLD = 0.65;

    /** Error codes per check group, for the validation summary shown to the admin. */
    static final Set<String> SOURCE_CODES = Set.of("SOURCE_MISSING", "SOURCE_TYPE_INVALID", "SOURCE_TITLE_MISSING", "ENTRIES_MISSING",
            "ENTRY_COUNT", "ENTRY_ID_MISSING", "ENTRY_ID_DUPLICATE", "ENTRY_HEADING_EMPTY", "ENTRY_HEADING_TOO_LONG", "ENTRY_DETAILS_INVALID",
            "ENTRY_DETAIL_TOO_LONG", "DISPLAY_TEXT_MISSING", "DISPLAY_TEXT_TOO_LONG", "EXERCISE_TYPE_INVALID", "HTML_CONTENT");
    static final Set<String> QUESTION_CODES = Set.of("QUESTIONS_MISSING", "QUESTION_COUNT", "QUESTION_NUMBER_MISSING", "QUESTION_NUMBER_DUPLICATE",
            "QUESTION_NUMBERS", "QUESTION_TEXT_EMPTY", "QUESTION_TEXT_TOO_LONG", "SOURCE_ENTRY_UNKNOWN", "SOURCE_ENTRY_IDS_INVALID");
    static final Set<String> OPTION_CODES = Set.of("OPTIONS_MISSING", "OPTION_COUNT", "OPTION_IDS", "OPTION_ID_MISSING", "OPTION_ID_DUPLICATE",
            "OPTION_TEXT_EMPTY", "OPTION_TEXT_TOO_LONG", "OPTION_TEXT_DUPLICATE", "CORRECT_OPTION_MISSING", "CORRECT_OPTION_UNKNOWN");
    static final Set<String> EXAMPLE_CODES = Set.of("EXAMPLE_INVALID", "EXAMPLE_SITUATION_EMPTY", "EXAMPLE_OPTIONS", "EXAMPLE_ANSWER");

    private static final Pattern MARKUP = Pattern.compile("<\\s*/?\\s*[a-zA-Z!]|javascript:", Pattern.CASE_INSENSITIVE);

    private final String p;
    private final List<Issue> issues;
    private final List<String> strings = new ArrayList<>();

    ExamDirectoryReader(String pathPrefix, List<Issue> issues) {
        this.p = pathPrefix;
        this.issues = issues;
    }

    /** The parsed source and the scored situations (as ordinary questions, so the generic answer-pattern warnings apply). */
    record Result(ParsedExercise.Directory directory, List<ParsedExercise.Question> questions) {
    }

    Result read(ExamContentSpec spec, JsonNode node) {
        checkExerciseType(node);
        String topic = text(node, "topic");
        String languageLevel = readLanguageLevel(node);

        ParsedExercise.Directory source = readSource(node, topic, languageLevel);
        Map<String, List<String>> sourceIds = new LinkedHashMap<>();
        Map<String, Map<String, String>> explanations = new LinkedHashMap<>();
        Set<String> entryIds = source == null ? Set.of() : source.entries().stream().map(ParsedExercise.Entry::id).collect(java.util.stream.Collectors.toSet());
        List<ParsedExercise.Question> questions = readQuestions(spec, node, entryIds, sourceIds, explanations);

        rejectMarkup();
        ParsedExercise.Directory directory = source == null ? null : new ParsedExercise.Directory(source.sourceType(), topic, languageLevel,
                source.sourceTitle(), source.introduction(), source.entries(), source.displayText(), readExample(spec, node), sourceIds, explanations);
        if (directory != null) {
            warnSource(directory, questions, sourceIds);
        }
        warnQuestions(questions, explanations);
        return new Result(directory, questions);
    }

    // ------------------------------------------------------------------ header + source

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

    private ParsedExercise.Directory readSource(JsonNode node, String topic, String languageLevel) {
        JsonNode source = node.get("informationSource");
        if (source == null || !source.isObject()) {
            issues.add(error("SOURCE_MISSING", p + "informationSource", "informationSource (the shared directory / register / catalogue) is required."));
            return null;
        }
        String sp = p + "informationSource";
        String rawType = text(source, "type");
        String type = normalizeSourceType(rawType);
        if (type == null) {
            issues.add(error("SOURCE_TYPE_INVALID", sp + ".type", "informationSource.type must be one of " + String.join(", ", SOURCE_TYPES)
                    + " (found: " + rawType + ")."));
        }
        String title = collect(text(source, "title"));
        if (title == null) issues.add(error("SOURCE_TITLE_MISSING", sp + ".title", "informationSource.title must not be empty."));
        String introduction = collect(text(source, "introduction"));

        List<ParsedExercise.Entry> entries = readEntries(source, sp);
        String displayText = collect(text(source, "displayText"));
        if (displayText == null) {
            issues.add(error("DISPLAY_TEXT_MISSING", sp + ".displayText", "informationSource.displayText must not be empty."));
        } else if (displayText.length() > MAX_DISPLAY_TEXT) {
            issues.add(error("DISPLAY_TEXT_TOO_LONG", sp + ".displayText", "informationSource.displayText is too long (max " + MAX_DISPLAY_TEXT + " characters)."));
        }
        return new ParsedExercise.Directory(type, topic, languageLevel, title, introduction, entries, displayText, null, Map.of(), Map.of());
    }

    private static String normalizeSourceType(String raw) {
        if (raw == null) return null;
        String t = raw.trim().toUpperCase(Locale.ROOT).replaceAll("[\\s-]+", "_");
        t = switch (t) {
            case "CATALOG", "KATALOG" -> "CATALOGUE";
            case "LIST_OF_SERVICES", "SERVICES", "SERVICE_LIST" -> "SERVICE_LIST";
            case "WEGWEISER", "VERZEICHNIS_WEGWEISER" -> "DIRECTORY";
            case "VERZEICHNIS" -> "REGISTER";
            default -> t;
        };
        return SOURCE_TYPES.contains(t) ? t : null;
    }

    private List<ParsedExercise.Entry> readEntries(JsonNode source, String sp) {
        List<ParsedExercise.Entry> entries = new ArrayList<>();
        JsonNode array = source.get("entries");
        if (array == null || !array.isArray() || array.isEmpty()) {
            issues.add(error("ENTRIES_MISSING", sp + ".entries", "informationSource.entries must be a non-empty array."));
            return entries;
        }
        if (array.size() > MAX_ENTRIES) {
            issues.add(error("ENTRY_COUNT", sp + ".entries", "At most " + MAX_ENTRIES + " entries are allowed (found " + array.size() + ")."));
        } else if (array.size() < MIN_ENTRIES) {
            issues.add(error("ENTRY_COUNT", sp + ".entries", "At least " + MIN_ENTRIES + " entries are required (found " + array.size() + ")."));
        }
        Set<String> ids = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode e = array.get(i);
            String path = sp + ".entries[" + i + "]";
            String id = text(e, "id");
            String heading = collect(text(e, "heading"));
            if (id == null) {
                issues.add(error("ENTRY_ID_MISSING", path + ".id", "Entry " + (i + 1) + " has no id."));
            } else if (!ids.add(id)) {
                issues.add(error("ENTRY_ID_DUPLICATE", path + ".id", "Entry id '" + id + "' is used more than once."));
            }
            if (heading == null) {
                issues.add(error("ENTRY_HEADING_EMPTY", path + ".heading", "Entry '" + id + "' has no heading."));
            } else if (heading.length() > MAX_HEADING) {
                issues.add(error("ENTRY_HEADING_TOO_LONG", path + ".heading", "Entry '" + id + "' has a heading longer than " + MAX_HEADING + " characters."));
            }
            List<String> details = new ArrayList<>();
            JsonNode detailArray = e == null ? null : e.get("details");
            if (detailArray != null && !detailArray.isNull()) {
                if (!detailArray.isArray() || detailArray.size() > MAX_DETAILS) {
                    issues.add(error("ENTRY_DETAILS_INVALID", path + ".details", "details must be an array of at most " + MAX_DETAILS + " strings."));
                } else {
                    for (int j = 0; j < detailArray.size(); j++) {
                        JsonNode d = detailArray.get(j);
                        String detail = d.isTextual() ? collect(d.asText().strip().isEmpty() ? null : d.asText().strip()) : null;
                        if (detail == null) {
                            issues.add(error("ENTRY_DETAILS_INVALID", path + ".details[" + j + "]", "Every detail must be a non-empty string."));
                        } else if (detail.length() > MAX_DETAIL) {
                            issues.add(error("ENTRY_DETAIL_TOO_LONG", path + ".details[" + j + "]", "A detail is longer than " + MAX_DETAIL + " characters."));
                        } else {
                            details.add(detail);
                        }
                    }
                }
            }
            if (details.isEmpty() && heading != null) {
                issues.add(warning("ENTRY_WITHOUT_DETAILS", path + ".details", "Entry '" + id + "' has no details; the learner can only match on its heading."));
            }
            entries.add(new ParsedExercise.Entry(id, heading, details));
        }
        return entries;
    }

    // ------------------------------------------------------------------ questions

    private List<ParsedExercise.Question> readQuestions(ExamContentSpec spec, JsonNode node, Set<String> entryIds,
                                                        Map<String, List<String>> sourceIds, Map<String, Map<String, String>> explanations) {
        List<ParsedExercise.Question> questions = new ArrayList<>();
        JsonNode array = node.get("questions");
        if (array == null || !array.isArray()) {
            issues.add(error("QUESTIONS_MISSING", p + "questions", "questions must be an array."));
            return questions;
        }
        if (array.size() != spec.questionCount()) {
            issues.add(error("QUESTION_COUNT", p + "questions", "Exactly " + spec.questionCount() + " scored questions are required (found " + array.size() + "). "
                    + "The example is not a scored question."));
        }
        Set<Integer> numbers = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode q = array.get(i);
            String path = p + "questions[" + i + "]";
            Integer number = null;
            JsonNode numberNode = q == null ? null : q.get("number");
            if (numberNode != null && numberNode.isIntegralNumber()) {
                number = numberNode.asInt();
                if (!numbers.add(number)) {
                    issues.add(error("QUESTION_NUMBER_DUPLICATE", path + ".number", "Question number " + number + " is used more than once."));
                }
            } else {
                issues.add(error("QUESTION_NUMBER_MISSING", path + ".number", "number must be a whole number (" + spec.firstQuestionNumber() + "–" + spec.lastQuestionNumber() + ")."));
            }
            String id = "question_" + (number != null ? number : spec.firstQuestionNumber() + i);

            String situation = collect(text(q, "situation"));
            if (situation == null) {
                issues.add(error("QUESTION_TEXT_EMPTY", path + ".situation", "Question " + (i + 1) + " has no situation."));
            } else if (situation.length() > MAX_SITUATION) {
                issues.add(error("QUESTION_TEXT_TOO_LONG", path + ".situation", "Question " + (i + 1) + " is longer than " + MAX_SITUATION + " characters."));
            }

            List<ParsedExercise.Option> options = readOptions(spec, q, path, true);
            String correct = firstNonNull(text(q, "correctAnswer"), text(q, "correctOptionId"));
            if (correct != null) correct = correct.toLowerCase(Locale.ROOT);
            final String correctId = correct;
            if (correct == null) {
                issues.add(error("CORRECT_OPTION_MISSING", path + ".correctAnswer", "Question " + (i + 1) + " has no correctAnswer."));
            } else if (options.stream().noneMatch(o -> correctId.equals(o.id()))) {
                issues.add(error("CORRECT_OPTION_UNKNOWN", path + ".correctAnswer", "Question " + (i + 1) + " refers to option '" + correct + "', which does not exist."));
            }

            sourceIds.put(id, readSourceEntryIds(q, path, entryIds));
            explanations.put(id, readExplanation(q == null ? null : q.get("explanation")));
            questions.add(new ParsedExercise.Question(id, number, situation, options, correct, null));
        }
        if (!numbers.isEmpty() && numbers.size() == array.size() && array.size() == spec.questionCount()) {
            List<Integer> sorted = numbers.stream().sorted().toList();
            boolean sequential = sorted.get(0) == spec.firstQuestionNumber() && sorted.get(sorted.size() - 1) == spec.lastQuestionNumber();
            if (!sequential) {
                issues.add(error("QUESTION_NUMBERS", p + "questions", "Question numbers must be " + spec.firstQuestionNumber() + " to " + spec.lastQuestionNumber()
                        + " (found " + sorted.get(0) + " to " + sorted.get(sorted.size() - 1) + ")."));
            }
        }
        return questions;
    }

    /** Options of a scored question or the example: exactly the keys a, b, c, each with a distinct non-empty text. */
    private List<ParsedExercise.Option> readOptions(ExamContentSpec spec, JsonNode question, String path, boolean scored) {
        List<ParsedExercise.Option> options = new ArrayList<>();
        JsonNode array = question == null ? null : question.get("options");
        if (array == null || !array.isArray()) {
            issues.add(error(scored ? "OPTIONS_MISSING" : "EXAMPLE_OPTIONS", path + ".options", "options must be an array."));
            return options;
        }
        Set<String> ids = new LinkedHashSet<>();
        Set<String> texts = new LinkedHashSet<>();
        for (int j = 0; j < array.size(); j++) {
            JsonNode o = array.get(j);
            String optionPath = path + ".options[" + j + "]";
            String id = firstNonNull(text(o, "key"), text(o, "id"));
            String optionText = collect(text(o, "text"));
            if (id != null) id = id.toLowerCase(Locale.ROOT);
            if (id == null) {
                issues.add(error(scored ? "OPTION_ID_MISSING" : "EXAMPLE_OPTIONS", optionPath + ".key", "Option " + (j + 1) + " has no key."));
            } else if (!ids.add(id)) {
                issues.add(error(scored ? "OPTION_ID_DUPLICATE" : "EXAMPLE_OPTIONS", optionPath + ".key", "Option key '" + id + "' is used more than once."));
            }
            if (optionText == null) {
                issues.add(error(scored ? "OPTION_TEXT_EMPTY" : "EXAMPLE_OPTIONS", optionPath + ".text", "Option '" + id + "' has empty text."));
            } else if (optionText.length() > MAX_OPTION) {
                issues.add(error(scored ? "OPTION_TEXT_TOO_LONG" : "EXAMPLE_OPTIONS", optionPath + ".text", "Option '" + id + "' is longer than " + MAX_OPTION + " characters."));
            } else if (!texts.add(TextSimilarity.normalize(optionText))) {
                issues.add(error(scored ? "OPTION_TEXT_DUPLICATE" : "EXAMPLE_OPTIONS", optionPath + ".text", "Option '" + id + "' has the same text as another option."));
            }
            options.add(new ParsedExercise.Option(id, optionText));
        }
        List<String> expected = spec.optionIds();
        if (options.size() != spec.optionCount()) {
            issues.add(error(scored ? "OPTION_COUNT" : "EXAMPLE_OPTIONS", path + ".options", "Exactly " + spec.optionCount() + " options are required (found " + options.size() + ")."));
        } else if (!ids.equals(new LinkedHashSet<>(expected))) {
            issues.add(error(scored ? "OPTION_IDS" : "EXAMPLE_OPTIONS", path + ".options", "Option keys must be exactly " + String.join(", ", expected) + "."));
        }
        return options;
    }

    private List<String> readSourceEntryIds(JsonNode question, String path, Set<String> entryIds) {
        List<String> ids = new ArrayList<>();
        JsonNode array = question == null ? null : question.get("sourceEntryIds");
        if (array == null || array.isNull() || (array.isArray() && array.isEmpty())) {
            issues.add(warning("SOURCE_ENTRY_MISSING", path + ".sourceEntryIds", "No sourceEntryIds: the answer key cannot show which entry supports the answer."));
            return ids;
        }
        if (!array.isArray()) {
            issues.add(error("SOURCE_ENTRY_IDS_INVALID", path + ".sourceEntryIds", "sourceEntryIds must be an array of entry ids."));
            return ids;
        }
        for (JsonNode idNode : array) {
            String id = idNode.isTextual() ? idNode.asText().strip() : null;
            if (id == null || id.isEmpty()) {
                issues.add(error("SOURCE_ENTRY_IDS_INVALID", path + ".sourceEntryIds", "sourceEntryIds must only contain entry ids (strings)."));
            } else if (!entryIds.contains(id)) {
                issues.add(error("SOURCE_ENTRY_UNKNOWN", path + ".sourceEntryIds", "sourceEntryIds refers to '" + id + "', which is not an entry of informationSource.entries."));
            } else if (!ids.contains(id)) {
                ids.add(id);
            }
        }
        return ids;
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

    // ------------------------------------------------------------------ example

    /** The unscored example; absent or {"enabled": false} means there is none. */
    private ParsedExercise.Example readExample(ExamContentSpec spec, JsonNode node) {
        JsonNode example = node.get("example");
        if (example == null || example.isNull()) return null;
        String ep = p + "example";
        if (!example.isObject() || !example.has("enabled") || !example.get("enabled").isBoolean()) {
            issues.add(error("EXAMPLE_INVALID", ep, "example must be an object with a boolean 'enabled' (use {\"enabled\": false} for no example)."));
            return null;
        }
        if (!example.get("enabled").asBoolean()) return null;

        String situation = collect(text(example, "situation"));
        if (situation == null) issues.add(error("EXAMPLE_SITUATION_EMPTY", ep + ".situation", "The example needs a situation."));
        List<ParsedExercise.Option> options = readOptions(spec, example, ep, false);
        String correct = firstNonNull(text(example, "correctAnswer"), text(example, "correctOptionId"));
        if (correct != null) correct = correct.toLowerCase(Locale.ROOT);
        final String correctId = correct;
        if (correct == null || options.stream().noneMatch(o -> correctId.equals(o.id()))) {
            issues.add(error("EXAMPLE_ANSWER", ep + ".correctAnswer", "The example's correctAnswer must be one of its options."));
        }
        Map<String, String> explanation = readExplanation(example.get("explanation"));
        if (explanation.get("de") == null) {
            issues.add(warning("EXAMPLE_EXPLANATION_MISSING", ep + ".explanation", "The example has no German explanation."));
        }
        return new ParsedExercise.Example(situation, options, correct, explanation);
    }

    // ------------------------------------------------------------------ warnings (heuristics, never blocking)

    private void warnSource(ParsedExercise.Directory directory, List<ParsedExercise.Question> questions, Map<String, List<String>> sourceIds) {
        // displayText and the structured entries should say the same; a heading that is missing from displayText hints at drift.
        if (directory.displayText() != null) {
            String display = TextSimilarity.normalize(directory.displayText());
            for (ParsedExercise.Entry entry : directory.entries()) {
                if (entry.heading() != null && !display.contains(TextSimilarity.normalize(entry.heading()))) {
                    issues.add(warning("DISPLAY_TEXT_MISMATCH", p + "informationSource.displayText",
                            "The heading of entry '" + entry.id() + "' (\"" + entry.heading() + "\") does not appear in displayText — entries and displayText may disagree."));
                }
            }
        }
        // A source in which every entry is needed is a plain one-to-one list; real sources contain some unused information.
        Set<String> used = new LinkedHashSet<>();
        sourceIds.values().forEach(used::addAll);
        if (!directory.entries().isEmpty() && used.size() >= directory.entries().size()) {
            issues.add(warning("NO_UNUSED_ENTRIES", p + "informationSource.entries", "Every entry is the source of an answer; add some entries that no question needs."));
        }
        Set<String> seen = new LinkedHashSet<>();
        for (ParsedExercise.Entry entry : directory.entries()) {
            if (entry.heading() != null && !seen.add(TextSimilarity.normalize(entry.heading()))) {
                issues.add(warning("ENTRY_HEADING_DUPLICATE", p + "informationSource.entries", "Two entries share the heading \"" + entry.heading() + "\" — the answer may be ambiguous."));
            }
        }
    }

    private void warnQuestions(List<ParsedExercise.Question> questions, Map<String, Map<String, String>> explanations) {
        for (int i = 0; i < questions.size(); i++) {
            ParsedExercise.Question q = questions.get(i);
            String path = p + "questions[" + i + "]";
            if (q.question() != null && TextSimilarity.wordCount(q.question()) > LONG_SITUATION_WORDS) {
                issues.add(warning("SITUATION_LONG", path + ".situation", "Question " + (i + 1) + " has more than " + LONG_SITUATION_WORDS
                        + " words; the language level may be too difficult for A2–B1."));
            }
            Map<String, String> explanation = explanations.getOrDefault(q.id(), Map.of());
            if (explanation.get("de") == null) {
                issues.add(warning("EXPLANATION_MISSING", path + ".explanation", "Question " + (i + 1) + " has no German explanation."));
            } else if (explanation.get("en") == null || explanation.get("fa") == null) {
                issues.add(warning("EXPLANATION_TRANSLATION_MISSING", path + ".explanation", "Question " + (i + 1) + " has no English or Persian explanation."));
            }
            for (int j = i + 1; j < questions.size(); j++) {
                ParsedExercise.Question other = questions.get(j);
                if (q.question() != null && other.question() != null
                        && TextSimilarity.similarity(q.question(), other.question()) >= SIMILAR_SITUATION_THRESHOLD) {
                    issues.add(warning("QUESTION_SIMILAR", path + ".situation", "Questions " + (i + 1) + " and " + (j + 1) + " are very similar — the same scenario may be repeated."));
                }
            }
        }
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
                        "Content must be plain text — HTML/script was found in: \"" + (value.length() > 60 ? value.substring(0, 60) + "…" : value) + "\"."));
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
