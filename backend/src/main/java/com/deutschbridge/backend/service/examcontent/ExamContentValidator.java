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
