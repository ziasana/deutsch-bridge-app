package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.Issue;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Authoritative structural + business-rule validation of an import file (the frontend only does fast
 * syntax checks). Reads the JSON tree into {@link ParsedExercise}s and collects issues: ERRORs block
 * import, WARNINGs are shown to the admin but do not.
 */
public class ExamContentValidator {

    public static final String ERROR = "ERROR";
    public static final String WARNING = "WARNING";

    public static final int MAX_EXERCISES_PER_FILE = 100;
    static final int MAX_FIELD_LENGTH = 5000;
    static final double SIMILAR_HEADING_THRESHOLD = 0.65;

    private static final Set<String> CONTENT_TYPES = Set.of("EXAM_EXERCISE", "EXAM_EXERCISE_BATCH");
    private static final Set<String> DIFFICULTIES = Set.of("EASY", "MEDIUM", "HARD");
    static final Set<String> IMAGE_TYPES = Set.of("PHOTO", "ILLUSTRATION", "LOGO", "ICON", "DECORATIVE", "NONE");
    static final Set<String> AD_LAYOUTS = Set.of("CLASSIC", "IMAGE_TOP", "IMAGE_SIDE", "COMPACT", "PROMO", "NOTICE");
    /** The answer sheet's "no advertisement fits". */
    public static final String NO_ADVERTISEMENT = "x";
    static final Set<String> QUESTION_TYPES = Set.of(
            "EXPLICIT_INFORMATION", "PARAPHRASE", "DETAIL_COMPREHENSION", "MAIN_IDEA", "LOGICAL_UNDERSTANDING", "REFERENCE");
    private static final Pattern EXTERNAL_ID = Pattern.compile("[A-Za-z0-9._-]{1,64}");

    /** File-level result: the header values plus the exercises that could be read. */
    public record FileResult(
            String schemaVersion,
            String contentType,
            String exam,
            String level,
            String section,
            String part,
            String promptVersion,
            List<ParsedExercise> exercises,
            Map<Integer, List<Issue>> exerciseIssues,
            List<Issue> fileIssues
    ) {
    }

    public FileResult validate(JsonNode root) {
        List<Issue> fileIssues = new ArrayList<>();
        Map<Integer, List<Issue>> exerciseIssues = new LinkedHashMap<>();
        List<ParsedExercise> exercises = new ArrayList<>();

        String schemaVersion = text(root, "schemaVersion");
        String contentType = text(root, "contentType");
        String promptVersion = text(root, "promptVersion");

        if (schemaVersion == null) {
            fileIssues.add(error("SCHEMA_VERSION_MISSING", "schemaVersion", "schemaVersion is required."));
        } else if (!ExamContentSpecs.SCHEMA_VERSION.equals(schemaVersion)) {
            fileIssues.add(error("SCHEMA_VERSION_UNSUPPORTED", "schemaVersion",
                    "Unsupported schemaVersion '" + schemaVersion + "'. Supported: " + ExamContentSpecs.SCHEMA_VERSION + "."));
        }
        if (contentType == null || !CONTENT_TYPES.contains(contentType)) {
            fileIssues.add(error("CONTENT_TYPE_INVALID", "contentType",
                    "contentType must be EXAM_EXERCISE or EXAM_EXERCISE_BATCH."));
            return new FileResult(schemaVersion, contentType, text(root, "exam"), text(root, "level"),
                    text(root, "section"), text(root, "part"), promptVersion, exercises, exerciseIssues, fileIssues);
        }

        List<JsonNode> nodes = new ArrayList<>();
        if ("EXAM_EXERCISE_BATCH".equals(contentType)) {
            JsonNode array = root.get("exercises");
            if (array == null || !array.isArray() || array.isEmpty()) {
                fileIssues.add(error("EXERCISES_MISSING", "exercises", "A batch must contain a non-empty 'exercises' array."));
            } else if (array.size() > MAX_EXERCISES_PER_FILE) {
                fileIssues.add(error("TOO_MANY_EXERCISES", "exercises",
                        "A file may contain at most " + MAX_EXERCISES_PER_FILE + " exercises (found " + array.size() + ")."));
            } else {
                array.forEach(nodes::add);
            }
        } else {
            nodes.add(root);
        }

        Set<String> seenExternalIds = new LinkedHashSet<>();
        for (int i = 0; i < nodes.size(); i++) {
            List<Issue> issues = new ArrayList<>();
            String prefix = "EXAM_EXERCISE_BATCH".equals(contentType) ? "exercises[" + i + "]." : "";
            ParsedExercise exercise = readExercise(i, root, nodes.get(i), prefix, issues, seenExternalIds);
            exercises.add(exercise);
            exerciseIssues.put(i, issues);
        }

        return new FileResult(schemaVersion, contentType, text(root, "exam"), text(root, "level"),
                text(root, "section"), text(root, "part"), promptVersion, exercises, exerciseIssues, fileIssues);
    }

    private ParsedExercise readExercise(int index, JsonNode root, JsonNode node, String p, List<Issue> issues,
                                         Set<String> seenExternalIds) {
        if (!node.isObject()) {
            issues.add(error("EXERCISE_NOT_OBJECT", p.isEmpty() ? "$" : p.substring(0, p.length() - 1), "Each exercise must be a JSON object."));
            return new ParsedExercise(index, null, null, null, null, List.of(), List.of(), Map.of());
        }

        ExamContentSpec spec = resolveSpec(root, node, p, issues);

        String externalId = text(node, "externalId");
        if (externalId != null) {
            if (!EXTERNAL_ID.matcher(externalId).matches()) {
                issues.add(error("EXTERNAL_ID_INVALID", p + "externalId",
                        "externalId may only contain letters, digits, '.', '_' and '-' (max 64 characters)."));
            } else if (!seenExternalIds.add(externalId)) {
                issues.add(error("EXTERNAL_ID_DUPLICATE_IN_FILE", p + "externalId",
                        "externalId '" + externalId + "' is used more than once in this file."));
            }
        }

        String title = text(node, "title");
        if (title == null) {
            issues.add(error("TITLE_MISSING", p + "title", "title must not be empty."));
        } else if (title.length() > 200) {
            issues.add(error("TITLE_TOO_LONG", p + "title", "title may be at most 200 characters."));
        }
        String instructions = text(node, "instructions");
        if (instructions == null) {
            issues.add(error("INSTRUCTIONS_MISSING", p + "instructions", "instructions must not be empty."));
        } else if (instructions.length() > MAX_FIELD_LENGTH) {
            issues.add(error("INSTRUCTIONS_TOO_LONG", p + "instructions", "instructions are too long."));
        }

        if (spec != null && spec.isSituationMatching()) {
            return readSituationExercise(index, spec, node, p, externalId, title, instructions, issues);
        }
        if (spec != null && spec.isMultipleChoice()) {
            return readReadingExercise(index, spec, node, p, externalId, title, instructions, issues);
        }

        List<ParsedExercise.Heading> headings = readHeadings(node, p, spec, issues);
        List<ParsedExercise.Text> texts = readTexts(node, p, spec, headings, issues);
        crossCheck(headings, texts, p, spec, issues);
        Map<String, Object> metadata = readMetadata(node.get("metadata"), p, issues);

        return new ParsedExercise(index, spec, externalId, title, instructions, headings, texts, metadata);
    }

    private ExamContentSpec resolveSpec(JsonNode root, JsonNode node, String p, List<Issue> issues) {
        String examToken = firstNonNull(text(node, "exam"), text(root, "exam"));
        String levelToken = firstNonNull(text(node, "level"), text(root, "level"));
        String sectionToken = firstNonNull(text(node, "section"), text(root, "section"));
        String partToken = firstNonNull(text(node, "part"), text(root, "part"));

        ExamType exam = ExamContentTokens.parseExam(examToken).orElse(null);
        LearningLevel level = ExamContentTokens.parseLevel(levelToken).orElse(null);
        ExamSection section = ExamContentTokens.parseSection(sectionToken).orElse(null);
        Integer part = ExamContentTokens.parsePart(partToken).orElse(null);

        if (exam == null) issues.add(error("EXAM_INVALID", p + "exam", "exam must be one of TELC, GOETHE, TESTDAF, DSH, OTHER (found: " + examToken + ")."));
        if (level == null) issues.add(error("LEVEL_INVALID", p + "level", "level must be one of A1, A2, B1, B2, C1, C2 (found: " + levelToken + ")."));
        if (section == null) issues.add(error("SECTION_INVALID", p + "section", "section is missing or unknown (found: " + sectionToken + ")."));
        if (part == null) issues.add(error("PART_INVALID", p + "part", "part must look like TEIL_1 (found: " + partToken + ")."));
        if (exam == null || level == null || section == null || part == null) return null;

        return ExamContentSpecs.find(exam, level, section, part).orElseGet(() -> {
            String supported = ExamContentSpecs.all().stream().map(ExamContentSpec::label).reduce((a, b) -> a + "; " + b).orElse("none");
            issues.add(error("SPEC_UNSUPPORTED", p + "part",
                    "No content specification is registered for " + exam.getValue() + " " + level.getValue() + " · "
                            + ExamContentTokens.sectionLabel(section) + " · Teil " + part + " yet. Supported: " + supported + "."));
            return null;
        });
    }

    private List<ParsedExercise.Heading> readHeadings(JsonNode node, String p, ExamContentSpec spec, List<Issue> issues) {
        List<ParsedExercise.Heading> headings = new ArrayList<>();
        JsonNode array = node.get("headings");
        if (array == null || !array.isArray()) {
            issues.add(error("HEADINGS_MISSING", p + "headings", "headings must be an array."));
            return headings;
        }
        Set<String> ids = new LinkedHashSet<>();
        Set<String> normalizedTexts = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode h = array.get(i);
            String path = p + "headings[" + i + "]";
            String id = text(h, "id");
            String headingText = text(h, "text");
            if (id == null) {
                issues.add(error("HEADING_ID_MISSING", path + ".id", "Heading " + (i + 1) + " has no id."));
            } else if (!ids.add(id)) {
                issues.add(error("HEADING_ID_DUPLICATE", path + ".id", "Heading id '" + id + "' is used more than once."));
            }
            if (headingText == null) {
                issues.add(error("HEADING_TEXT_EMPTY", path + ".text", "Heading '" + id + "' has empty text."));
            } else {
                if (headingText.length() > 300) {
                    issues.add(error("HEADING_TEXT_TOO_LONG", path + ".text", "Heading '" + id + "' is too long (max 300 characters)."));
                }
                if (TextSimilarity.wordCount(headingText) > 12) {
                    issues.add(warning("HEADING_LONG", path + ".text", "Heading '" + id + "' has more than 12 words; exam headings are normally short."));
                }
                if (!normalizedTexts.add(TextSimilarity.normalize(headingText))) {
                    issues.add(error("HEADING_TEXT_DUPLICATE", path + ".text", "Heading '" + id + "' has the same text as another heading."));
                }
            }
            headings.add(new ParsedExercise.Heading(id, headingText));
        }
        if (spec != null) {
            if (headings.size() != spec.headingCount()) {
                issues.add(error("HEADING_COUNT", p + "headings",
                        "Exactly " + spec.headingCount() + " headings are required (found " + headings.size() + ")."));
            }
            List<String> expected = spec.headingIds();
            if (!ids.equals(new LinkedHashSet<>(expected))) {
                List<String> missing = expected.stream().filter(id -> !ids.contains(id)).toList();
                List<String> unexpected = ids.stream().filter(id -> !expected.contains(id)).toList();
                issues.add(error("HEADING_IDS", p + "headings",
                        "Heading ids must be exactly " + String.join(", ", expected)
                                + (missing.isEmpty() ? "" : " — missing: " + String.join(", ", missing))
                                + (unexpected.isEmpty() ? "" : " — unexpected: " + String.join(", ", unexpected)) + "."));
            }
        }
        warnSimilarHeadings(headings, p, issues);
        return headings;
    }

    private void warnSimilarHeadings(List<ParsedExercise.Heading> headings, String p, List<Issue> issues) {
        for (int i = 0; i < headings.size(); i++) {
            for (int j = i + 1; j < headings.size(); j++) {
                String a = headings.get(i).text();
                String b = headings.get(j).text();
                if (a == null || b == null || TextSimilarity.normalize(a).equals(TextSimilarity.normalize(b))) continue;
                if (TextSimilarity.similarity(a, b) >= SIMILAR_HEADING_THRESHOLD) {
                    issues.add(warning("HEADING_SIMILAR", p + "headings",
                            "Similar headings detected: '" + a + "' and '" + b + "' — one may also fit the text of the other."));
                }
            }
        }
    }

    private List<ParsedExercise.Text> readTexts(JsonNode node, String p, ExamContentSpec spec,
                                                 List<ParsedExercise.Heading> headings, List<Issue> issues) {
        List<ParsedExercise.Text> texts = new ArrayList<>();
        JsonNode array = node.get("texts");
        if (array == null || !array.isArray()) {
            issues.add(error("TEXTS_MISSING", p + "texts", "texts must be an array."));
            return texts;
        }
        Set<String> ids = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode t = array.get(i);
            String path = p + "texts[" + i + "]";
            String id = text(t, "id");
            // 'content' is canonical; 'text' is accepted because the schema example in circulation used it.
            String content = firstNonNull(text(t, "content"), text(t, "text"));
            String correct = text(t, "correctHeadingId");
            if (id == null) {
                issues.add(error("TEXT_ID_MISSING", path + ".id", "Text " + (i + 1) + " has no id."));
            } else if (!ids.add(id)) {
                issues.add(error("TEXT_ID_DUPLICATE", path + ".id", "Text id '" + id + "' is used more than once."));
            }
            if (content == null) {
                issues.add(error("TEXT_EMPTY", path + ".content", "Text '" + id + "' has empty content."));
            } else {
                if (content.length() > MAX_FIELD_LENGTH) {
                    issues.add(error("TEXT_TOO_LONG", path + ".content", "Text '" + id + "' is too long (max " + MAX_FIELD_LENGTH + " characters)."));
                }
                if (spec != null) {
                    int words = TextSimilarity.wordCount(content);
                    if (words < spec.minWords() || words > spec.maxWords()) {
                        issues.add(warning("TEXT_LENGTH", path + ".content", "Text '" + id + "' has " + words + " words; the usual range is "
                                + spec.minWords() + "–" + spec.maxWords() + "."));
                    }
                }
            }
            if (correct == null) {
                issues.add(error("CORRECT_HEADING_MISSING", path + ".correctHeadingId", "Text '" + id + "' has no correctHeadingId."));
            }
            texts.add(new ParsedExercise.Text(id, content, correct));
        }
        if (spec != null) {
            if (texts.size() != spec.textCount()) {
                issues.add(error("TEXT_COUNT", p + "texts", "Exactly " + spec.textCount() + " texts are required (found " + texts.size() + ")."));
            }
            List<String> expected = spec.textIds();
            if (!ids.equals(new LinkedHashSet<>(expected))) {
                issues.add(error("TEXT_IDS", p + "texts", "Text ids must be exactly " + String.join(", ", expected) + "."));
            }
        }
        return texts;
    }

    private void crossCheck(List<ParsedExercise.Heading> headings, List<ParsedExercise.Text> texts, String p,
                             ExamContentSpec spec, List<Issue> issues) {
        Set<String> headingIds = new LinkedHashSet<>();
        headings.forEach(h -> {
            if (h.id() != null) headingIds.add(h.id());
        });
        Set<String> used = new LinkedHashSet<>();
        for (int i = 0; i < texts.size(); i++) {
            ParsedExercise.Text t = texts.get(i);
            if (t.correctHeadingId() == null) continue;
            String path = p + "texts[" + i + "].correctHeadingId";
            if (!headingIds.contains(t.correctHeadingId())) {
                issues.add(error("CORRECT_HEADING_UNKNOWN", path,
                        "Text '" + t.id() + "' refers to heading '" + t.correctHeadingId() + "', which does not exist."));
            } else if (!used.add(t.correctHeadingId())) {
                issues.add(error("CORRECT_HEADING_REUSED", path,
                        "Heading '" + t.correctHeadingId() + "' is the correct answer for more than one text; every answer must be unique."));
            }
        }
        if (spec != null && used.size() == spec.textCount() && headingIds.size() == spec.headingCount()
                && headingIds.size() - used.size() != spec.unusedHeadingCount()) {
            issues.add(error("UNUSED_HEADINGS", p + "headings", "Exactly " + spec.unusedHeadingCount() + " headings must stay unused."));
        }
        List<String> order = texts.stream().map(ParsedExercise.Text::correctHeadingId).toList();
        if (order.size() >= 3 && order.stream().noneMatch(java.util.Objects::isNull)) {
            boolean ascending = true;
            for (int i = 1; i < order.size(); i++) {
                if (order.get(i).length() != 1 || order.get(i - 1).length() != 1 || order.get(i).charAt(0) != order.get(i - 1).charAt(0) + 1) {
                    ascending = false;
                    break;
                }
            }
            if (ascending) {
                issues.add(warning("ANSWER_SEQUENCE_PREDICTABLE", p + "texts", "The correct headings run in alphabetical order (" + String.join(", ", order) + "); answers should look random."));
            }
        }
    }

    // ------------------------------------------------------------------ reading text + multiple choice

    private ParsedExercise readReadingExercise(int index, ExamContentSpec spec, JsonNode node, String p, String externalId,
                                               String title, String instructions, List<Issue> issues) {
        String readingText = readReadingText(node, p, spec, issues);
        List<ParsedExercise.Question> questions = readQuestions(node, p, spec, issues);
        warnAnswerPatterns(questions, p, issues);
        Map<String, Object> metadata = readMetadata(node.get("metadata"), p, issues);
        return new ParsedExercise(index, spec, externalId, title, instructions, List.of(), List.of(), metadata, readingText, questions);
    }

    /** The reading text is {@code "text": {"content": "..."}}; a plain string is accepted as well. */
    private String readReadingText(JsonNode node, String p, ExamContentSpec spec, List<Issue> issues) {
        JsonNode textNode = node.get("text");
        String content = textNode == null || textNode.isNull() ? null
                : textNode.isObject() ? text(textNode, "content") : text(node, "text");
        if (content == null) {
            issues.add(error("READING_TEXT_MISSING", p + "text.content", "The exercise needs exactly one reading text in text.content."));
            return null;
        }
        if (content.length() > MAX_FIELD_LENGTH * 2) {
            issues.add(error("READING_TEXT_TOO_LONG", p + "text.content", "The reading text is too long (max " + MAX_FIELD_LENGTH * 2 + " characters)."));
        }
        int words = TextSimilarity.wordCount(content);
        if (words < spec.minWords() || words > spec.maxWords()) {
            issues.add(warning("TEXT_LENGTH", p + "text.content", "The reading text has " + words + " words; the usual range is "
                    + spec.minWords() + "–" + spec.maxWords() + "."));
        }
        return content;
    }

    private List<ParsedExercise.Question> readQuestions(JsonNode node, String p, ExamContentSpec spec, List<Issue> issues) {
        List<ParsedExercise.Question> questions = new ArrayList<>();
        JsonNode array = node.get("questions");
        if (array == null || !array.isArray()) {
            issues.add(error("QUESTIONS_MISSING", p + "questions", "questions must be an array."));
            return questions;
        }
        Set<String> ids = new LinkedHashSet<>();
        Set<Integer> numbers = new LinkedHashSet<>();
        Set<String> normalizedQuestions = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode q = array.get(i);
            String path = p + "questions[" + i + "]";
            String id = text(q, "id");
            if (id == null) {
                issues.add(error("QUESTION_ID_MISSING", path + ".id", "Question " + (i + 1) + " has no id."));
            } else if (!ids.add(id)) {
                issues.add(error("QUESTION_ID_DUPLICATE", path + ".id", "Question id '" + id + "' is used more than once."));
            }

            Integer number = null;
            JsonNode numberNode = q == null ? null : q.get("number");
            if (numberNode != null && numberNode.isIntegralNumber()) {
                number = numberNode.asInt();
                if (!numbers.add(number)) {
                    issues.add(error("QUESTION_NUMBER_DUPLICATE", path + ".number", "Question number " + number + " is used more than once."));
                }
            } else if (numberNode != null && !numberNode.isNull()) {
                issues.add(error("QUESTION_NUMBER_INVALID", path + ".number", "number must be a whole number (e.g. " + spec.firstQuestionNumber() + ")."));
            }

            String questionText = text(q, "question");
            if (questionText == null) {
                issues.add(error("QUESTION_TEXT_EMPTY", path + ".question", "Question " + (i + 1) + " has no question text."));
            } else {
                if (questionText.length() > 500) {
                    issues.add(error("QUESTION_TEXT_TOO_LONG", path + ".question", "Question " + (i + 1) + " is too long (max 500 characters)."));
                }
                if (!normalizedQuestions.add(TextSimilarity.normalize(questionText))) {
                    issues.add(error("QUESTION_TEXT_DUPLICATE", path + ".question", "Question " + (i + 1) + " repeats another question."));
                }
            }

            List<ParsedExercise.Option> options = readOptions(q, path, spec, issues);
            String correct = text(q, "correctOptionId");
            if (correct == null) {
                issues.add(error("CORRECT_OPTION_MISSING", path + ".correctOptionId", "Question " + (i + 1) + " has no correctOptionId."));
            } else if (options.stream().noneMatch(o -> correct.equals(o.id()))) {
                issues.add(error("CORRECT_OPTION_UNKNOWN", path + ".correctOptionId",
                        "Question " + (i + 1) + " refers to option '" + correct + "', which does not exist."));
            }

            String type = text(q, "questionType");
            if (type == null) {
                issues.add(warning("QUESTION_TYPE_MISSING", path + ".questionType", "Question " + (i + 1) + " has no questionType."));
            } else if (!QUESTION_TYPES.contains(type.toUpperCase())) {
                issues.add(warning("QUESTION_TYPE_UNKNOWN", path + ".questionType",
                        "Unknown questionType '" + type + "' (use " + String.join(", ", QUESTION_TYPES) + "); ignored."));
                type = null;
            }
            questions.add(new ParsedExercise.Question(id, number, questionText, options, correct, type == null ? null : type.toUpperCase()));
        }

        if (questions.size() != spec.questionCount()) {
            issues.add(error("QUESTION_COUNT", p + "questions", "Exactly " + spec.questionCount() + " questions are required (found " + questions.size() + ")."));
        }
        if (!numbers.isEmpty() && numbers.size() == questions.size()) {
            List<Integer> sorted = numbers.stream().sorted().toList();
            boolean expected = sorted.size() == spec.questionCount() && sorted.get(0) == spec.firstQuestionNumber()
                    && sorted.get(sorted.size() - 1) == spec.lastQuestionNumber();
            if (!expected) {
                issues.add(warning("QUESTION_NUMBERS", p + "questions", "Question numbers are usually " + spec.firstQuestionNumber()
                        + " to " + spec.lastQuestionNumber() + " (found " + sorted.get(0) + " to " + sorted.get(sorted.size() - 1) + ")."));
            }
        }
        return questions;
    }

    private List<ParsedExercise.Option> readOptions(JsonNode question, String path, ExamContentSpec spec, List<Issue> issues) {
        List<ParsedExercise.Option> options = new ArrayList<>();
        JsonNode array = question == null ? null : question.get("options");
        if (array == null || !array.isArray()) {
            issues.add(error("OPTIONS_MISSING", path + ".options", "options must be an array."));
            return options;
        }
        Set<String> ids = new LinkedHashSet<>();
        Set<String> normalized = new LinkedHashSet<>();
        for (int j = 0; j < array.size(); j++) {
            JsonNode o = array.get(j);
            String optionPath = path + ".options[" + j + "]";
            String id = text(o, "id");
            String optionText = text(o, "text");
            if (id == null) {
                issues.add(error("OPTION_ID_MISSING", optionPath + ".id", "Option " + (j + 1) + " has no id."));
            } else if (!ids.add(id)) {
                issues.add(error("OPTION_ID_DUPLICATE", optionPath + ".id", "Option id '" + id + "' is used more than once."));
            }
            if (optionText == null) {
                issues.add(error("OPTION_TEXT_EMPTY", optionPath + ".text", "Option '" + id + "' has empty text."));
            } else {
                if (optionText.length() > 300) {
                    issues.add(error("OPTION_TEXT_TOO_LONG", optionPath + ".text", "Option '" + id + "' is too long (max 300 characters)."));
                }
                if (!normalized.add(TextSimilarity.normalize(optionText))) {
                    issues.add(error("OPTION_TEXT_DUPLICATE", optionPath + ".text", "Option '" + id + "' has the same text as another option."));
                }
            }
            options.add(new ParsedExercise.Option(id, optionText));
        }
        List<String> expected = spec.optionIds();
        if (options.size() != spec.optionCount()) {
            issues.add(error("OPTION_COUNT", path + ".options", "Exactly " + spec.optionCount() + " options are required (found " + options.size() + ")."));
        } else if (!ids.equals(new LinkedHashSet<>(expected))) {
            issues.add(error("OPTION_IDS", path + ".options", "Option ids must be exactly " + String.join(", ", expected) + "."));
        }
        return options;
    }

    /** Quality hints that never block an import: a predictable answer key or an answer that is always the longest. */
    private void warnAnswerPatterns(List<ParsedExercise.Question> questions, String p, List<Issue> issues) {
        List<String> keys = questions.stream().map(ParsedExercise.Question::correctOptionId).toList();
        if (keys.size() >= 3 && keys.stream().noneMatch(java.util.Objects::isNull) && new LinkedHashSet<>(keys).size() == 1) {
            issues.add(warning("ANSWER_POSITIONS_SAME", p + "questions", "Every correct answer is option '" + keys.get(0) + "'; answer positions should vary."));
        }
        int longest = 0;
        int counted = 0;
        for (ParsedExercise.Question q : questions) {
            if (q.correctOptionId() == null || q.options().size() < 2 || q.options().stream().anyMatch(o -> o.text() == null)) continue;
            counted++;
            int max = q.options().stream().mapToInt(o -> o.text().length()).max().orElse(0);
            boolean correctIsLongest = q.options().stream().anyMatch(o -> q.correctOptionId().equals(o.id()) && o.text().length() == max)
                    && q.options().stream().filter(o -> o.text().length() == max).count() == 1;
            if (correctIsLongest) longest++;
        }
        if (counted >= 4 && longest >= counted - 1) {
            issues.add(warning("CORRECT_ANSWER_LONGEST", p + "questions", "The correct answer is the longest option in " + longest + " of " + counted
                    + " questions; answer length should not give the solution away."));
        }
    }

    // ------------------------------------------------------------------ situations + advertisements

    private static final com.fasterxml.jackson.databind.ObjectMapper TREE = new com.fasterxml.jackson.databind.ObjectMapper();

    private ParsedExercise readSituationExercise(int index, ExamContentSpec spec, JsonNode node, String p, String externalId,
                                                 String title, String instructions, List<Issue> issues) {
        List<ParsedExercise.Advertisement> ads = readAdvertisements(node, p, spec, issues);
        List<ParsedExercise.Situation> situations = readSituations(node, p, spec, issues);
        checkSituationAnswers(situations, ads, p, spec, issues);
        Map<String, Object> metadata = readMetadata(node.get("metadata"), p, issues);
        return new ParsedExercise(index, spec, externalId, title, instructions, List.of(), List.of(), metadata,
                null, List.of(), situations, ads);
    }

    private List<ParsedExercise.Situation> readSituations(JsonNode node, String p, ExamContentSpec spec, List<Issue> issues) {
        List<ParsedExercise.Situation> situations = new ArrayList<>();
        JsonNode array = node.get("situations");
        if (array == null || !array.isArray()) {
            issues.add(error("SITUATIONS_MISSING", p + "situations", "situations must be an array."));
            return situations;
        }
        Set<String> ids = new LinkedHashSet<>();
        Set<Integer> numbers = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode s = array.get(i);
            String path = p + "situations[" + i + "]";
            String id = text(s, "id");
            if (id == null) {
                issues.add(error("SITUATION_ID_MISSING", path + ".id", "Situation " + (i + 1) + " has no id."));
            } else if (!ids.add(id)) {
                issues.add(error("SITUATION_ID_DUPLICATE", path + ".id", "Situation id '" + id + "' is used more than once."));
            }
            Integer number = null;
            JsonNode numberNode = s == null ? null : s.get("number");
            if (numberNode != null && numberNode.isIntegralNumber()) {
                number = numberNode.asInt();
                if (!numbers.add(number)) {
                    issues.add(error("SITUATION_NUMBER_DUPLICATE", path + ".number", "Situation number " + number + " is used more than once."));
                }
            } else {
                issues.add(error("SITUATION_NUMBER_INVALID", path + ".number", "Situation " + (i + 1) + " needs a whole-number 'number' ("
                        + spec.firstQuestionNumber() + "–" + spec.lastQuestionNumber() + ")."));
            }
            String situationText = text(s, "text");
            if (situationText == null) {
                issues.add(error("SITUATION_TEXT_EMPTY", path + ".text", "Situation " + (number != null ? number : i + 1) + " has no text."));
            } else if (situationText.length() > 1000) {
                issues.add(error("SITUATION_TEXT_TOO_LONG", path + ".text", "Situation " + (number != null ? number : i + 1) + " is too long (max 1000 characters)."));
            }
            String answer = text(s, "correctAdvertisementId");
            if (answer == null) {
                issues.add(error("SITUATION_ANSWER_MISSING", path + ".correctAdvertisementId",
                        "Situation " + (number != null ? number : i + 1) + " has no correctAdvertisementId (a–l or x)."));
            } else {
                answer = answer.toLowerCase(java.util.Locale.ROOT);
                if (!spec.optionIds().contains(answer) && !NO_ADVERTISEMENT.equals(answer)) {
                    issues.add(error("SITUATION_ANSWER_INVALID", path + ".correctAdvertisementId",
                            "Situation " + (number != null ? number : i + 1) + " has invalid correctAdvertisementId \"" + answer + "\" (use a–"
                                    + spec.optionIds().get(spec.optionIds().size() - 1) + " or x)."));
                }
            }
            situations.add(new ParsedExercise.Situation(id, number, situationText, answer, objectMap(s == null ? null : s.get("matchingProfile"))));
        }
        if (situations.size() != spec.situationCount()) {
            issues.add(error("SITUATION_COUNT", p + "situations", "Expected " + spec.situationCount() + " situations. Found " + situations.size() + "."));
        }
        List<Integer> expected = java.util.stream.IntStream.rangeClosed(spec.firstQuestionNumber(), spec.lastQuestionNumber()).boxed().toList();
        if (!numbers.isEmpty() && !numbers.equals(new LinkedHashSet<>(expected))) {
            issues.add(error("SITUATION_NUMBERS", p + "situations", "Situation numbers must be exactly "
                    + spec.firstQuestionNumber() + "–" + spec.lastQuestionNumber() + " (found: "
                    + numbers.stream().sorted().map(String::valueOf).reduce((a, b) -> a + ", " + b).orElse("") + ")."));
        }
        return situations;
    }

    private List<ParsedExercise.Advertisement> readAdvertisements(JsonNode node, String p, ExamContentSpec spec, List<Issue> issues) {
        List<ParsedExercise.Advertisement> ads = new ArrayList<>();
        JsonNode array = node.get("advertisements");
        if (array == null || !array.isArray()) {
            issues.add(error("ADVERTISEMENTS_MISSING", p + "advertisements", "advertisements must be an array."));
            return ads;
        }
        Set<String> ids = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode a = array.get(i);
            String path = p + "advertisements[" + i + "]";
            String id = text(a, "id");
            if (id == null) {
                issues.add(error("AD_ID_MISSING", path + ".id", "Advertisement " + (i + 1) + " has no id."));
            } else {
                id = id.toLowerCase(java.util.Locale.ROOT);
                if (!ids.add(id)) issues.add(error("AD_ID_DUPLICATE", path + ".id", "Advertisement id '" + id + "' is used more than once."));
            }
            String type = text(a, "type");
            String layout = text(a, "layout");
            if (layout != null) {
                layout = layout.toUpperCase(java.util.Locale.ROOT);
                if (!AD_LAYOUTS.contains(layout)) {
                    issues.add(warning("AD_LAYOUT_UNKNOWN", path + ".layout", "Unknown layout '" + layout + "' (use " + String.join(", ", AD_LAYOUTS) + "); CLASSIC is used."));
                    layout = null;
                }
            }

            Map<String, Object> content = readAdContent(a, path, id, issues);
            Map<String, Object> visual = readAdVisual(a, path, id, issues);
            ads.add(new ParsedExercise.Advertisement(id, type, layout, content, visual, objectMap(a == null ? null : a.get("matchingProfile"))));
        }
        if (ads.size() != spec.advertisementCount()) {
            issues.add(error("AD_COUNT", p + "advertisements", "Expected " + spec.advertisementCount() + " advertisements. Found " + ads.size() + "."));
        }
        if (!ids.isEmpty() && !ids.equals(new LinkedHashSet<>(spec.optionIds()))) {
            issues.add(error("AD_IDS", p + "advertisements", "Advertisement ids must be exactly " + String.join(", ", spec.optionIds()) + "."));
        }
        return ads;
    }

    private Map<String, Object> readAdContent(JsonNode ad, String path, String id, List<Issue> issues) {
        JsonNode content = ad == null ? null : ad.get("content");
        if (content == null || !content.isObject()) {
            issues.add(error("AD_CONTENT_MISSING", path + ".content", "Advertisement '" + id + "' needs a content object (headline, description, details ...)."));
            return Map.of();
        }
        Map<String, Object> map = objectMap(content);
        boolean hasText = map.values().stream().anyMatch(v -> v instanceof String s && !s.isBlank()
                || v instanceof List<?> l && !l.isEmpty() || v instanceof Map<?, ?> m && !m.isEmpty());
        if (!hasText) {
            issues.add(error("AD_CONTENT_EMPTY", path + ".content", "Advertisement '" + id + "' has no content."));
        }
        JsonNode details = content.get("details");
        if (details != null && !details.isNull() && (!details.isArray() || java.util.stream.StreamSupport.stream(details.spliterator(), false).anyMatch(d -> !d.isTextual()))) {
            issues.add(error("AD_DETAILS_INVALID", path + ".content.details", "details of advertisement '" + id + "' must be an array of strings."));
        }
        JsonNode contact = content.get("contact");
        if (contact != null && !contact.isNull() && !contact.isObject()) {
            issues.add(error("AD_CONTACT_INVALID", path + ".content.contact", "contact of advertisement '" + id + "' must be an object."));
        }
        if (map.toString().length() > MAX_FIELD_LENGTH) {
            issues.add(error("AD_CONTENT_TOO_LONG", path + ".content", "Advertisement '" + id + "' is too long."));
        }
        return map;
    }

    private Map<String, Object> readAdVisual(JsonNode ad, String path, String id, List<Issue> issues) {
        JsonNode visual = ad == null ? null : ad.get("visual");
        if (visual == null || visual.isNull()) return Map.of();
        if (!visual.isObject()) {
            issues.add(error("AD_VISUAL_INVALID", path + ".visual", "visual of advertisement '" + id + "' must be an object."));
            return Map.of();
        }
        Map<String, Object> map = objectMap(visual);
        String imageType = text(visual, "imageType");
        if (imageType != null) {
            imageType = imageType.toUpperCase(java.util.Locale.ROOT);
            if (!IMAGE_TYPES.contains(imageType)) {
                issues.add(error("AD_IMAGE_TYPE_INVALID", path + ".visual.imageType", "Unknown imageType '" + imageType + "' (use " + String.join(", ", IMAGE_TYPES) + ")."));
            } else {
                map.put("imageType", imageType);
            }
        }
        boolean hasImage = visual.path("hasImage").asBoolean(false);
        if (hasImage && text(visual, "altText") == null) {
            issues.add(error("AD_ALT_TEXT_MISSING", path + ".visual.altText", "Advertisement '" + id + "' has an image, so visual.altText is required."));
        }
        if (hasImage && "NONE".equals(imageType)) {
            issues.add(warning("AD_IMAGE_TYPE_CONFLICT", path + ".visual", "Advertisement '" + id + "' has hasImage=true but imageType NONE."));
        }
        return map;
    }

    /** One-use rule, x handling and the (non-blocking) ambiguity hints derived from the matching profiles. */
    private void checkSituationAnswers(List<ParsedExercise.Situation> situations, List<ParsedExercise.Advertisement> ads,
                                       String p, ExamContentSpec spec, List<Issue> issues) {
        Map<String, List<Integer>> usedBy = new LinkedHashMap<>();
        int none = 0;
        for (ParsedExercise.Situation s : situations) {
            if (s.correctAdvertisementId() == null) continue;
            if (NO_ADVERTISEMENT.equals(s.correctAdvertisementId())) {
                none++;
            } else if (spec.optionIds().contains(s.correctAdvertisementId())) {
                usedBy.computeIfAbsent(s.correctAdvertisementId(), k -> new ArrayList<>()).add(s.number());
            }
        }
        usedBy.forEach((adId, numbers) -> {
            if (numbers.size() > 1) {
                issues.add(error("AD_REUSED", p + "situations", "Advertisement \"" + adId + "\" is used twice: situations "
                        + numbers.stream().map(String::valueOf).reduce((a, b) -> a + " and " + b).orElse("") + ". Every advertisement may be used once."));
            }
        });
        if (none > 3) {
            issues.add(warning("TOO_MANY_NO_MATCH", p + "situations", none + " situations have the answer x; real exercises normally have one or two."));
        }

        for (ParsedExercise.Situation s : situations) {
            String need = s.matchingProfile() == null ? null : string(s.matchingProfile().get("primaryNeed"));
            if (need == null || s.correctAdvertisementId() == null) continue;
            List<String> requirements = stringList(s.matchingProfile().get("requirements"));
            for (ParsedExercise.Advertisement ad : ads) {
                if (ad.id() == null || ad.id().equals(s.correctAdvertisementId())) continue;
                if (profileFits(ad, need, requirements)) {
                    issues.add(warning("SITUATION_AMBIGUOUS", p + "situations",
                            "Situation " + s.number() + " may also match advertisement " + ad.id() + " (same service and all required features)."));
                }
            }
            if (NO_ADVERTISEMENT.equals(s.correctAdvertisementId())) continue;
            ads.stream().filter(a -> s.correctAdvertisementId().equals(a.id())).findFirst().ifPresent(ad -> {
                if (!ad.matchingProfile().isEmpty() && !profileFits(ad, need, requirements)) {
                    issues.add(warning("SITUATION_PROFILE_MISMATCH", p + "situations",
                            "Situation " + s.number() + " is assigned to advertisement " + ad.id() + ", but its matching profile does not cover the situation's need."));
                }
            });
        }
    }

    private static boolean profileFits(ParsedExercise.Advertisement ad, String need, List<String> requirements) {
        Map<String, Object> profile = ad.matchingProfile();
        if (profile == null || profile.isEmpty()) return false;
        if (!need.equalsIgnoreCase(string(profile.get("primaryService")) == null ? "" : string(profile.get("primaryService")))) return false;
        List<String> features = stringList(profile.get("features")).stream().map(f -> f.toUpperCase(java.util.Locale.ROOT)).toList();
        return requirements.stream().allMatch(r -> features.contains(r.toUpperCase(java.util.Locale.ROOT)));
    }

    private static Map<String, Object> objectMap(JsonNode node) {
        if (node == null || !node.isObject()) return new LinkedHashMap<>();
        return TREE.convertValue(node, new com.fasterxml.jackson.core.type.TypeReference<LinkedHashMap<String, Object>>() {
        });
    }

    private static String string(Object value) {
        if (value == null) return null;
        String s = value.toString().strip();
        return s.isEmpty() ? null : s;
    }

    private static List<String> stringList(Object value) {
        if (!(value instanceof List<?> list)) return List.of();
        return list.stream().map(ExamContentValidator::string).filter(java.util.Objects::nonNull).toList();
    }

    private Map<String, Object> readMetadata(JsonNode node, String p, List<Issue> issues) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        if (node == null || node.isNull()) {
            issues.add(warning("METADATA_MISSING", p + "metadata", "No metadata (difficulty, topics ...) given."));
            return metadata;
        }
        if (!node.isObject()) {
            issues.add(error("METADATA_INVALID", p + "metadata", "metadata must be an object."));
            return metadata;
        }
        String difficulty = text(node, "difficulty");
        if (difficulty != null) {
            // The reading-comprehension prompt family says DIFFICULT; the app's scale says HARD.
            if (difficulty.equalsIgnoreCase("DIFFICULT")) difficulty = "HARD";
            if (DIFFICULTIES.contains(difficulty.toUpperCase())) {
                metadata.put("difficulty", difficulty.toUpperCase());
            } else {
                issues.add(warning("DIFFICULTY_UNKNOWN", p + "metadata.difficulty", "Unknown difficulty '" + difficulty + "' (use EASY, MEDIUM or HARD); ignored."));
            }
        }
        putStringList(node, "topics", metadata);
        putStringList(node, "skills", metadata);
        String source = text(node, "source");
        if (source != null) metadata.put("source", source);
        String author = text(node, "author");
        if (author != null) metadata.put("author", author);
        return metadata;
    }

    private void putStringList(JsonNode node, String field, Map<String, Object> target) {
        JsonNode array = node.get(field);
        if (array == null || !array.isArray()) return;
        List<String> values = new ArrayList<>();
        array.forEach(v -> {
            if (v.isTextual() && !v.asText().isBlank() && values.size() < 20) values.add(v.asText().trim());
        });
        if (!values.isEmpty()) target.put(field, values);
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.isObject()) return null;
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) return null;
        String s = value.isTextual() ? value.asText() : value.isValueNode() ? value.asText() : null;
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String firstNonNull(String a, String b) {
        return a != null ? a : b;
    }

    static Issue error(String code, String path, String message) {
        return new Issue(ERROR, code, path, message);
    }

    static Issue warning(String code, String path, String message) {
        return new Issue(WARNING, code, path, message);
    }
}
