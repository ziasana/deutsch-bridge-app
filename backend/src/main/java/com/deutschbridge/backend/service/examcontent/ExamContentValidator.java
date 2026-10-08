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
    static final Set<String> GAP_CATEGORIES = Set.of(
            "KONJUNKTION", "ADVERBIEN_KONNEKTOREN", "ARTIKEL", "KASUS", "PRAEPOSITION", "VERBFORM", "ADJEKTIVENDUNG",
            "PERSONALPRONOMEN", "RELATIVPRONOMEN", "POSSESSIVARTIKEL", "VERB_PRAEPOSITION", "SATZSTRUKTUR");
    /** Function words that mean (almost) the same - two of them in one word bank invite a second valid answer. */
    private static final List<Set<String>> SYNONYM_GROUPS = List.of(
            Set.of("DESHALB", "DARUM", "DAHER", "DESWEGEN"),
            Set.of("TROTZDEM", "DENNOCH", "TROTZ"),
            Set.of("WEIL", "DA"),
            Set.of("AUSSERDEM", "ZUDEM"));
    static final Set<String> TEXT_TYPES = Set.of("EMAIL", "NACHRICHT", "BRIEF", "PERSOENLICHER_BERICHT", "INFORMATIONSTEXT");
    private static final Pattern GAP_MARKER = Pattern.compile("\\[(\\d{1,3})]");
    static final Set<String> QUESTION_TYPES = Set.of(
            "EXPLICIT_INFORMATION", "PARAPHRASE", "DETAIL_COMPREHENSION", "MAIN_IDEA", "LOGICAL_UNDERSTANDING", "REFERENCE");
    static final Set<String> SCENARIO_TYPES = Set.of("STANDARD_EMAIL", "ALTERNATIVE_EMAIL");
    static final Set<String> COMMUNICATION_TYPES = Set.of("INFORMAL_EMAIL", "SEMI_FORMAL_EMAIL", "FORMAL_EMAIL");
    static final Set<String> RELATIONSHIPS = Set.of("FRIEND", "FAMILY", "ACQUAINTANCE", "COURSE_COLLEAGUE", "COLLEAGUE", "ORGANIZATION");
    static final int WRITING_EMAIL_WARN_MIN = 100;
    static final int WRITING_EMAIL_WARN_MAX = 150;
    static final double POINT_OVERLAP_THRESHOLD = 0.5;
    /** Imported text is plain text; anything that looks like markup or script is rejected rather than sanitised. */
    private static final Pattern MARKUP = Pattern.compile("<\\s*/?\\s*[a-zA-Z!]|javascript:", Pattern.CASE_INSENSITIVE);
    private static final Pattern FORMAL_PRONOUN = Pattern.compile("\\bIhnen\\b");
    private static final Pattern INFORMAL_PRONOUN = Pattern.compile("\\b(du|dir|dich|dein|deine|deinen|deinem|deiner|euch|euer|eure)\\b");
    private static final Pattern INFORMAL_GREETING = Pattern.compile("^(Liebe[rn]?|Hallo|Hi|Hey|Lieber|Servus|Moin)\\b.*", Pattern.DOTALL);
    private static final Pattern FORMAL_GREETING = Pattern.compile("^(Sehr geehrte[r]?|Guten (Tag|Morgen|Abend)|Liebe[r]? (Frau|Herr)).*", Pattern.DOTALL);
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
        if (instructions == null && node.get("instructions") != null && node.get("instructions").isObject()) {
            instructions = text(node.get("instructions"), "de");
        }
        if (instructions == null) {
            issues.add(error("INSTRUCTIONS_MISSING", p + "instructions", "instructions must not be empty."));
        } else if (instructions.length() > MAX_FIELD_LENGTH) {
            issues.add(error("INSTRUCTIONS_TOO_LONG", p + "instructions", "instructions are too long."));
        }

        if (spec != null && spec.isSituationMatching()) {
            return readSituationExercise(index, spec, node, p, externalId, title, instructions, issues);
        }
        if (spec != null && spec.isWriting()) {
            return readWritingExercise(index, spec, node, p, externalId, title, instructions, issues);
        }
        if (spec != null && spec.isWordBank()) {
            return readWordBankExercise(index, spec, node, p, externalId, title, instructions, issues);
        }
        if (spec != null && spec.isGapText()) {
            return readGapExercise(index, spec, node, p, externalId, title, instructions, issues);
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

    // ------------------------------------------------------------------ Sprachbausteine Teil 2 (word bank)

    // ------------------------------------------------------------------ Schriftlicher Ausdruck

    private ParsedExercise readWritingExercise(int index, ExamContentSpec spec, JsonNode node, String p, String externalId,
                                               String title, String instructions, List<Issue> issues) {
        String taskType = readEnum(node, "taskType", Set.of("EMAIL_RESPONSE"), p, "TASK_TYPE_INVALID", issues);
        String scenarioType = readEnum(node, "scenarioType", SCENARIO_TYPES, p, "SCENARIO_TYPE_INVALID", issues);
        String communicationType = readEnum(node, "communicationType", COMMUNICATION_TYPES, p, "COMMUNICATION_TYPE_INVALID", issues);
        String relationship = readEnum(node, "relationship", RELATIONSHIPS, p, "RELATIONSHIP_INVALID", issues);
        String topic = text(node, "topic");
        if (topic == null) {
            issues.add(error("TOPIC_MISSING", p + "topic", "topic must not be empty (e.g. \"Reise und Besuch\")."));
        } else if (topic.length() > 200) {
            issues.add(error("TOPIC_TOO_LONG", p + "topic", "topic may be at most 200 characters."));
        }

        JsonNode task = node.get("task");
        String situation = task == null ? null : text(task, "situation");
        if (situation == null) {
            issues.add(error("SITUATION_MISSING", p + "task.situation", "task.situation must not be empty (a short introduction such as \"Sie haben von einer Freundin folgende E-Mail erhalten:\")."));
        } else if (situation.length() > 500) {
            issues.add(error("SITUATION_TOO_LONG", p + "task.situation", "task.situation may be at most 500 characters."));
        }
        JsonNode message = task == null ? null : task.get("incomingMessage");
        String greeting = null;
        String body = null;
        String closing = null;
        String sender = null;
        if (message == null || !message.isObject()) {
            issues.add(error("EMAIL_MISSING", p + "task.incomingMessage", "task.incomingMessage (greeting, body, closing, sender) is required."));
        } else {
            greeting = readEmailPart(message, "greeting", 200, p, issues);
            body = readEmailPart(message, "body", MAX_FIELD_LENGTH, p, issues);
            closing = readEmailPart(message, "closing", 200, p, issues);
            sender = readEmailPart(message, "sender", 200, p, issues);
        }

        List<String> points = readWritingPoints(node, spec, p, issues);

        String guidance = text(node, "writingGuidance");
        if (guidance == null && node.get("writingGuidance") != null && node.get("writingGuidance").isObject()) {
            guidance = text(node.get("writingGuidance"), "de");
        }
        if (guidance == null) guidance = ExamContentSpecs.WRITING_GUIDANCE;
        if (guidance.length() > 1000) issues.add(error("GUIDANCE_TOO_LONG", p + "writingGuidance", "writingGuidance is too long."));

        String modelSubject = null;
        String modelBody = null;
        JsonNode model = node.get("modelAnswer");
        if (model != null && model.isObject()) {
            modelSubject = text(model, "subject");
            modelBody = text(model, "body");
            if (modelBody == null) issues.add(error("MODEL_ANSWER_INVALID", p + "modelAnswer.body", "modelAnswer needs a body (or remove modelAnswer)."));
        } else if (model != null && !model.isNull()) {
            issues.add(error("MODEL_ANSWER_INVALID", p + "modelAnswer", "modelAnswer must be an object with subject and body."));
        }

        Map<String, Object> metadata = readMetadata(node.get("metadata"), p, issues);
        if (node.get("metadata") != null && node.get("metadata").isObject()) putStringList(node.get("metadata"), "tags", metadata);

        checkWritingConsistency(spec, communicationType, relationship, greeting, body, instructions, guidance, p, issues);
        if (body != null) checkEmailBody(body, p, issues);
        warnPoints(points, p, issues);
        List<String> plainTextFields = new ArrayList<>(java.util.Arrays.asList(title, instructions, topic, situation, greeting, body,
                closing, sender, guidance, modelSubject, modelBody));
        plainTextFields.addAll(points);
        rejectMarkup(p, issues, plainTextFields);

        ParsedExercise.Writing writing = new ParsedExercise.Writing(taskType, scenarioType, topic, communicationType, relationship,
                situation, greeting, body, closing, sender, points, guidance, modelSubject, modelBody);
        return new ParsedExercise(index, spec, externalId, title, instructions, List.of(), List.of(), metadata, null, List.of(),
                List.of(), List.of(), List.of(), null, writing);
    }

    private String readEnum(JsonNode node, String field, Set<String> allowed, String p, String code, List<Issue> issues) {
        String value = text(node, field);
        String normalized = value == null ? null : value.toUpperCase(java.util.Locale.ROOT);
        if (normalized == null || !allowed.contains(normalized)) {
            String hint = "RANDOM".equals(normalized) ? " RANDOM is only a generator option - the task itself must state the concrete scenario." : "";
            issues.add(error(code, p + field, field + " must be one of " + String.join(", ", new java.util.TreeSet<>(allowed))
                    + " (found: " + value + ")." + hint));
            return null;
        }
        return normalized;
    }

    private String readEmailPart(JsonNode message, String field, int maxLength, String p, List<Issue> issues) {
        String value = text(message, field);
        String path = p + "task.incomingMessage." + field;
        if (value == null) {
            issues.add(error("EMAIL_" + field.toUpperCase(java.util.Locale.ROOT) + "_MISSING", path, "The incoming email needs a " + field + "."));
        } else if (value.length() > maxLength) {
            issues.add(error("EMAIL_" + field.toUpperCase(java.util.Locale.ROOT) + "_TOO_LONG", path, "The email " + field + " is too long (max " + maxLength + " characters)."));
        }
        return value;
    }

    /** Exactly four distinct points numbered 1-4; returned in number order. */
    private List<String> readWritingPoints(JsonNode node, ExamContentSpec spec, String p, List<Issue> issues) {
        JsonNode array = node.get("points");
        if (array == null || !array.isArray()) {
            issues.add(error("POINTS_MISSING", p + "points", "points must be an array of exactly " + spec.questionCount() + " content points."));
            return List.of();
        }
        Map<Integer, String> byNumber = new java.util.TreeMap<>();
        Set<Integer> seen = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode point = array.get(i);
            String path = p + "points[" + i + "]";
            // A bare string is accepted as a point; its number is then its position.
            String pointText = point.isTextual() ? (point.asText().isBlank() ? null : point.asText().trim()) : text(point, "text");
            Integer number = point.isTextual() ? i + 1
                    : point.isObject() && point.get("number") != null && point.get("number").isInt() ? point.get("number").asInt() : null;
            if (number == null || number < 1 || number > spec.questionCount()) {
                issues.add(error("POINT_NUMBER_INVALID", path + ".number", "Point " + (i + 1) + " needs a number between 1 and " + spec.questionCount() + "."));
            } else if (!seen.add(number)) {
                issues.add(error("POINT_NUMBER_DUPLICATE", path + ".number", "Point number " + number + " is used more than once."));
            }
            if (pointText == null) {
                issues.add(error("POINT_TEXT_EMPTY", path + ".text", "Point " + (i + 1) + " has no text."));
            } else if (pointText.length() > 300) {
                issues.add(error("POINT_TEXT_TOO_LONG", path + ".text", "Point " + (i + 1) + " is too long (max 300 characters)."));
            }
            if (number != null && pointText != null) byNumber.putIfAbsent(number, pointText);
        }
        if (array.size() != spec.questionCount()) {
            issues.add(error("POINT_COUNT", p + "points", "Exactly " + spec.questionCount() + " content points are required (found " + array.size() + ")."));
        }
        return new ArrayList<>(byNumber.values());
    }

    /** Relationship / style combinations that cannot work, plus softer style hints. */
    private void checkWritingConsistency(ExamContentSpec spec, String communication, String relationship, String greeting, String body, String instructions,
                                         String guidance, String p, List<Issue> issues) {
        if (communication != null && relationship != null) {
            boolean personal = Set.of("FRIEND", "FAMILY", "COURSE_COLLEAGUE").contains(relationship);
            if (personal && communication.equals("FORMAL_EMAIL")) {
                issues.add(error("STYLE_MISMATCH", p + "communicationType",
                        relationship + " does not fit FORMAL_EMAIL — write to friends, family and course colleagues informally (du)."));
            } else if (relationship.equals("ORGANIZATION") && communication.equals("INFORMAL_EMAIL")) {
                issues.add(error("STYLE_MISMATCH", p + "communicationType",
                        "ORGANIZATION does not fit INFORMAL_EMAIL — use SEMI_FORMAL_EMAIL or FORMAL_EMAIL (Sie)."));
            } else if (relationship.equals("COLLEAGUE") && communication.equals("INFORMAL_EMAIL")) {
                issues.add(warning("STYLE_UNUSUAL", p + "communicationType", "COLLEAGUE with INFORMAL_EMAIL is possible but unusual — check that du is natural here."));
            }
        }
        if (communication == null) return;
        boolean informal = communication.equals("INFORMAL_EMAIL");
        boolean formal = communication.equals("FORMAL_EMAIL");
        if (greeting != null) {
            if (informal && !INFORMAL_GREETING.matcher(greeting).matches()) {
                issues.add(warning("GREETING_STYLE", p + "task.incomingMessage.greeting", "Greeting '" + greeting + "' does not look informal (e.g. 'Liebe Anna,')."));
            } else if (formal && !FORMAL_GREETING.matcher(greeting).matches()) {
                issues.add(warning("GREETING_STYLE", p + "task.incomingMessage.greeting", "Greeting '" + greeting + "' does not look formal (e.g. 'Sehr geehrte Frau Weber,')."));
            }
        }
        if (body != null) {
            if (informal && FORMAL_PRONOUN.matcher(body).find()) {
                issues.add(warning("PRONOUN_STYLE", p + "task.incomingMessage.body", "The email addresses the reader with 'Ihnen' although the style is informal (du)."));
            } else if (formal && INFORMAL_PRONOUN.matcher(body).find()) {
                issues.add(warning("PRONOUN_STYLE", p + "task.incomingMessage.body", "The email uses du/dein/euch although the style is formal (Sie)."));
            }
        }
        if (instructions != null && !instructions.equals(spec.defaultInstructions())) {
            issues.add(warning("INSTRUCTIONS_NONSTANDARD", p + "instructions", "The instruction differs from the standard TELC wording."));
        }
        if (!ExamContentSpecs.WRITING_GUIDANCE.equals(guidance)) {
            issues.add(warning("GUIDANCE_NONSTANDARD", p + "writingGuidance", "The writing guidance differs from the standard TELC wording."));
        }
    }

    private void checkEmailBody(String body, String p, List<Issue> issues) {
        int words = TextSimilarity.wordCount(body);
        if (words < WRITING_EMAIL_WARN_MIN || words > WRITING_EMAIL_WARN_MAX) {
            issues.add(warning("EMAIL_LENGTH", p + "task.incomingMessage.body", "The incoming email has " + words + " words; the recommended length is approximately "
                    + WRITING_EMAIL_WARN_MIN + "–" + WRITING_EMAIL_WARN_MAX + "."));
        }
        long questions = body.chars().filter(c -> c == '?').count();
        if (questions >= 4) {
            issues.add(warning("EMAIL_QUESTION_LIST", p + "task.incomingMessage.body", "The email contains " + questions
                    + " questions — it should read like a real email, not a list of four questions."));
        }
    }

    private void warnPoints(List<String> points, String p, List<Issue> issues) {
        for (int i = 0; i < points.size(); i++) {
            if (TextSimilarity.wordCount(points.get(i)) < 3) {
                issues.add(warning("POINT_TOO_SHORT", p + "points[" + i + "]", "Point " + (i + 1) + " ('" + points.get(i)
                        + "') is very short — points should ask for meaningful information, not a single question word."));
            }
            for (int j = i + 1; j < points.size(); j++) {
                if (TextSimilarity.similarity(points.get(i), points.get(j)) >= POINT_OVERLAP_THRESHOLD) {
                    issues.add(warning("POINT_OVERLAP", p + "points", "Point " + (i + 1) + " may overlap with Point " + (j + 1) + ". Please review manually."));
                }
            }
        }
    }

    private void rejectMarkup(String p, List<Issue> issues, List<String> values) {
        for (String value : values) {
            if (value != null && MARKUP.matcher(value).find()) {
                issues.add(error("HTML_CONTENT", p.isEmpty() ? "$" : p.substring(0, p.length() - 1),
                        "Content must be plain text — HTML/script was found in: \"" + (value.length() > 60 ? value.substring(0, 60) + "…" : value) + "\"."));
                return;
            }
        }
    }

    private ParsedExercise readWordBankExercise(int index, ExamContentSpec spec, JsonNode node, String p, String externalId,
                                                String title, String instructions, List<Issue> issues) {
        ParsedExercise.Context context = readContext(node, p, issues);
        String text = readReadingText(node, p, spec, issues);
        if (text != null) checkGapMarkers(text, p, spec, issues);
        List<ParsedExercise.Option> wordBank = readWordBank(node, p, spec, issues);
        List<ParsedExercise.Question> questions = readWordQuestions(node, p, spec, wordBank, issues);
        warnWordBank(wordBank, questions, p, issues);
        Map<String, Object> metadata = readMetadata(node.get("metadata"), p, issues);
        String contextType = text(node, "contextType");
        if (contextType != null) metadata.put("contextType", contextType);
        String topic = text(node, "topic");
        if (topic != null) metadata.put("topic", topic);
        return new ParsedExercise(index, spec, externalId, title, instructions, List.of(), List.of(), metadata, text, questions,
                List.of(), List.of(), wordBank, context);
    }

    /** Optional advertisement / information shown before the text; absent or null means "no context". */
    private ParsedExercise.Context readContext(JsonNode node, String p, List<Issue> issues) {
        JsonNode context = node.get("context");
        if (context == null || context.isNull()) return null;
        if (!context.isObject()) {
            issues.add(error("CONTEXT_INVALID", p + "context", "context must be an object with type, title and text."));
            return null;
        }
        String contextText = text(context, "text");
        if (contextText == null) {
            issues.add(error("CONTEXT_TEXT_EMPTY", p + "context.text", "The context material needs a text (or remove the context object)."));
            return null;
        }
        if (contextText.length() > MAX_FIELD_LENGTH) {
            issues.add(error("CONTEXT_TEXT_TOO_LONG", p + "context.text", "The context text is too long."));
        }
        String type = text(context, "type");
        String contextTitle = text(context, "title");
        return new ParsedExercise.Context(type == null ? "ADVERTISEMENT" : type.toUpperCase(java.util.Locale.ROOT), contextTitle == null ? "" : contextTitle, contextText);
    }

    private List<ParsedExercise.Option> readWordBank(JsonNode node, String p, ExamContentSpec spec, List<Issue> issues) {
        List<ParsedExercise.Option> words = new ArrayList<>();
        JsonNode array = node.get("wordBank");
        if (array == null || !array.isArray()) {
            issues.add(error("WORD_BANK_MISSING", p + "wordBank", "wordBank must be an array of {key, word}."));
            return words;
        }
        Set<String> keys = new LinkedHashSet<>();
        Set<String> normalized = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode w = array.get(i);
            String path = p + "wordBank[" + i + "]";
            String key = firstNonNull(text(w, "key"), text(w, "id"));
            if (key != null) key = key.toLowerCase(java.util.Locale.ROOT);
            String word = firstNonNull(text(w, "word"), text(w, "text"));
            if (key == null) {
                issues.add(error("WORD_KEY_MISSING", path + ".key", "Word " + (i + 1) + " has no key."));
            } else if (!keys.add(key)) {
                issues.add(error("WORD_KEY_DUPLICATE", path + ".key", "Word key '" + key + "' is used more than once."));
            }
            if (word == null) {
                issues.add(error("WORD_EMPTY", path + ".word", "Word '" + key + "' is empty."));
            } else {
                if (word.length() > 40) {
                    issues.add(error("WORD_TOO_LONG", path + ".word", "Word '" + key + "' is too long (max 40 characters)."));
                }
                if (!word.equals(word.toUpperCase(java.util.Locale.ROOT))) {
                    issues.add(warning("WORD_NOT_UPPERCASE", path + ".word", "Word '" + word + "' is not written in capital letters; it is stored as " + word.toUpperCase(java.util.Locale.ROOT) + "."));
                }
                word = word.toUpperCase(java.util.Locale.ROOT);
                if (!normalized.add(word)) {
                    issues.add(error("WORD_DUPLICATE", path + ".word", "The word " + word + " appears more than once in the word bank."));
                }
            }
            words.add(new ParsedExercise.Option(key, word));
        }
        if (words.size() != spec.optionCount()) {
            issues.add(error("WORD_BANK_COUNT", p + "wordBank", "Exactly " + spec.optionCount() + " words are required (found " + words.size() + ")."));
        } else if (!keys.equals(new LinkedHashSet<>(spec.optionIds()))) {
            issues.add(error("WORD_BANK_KEYS", p + "wordBank", "Word keys must be exactly " + String.join(", ", spec.optionIds()) + "."));
        }
        return words;
    }

    private List<ParsedExercise.Question> readWordQuestions(JsonNode node, String p, ExamContentSpec spec,
                                                            List<ParsedExercise.Option> wordBank, List<Issue> issues) {
        List<ParsedExercise.Question> questions = new ArrayList<>();
        JsonNode array = node.get("questions");
        if (array == null || !array.isArray()) {
            issues.add(error("QUESTIONS_MISSING", p + "questions", "questions must be an array."));
            return questions;
        }
        Map<String, String> wordByKey = new LinkedHashMap<>();
        wordBank.forEach(w -> {
            if (w.id() != null) wordByKey.put(w.id(), w.text());
        });
        Set<Integer> numbers = new LinkedHashSet<>();
        Map<String, List<Integer>> usedBy = new LinkedHashMap<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode q = array.get(i);
            String path = p + "questions[" + i + "]";
            Integer number = null;
            JsonNode numberNode = q == null ? null : q.get("number");
            if (numberNode != null && numberNode.isIntegralNumber()) {
                number = numberNode.asInt();
                if (number < spec.firstQuestionNumber() || number > spec.lastQuestionNumber()) {
                    issues.add(error("GAP_NUMBER_OUT_OF_RANGE", path + ".number", "Gap number " + number + " is outside "
                            + spec.firstQuestionNumber() + "–" + spec.lastQuestionNumber() + "."));
                } else if (!numbers.add(number)) {
                    issues.add(error("QUESTION_NUMBER_DUPLICATE", path + ".number", "Gap number " + number + " is used more than once."));
                }
            } else {
                issues.add(error("QUESTION_NUMBER_INVALID", path + ".number", "Question " + (i + 1) + " needs a whole-number 'number' ("
                        + spec.firstQuestionNumber() + "–" + spec.lastQuestionNumber() + ")."));
            }
            String label = number != null ? "Gap " + number : "Question " + (i + 1);

            String key = firstNonNull(text(q, "correctAnswer"), text(q, "correctOptionId"));
            if (key != null) key = key.toLowerCase(java.util.Locale.ROOT);
            if (key == null) {
                issues.add(error("CORRECT_WORD_MISSING", path + ".correctAnswer", label + " has no correctAnswer (a word-bank key a–o)."));
            } else if (!spec.optionIds().contains(key)) {
                issues.add(error("CORRECT_OPTION_UNKNOWN", path + ".correctAnswer", label + " refers to '" + key + "', which is not a word-bank key (a–o)."));
            } else {
                usedBy.computeIfAbsent(key, k -> new ArrayList<>()).add(number != null ? number : i + 1);
                String declared = text(q, "correctWord");
                String actual = wordByKey.get(key);
                if (declared != null && actual != null && !declared.equalsIgnoreCase(actual)) {
                    issues.add(error("CORRECT_WORD_MISMATCH", path + ".correctWord", label + ": correctWord '" + declared + "' does not match word "
                            + key + " in the word bank ('" + actual + "')."));
                }
            }
            String category = firstNonNull(text(q, "grammarCategory"), text(q, "category"));
            if (category != null && category.length() > 60) category = category.substring(0, 60);
            questions.add(new ParsedExercise.Question("question_" + (number != null ? number : i + 1), number, null, List.of(), key,
                    category == null ? null : category.toUpperCase(java.util.Locale.ROOT), text(q, "grammarFocus"), readExplanations(q)));
        }
        if (questions.size() != spec.questionCount()) {
            issues.add(error("QUESTION_COUNT", p + "questions", "Exactly " + spec.questionCount() + " questions (gaps) are required (found " + questions.size() + ")."));
        }
        usedBy.forEach((key, gaps) -> {
            if (gaps.size() > 1) {
                issues.add(error("WORD_REUSED", p + "questions", "Word " + key + " (" + wordByKey.getOrDefault(key, "?") + ") is the answer for gaps "
                        + gaps.stream().map(String::valueOf).reduce((a, b) -> a + " and " + b).orElse("") + ". Every word may be used once."));
            }
        });
        return questions;
    }

    /** Non-blocking quality hints for a word bank. */
    private void warnWordBank(List<ParsedExercise.Option> wordBank, List<ParsedExercise.Question> questions, String p, List<Issue> issues) {
        Set<String> words = new LinkedHashSet<>();
        wordBank.forEach(w -> {
            if (w.text() != null) words.add(w.text());
        });
        for (Set<String> group : SYNONYM_GROUPS) {
            List<String> present = group.stream().filter(words::contains).toList();
            if (present.size() > 1) {
                issues.add(warning("WORD_BANK_SYNONYMS", p + "wordBank", "The word bank contains near-synonyms (" + String.join(", ", present)
                        + "); check that only one of them fits its gap."));
            }
        }
        List<String> sortedWords = wordBank.stream().map(ParsedExercise.Option::text).filter(java.util.Objects::nonNull).toList();
        if (sortedWords.size() == wordBank.size() && sortedWords.size() > 1
                && !sortedWords.equals(sortedWords.stream().sorted(java.text.Collator.getInstance(java.util.Locale.GERMAN)).toList())) {
            issues.add(warning("WORD_BANK_ORDER", p + "wordBank", "The word bank is not in alphabetical order, as in the real exam."));
        }
        List<String> keys = questions.stream().sorted(java.util.Comparator.comparing(q -> q.number() == null ? 0 : q.number()))
                .map(ParsedExercise.Question::correctOptionId).toList();
        if (keys.size() >= 4 && keys.stream().noneMatch(java.util.Objects::isNull)) {
            boolean ascending = true;
            for (int i = 1; i < keys.size(); i++) {
                if (keys.get(i).compareTo(keys.get(i - 1)) <= 0) {
                    ascending = false;
                    break;
                }
            }
            if (ascending) {
                issues.add(warning("ANSWER_SEQUENCE_PREDICTABLE", p + "questions", "The correct words run in word-bank order; answers should look random."));
            }
        }
    }

    /** Sprachbausteine Teil 1: text with [21]..[30] markers + one question (a/b/c) per gap. */
    private ParsedExercise readGapExercise(int index, ExamContentSpec spec, JsonNode node, String p, String externalId,
                                           String title, String instructions, List<Issue> issues) {
        String text = readReadingText(node, p, spec, issues);
        if (text != null) checkGapMarkers(text, p, spec, issues);
        List<ParsedExercise.Question> questions = readQuestions(node, p, spec, issues);
        warnAnswerPatterns(questions, p, issues);
        warnCategories(questions, p, issues);
        Map<String, Object> metadata = readMetadata(node.get("metadata"), p, issues);
        String textType = text(node, "textType");
        if (textType != null) {
            textType = textType.toUpperCase(java.util.Locale.ROOT);
            if (!TEXT_TYPES.contains(textType)) {
                issues.add(warning("TEXT_TYPE_UNKNOWN", p + "textType", "Unknown textType '" + textType + "' (use " + String.join(", ", TEXT_TYPES) + ")."));
            }
            metadata.put("textType", textType);
        }
        String topic = text(node, "topic");
        if (topic != null) metadata.put("topic", topic);
        return new ParsedExercise(index, spec, externalId, title, instructions, List.of(), List.of(), metadata, text, questions);
    }

    /** Every gap number of the spec must appear in the text exactly once, and no other [n] marker may. */
    private void checkGapMarkers(String text, String p, ExamContentSpec spec, List<Issue> issues) {
        Map<Integer, Integer> seen = new LinkedHashMap<>();
        var matcher = GAP_MARKER.matcher(text);
        while (matcher.find()) seen.merge(Integer.parseInt(matcher.group(1)), 1, Integer::sum);
        for (int n = spec.firstQuestionNumber(); n <= spec.lastQuestionNumber(); n++) {
            int count = seen.getOrDefault(n, 0);
            if (count == 0) {
                issues.add(error("GAP_MARKER_MISSING", p + "text.content", "The text has no gap marker [" + n + "]."));
            } else if (count > 1) {
                issues.add(error("GAP_MARKER_DUPLICATE", p + "text.content", "Gap marker [" + n + "] appears " + count + " times; every gap may appear once."));
            }
        }
        seen.keySet().stream().filter(n -> n < spec.firstQuestionNumber() || n > spec.lastQuestionNumber()).forEach(n ->
                issues.add(error("GAP_MARKER_UNEXPECTED", p + "text.content", "Unexpected gap marker [" + n + "]; gaps must be numbered "
                        + spec.firstQuestionNumber() + "–" + spec.lastQuestionNumber() + ".")));
    }

    /** Quality hints: one grammar category should not dominate, and the ten gaps should test a variety. */
    private void warnCategories(List<ParsedExercise.Question> questions, String p, List<Issue> issues) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        questions.stream().map(ParsedExercise.Question::type).filter(java.util.Objects::nonNull).forEach(c -> counts.merge(c, 1, Integer::sum));
        counts.forEach((category, count) -> {
            if (count > 3) {
                issues.add(warning("CATEGORY_DOMINATES", p + "questions", count + " of " + questions.size() + " gaps test " + category + "; use a more varied mix."));
            }
        });
        if (!counts.isEmpty() && counts.size() < 5 && questions.size() >= 8) {
            issues.add(warning("CATEGORY_VARIETY", p + "questions", "Only " + counts.size() + " different grammar categories are used; aim for at least 5."));
        }
    }

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
            // Sprachbausteine files identify a gap by its number alone; derive the id instead of requiring one.
            if (id == null && spec.isGapText() && q != null && q.get("number") != null && q.get("number").isIntegralNumber()) {
                id = "question_" + q.get("number").asInt();
            }
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
                // A gap question is identified by its number alone ("Lücke 21"); only reading questions need their own text.
                if (!spec.isGapText()) {
                    issues.add(error("QUESTION_TEXT_EMPTY", path + ".question", "Question " + (i + 1) + " has no question text."));
                }
            } else {
                if (questionText.length() > 500) {
                    issues.add(error("QUESTION_TEXT_TOO_LONG", path + ".question", "Question " + (i + 1) + " is too long (max 500 characters)."));
                }
                if (!normalizedQuestions.add(TextSimilarity.normalize(questionText))) {
                    issues.add(error("QUESTION_TEXT_DUPLICATE", path + ".question", "Question " + (i + 1) + " repeats another question."));
                }
            }

            List<ParsedExercise.Option> options = readOptions(q, path, spec, issues);
            String correct = firstNonNull(text(q, "correctOptionId"), text(q, "correctAnswer"));
            if (correct != null) correct = correct.toLowerCase(java.util.Locale.ROOT);
            final String correctId = correct;
            if (correct == null) {
                issues.add(error("CORRECT_OPTION_MISSING", path + ".correctOptionId", "Question " + (i + 1) + " has no correctOptionId."));
            } else if (options.stream().noneMatch(o -> correctId.equals(o.id()))) {
                issues.add(error("CORRECT_OPTION_UNKNOWN", path + ".correctOptionId",
                        "Question " + (i + 1) + " refers to option '" + correct + "', which does not exist."));
            }

            // Reading questions declare a questionType, Sprachbausteine gaps a grammar category.
            String typeField = spec.isGapText() ? "category" : "questionType";
            Set<String> allowedTypes = spec.isGapText() ? GAP_CATEGORIES : QUESTION_TYPES;
            String type = text(q, typeField);
            if (type == null) {
                issues.add(warning(spec.isGapText() ? "CATEGORY_MISSING" : "QUESTION_TYPE_MISSING", path + "." + typeField,
                        "Question " + (i + 1) + " has no " + typeField + "."));
            } else if (!allowedTypes.contains(type.toUpperCase())) {
                issues.add(warning(spec.isGapText() ? "CATEGORY_UNKNOWN" : "QUESTION_TYPE_UNKNOWN", path + "." + typeField,
                        "Unknown " + typeField + " '" + type + "' (use " + String.join(", ", allowedTypes) + "); ignored."));
                type = null;
            }
            Map<String, String> explanations = readExplanations(q);
            questions.add(new ParsedExercise.Question(id, number, questionText, options, correct, type == null ? null : type.toUpperCase(),
                    text(q, "grammarFocus"), explanations));
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

    /** explanation is {"de": ..., "en": ..., "fa": ...} or a plain German string. */
    private static Map<String, String> readExplanations(JsonNode question) {
        Map<String, String> out = new LinkedHashMap<>();
        JsonNode node = question == null ? null : question.get("explanation");
        if (node == null || node.isNull()) return out;
        if (node.isTextual()) {
            if (!node.asText().isBlank()) out.put("de", node.asText().trim());
        } else if (node.isObject()) {
            for (String lang : List.of("de", "en", "fa")) {
                String value = text(node, lang);
                if (value != null) out.put(lang, value.length() > 1000 ? value.substring(0, 1000) : value);
            }
        }
        return out;
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
            String id = firstNonNull(text(o, "id"), text(o, "key"));
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
        Map<String, Integer> byKey = new LinkedHashMap<>();
        keys.stream().filter(java.util.Objects::nonNull).forEach(k -> byKey.merge(k, 1, Integer::sum));
        byKey.forEach((key, count) -> {
            if (keys.size() >= 5 && new LinkedHashSet<>(keys).size() > 1 && count * 10 > keys.size() * 6) {
                issues.add(warning("ANSWER_POSITIONS_SKEWED", p + "questions", "Option '" + key + "' is correct in " + count + " of " + keys.size()
                        + " questions; spread the correct answers over the positions."));
            }
        });
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
