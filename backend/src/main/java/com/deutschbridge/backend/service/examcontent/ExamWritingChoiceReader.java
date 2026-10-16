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
import java.util.TreeSet;
import java.util.regex.Pattern;

import static com.deutschbridge.backend.service.examcontent.ExamContentValidator.error;
import static com.deutschbridge.backend.service.examcontent.ExamContentValidator.warning;

/**
 * Reads and validates a DTZ Schreiben exercise: exactly two alternative tasks (Aufgabe A and Aufgabe B), each with a situation, an optional
 * recipient, a writing instruction and exactly four numbered content points, and a duration of 30 minutes. The learner answers one task only.
 *
 * Structure is deterministic and reported as errors (they block the import). Whether a situation is clear, a point fits the situation or the two
 * tasks are really equally hard cannot be established by a program: those checks only produce warnings for patterns that often point at a problem,
 * so they support the administrator's review and never prove that a task meets every criterion of the official examination.
 */
final class ExamWritingChoiceReader {

    static final String EXERCISE_TYPE = "WRITING_TASK_CHOICE";
    static final List<String> LABELS = List.of("A", "B");
    static final int POINT_COUNT = 4;
    static final Set<String> COMMUNICATION_TYPES = Set.of(
            "FORMAL_EMAIL", "FORMAL_LETTER", "INFORMAL_EMAIL", "INFORMAL_LETTER", "SEMI_FORMAL_EMAIL", "SEMI_FORMAL_LETTER");
    static final Set<String> LANGUAGE_LEVELS = Set.of("A2", "A2_B1", "B1");

    static final int MAX_TITLE = 200;
    static final int MAX_SITUATION = 1_200;
    static final int MAX_INSTRUCTION = 500;
    static final int MAX_POINT = 300;
    static final int MAX_FIELD = 200;

    /** Error codes per check group, for the validation summary shown to the admin. */
    static final Set<String> HEADER_CODES = Set.of("EXERCISE_TYPE_INVALID", "WRITING_DURATION", "WRITING_LEVEL");
    static final Set<String> TASK_CODES = Set.of("TASKS_MISSING", "TASK_COUNT", "TASK_NOT_OBJECT", "TASK_LABEL_MISSING", "TASK_LABEL_INVALID", "TASK_LABEL_DUPLICATE");
    static final Set<String> FIELD_CODES = Set.of("TASK_TITLE_MISSING", "SITUATION_MISSING", "INSTRUCTION_MISSING", "FIELD_TYPE", "FIELD_TOO_LONG",
            "COMMUNICATION_TYPE_INVALID", "RECIPIENT_NOT_OBJECT", "HTML_CONTENT", "PLACEHOLDER_CONTENT");
    static final Set<String> POINT_CODES = Set.of("POINTS_MISSING", "POINT_COUNT", "POINT_NOT_OBJECT", "POINT_NUMBER_INVALID", "POINT_NUMBER_DUPLICATE",
            "POINT_TEXT_MISSING", "POINT_TOO_LONG");

    private static final Pattern MARKUP = Pattern.compile("<\\s*/?\\s*[a-zA-Z!]|javascript:", Pattern.CASE_INSENSITIVE);
    private static final Pattern PLACEHOLDER = Pattern.compile("^\\s*(\\.{3}|…|TODO|TBD|lorem ipsum.*)\\s*$", Pattern.CASE_INSENSITIVE);
    private static final Pattern INFORMAL_PRONOUN = Pattern.compile("\\b(du|dir|dich|dein|deine|deinen|deinem|deiner|euch|euer|eure)\\b");
    private static final Pattern FORMAL_ROLE = Pattern.compile(
            "vermieter|hausverwaltung|leiter|leiterin|amt|behörde|firma|chef|chefin|personal|sachbearbeiter|mitarbeiter|sekretariat|kundenservice|direktor|arzt|ärztin|praxis|schule|lehrer|lehrerin|kursleiter|kursleiterin|büro|abteilung|verein|herr |frau ",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern PRIVATE_ROLE = Pattern.compile(
            "freund|freundin|bruder|schwester|mutter|vater|oma|opa|tante|onkel|cousin|cousine|kollege aus dem sprachkurs|bekannte|nachbar(in)?\\b|kind|sohn|tochter",
            Pattern.CASE_INSENSITIVE);
    /** Topics that need specialist knowledge, which the learner cannot be expected to have. */
    private static final List<String> SPECIALIST_TERMS = List.of(
            "steuererklärung", "gutachten", "hypothek", "kündigungsfrist", "paragraph", "rechtsanwalt", "versicherungsfall", "widerspruchsverfahren",
            "bilanz", "aktie", "grundbuch", "mietminderung", "nebenkostenabrechnung", "schadensersatz", "klage", "gerichtsverfahren", "patentanmeldung");

    private final String p;
    private final List<Issue> issues;
    private final List<String> strings = new ArrayList<>();

    ExamWritingChoiceReader(String pathPrefix, List<Issue> issues) {
        this.p = pathPrefix;
        this.issues = issues;
    }

    record Result(ParsedExercise.WritingChoice writingChoice) {
    }

    Result read(ExamContentSpec spec, JsonNode node) {
        String exerciseType = text(node, "exerciseType");
        if (exerciseType != null && !EXERCISE_TYPE.equals(exerciseType.toUpperCase(Locale.ROOT))) {
            issues.add(error("EXERCISE_TYPE_INVALID", p + "exerciseType", "exerciseType must be " + EXERCISE_TYPE + " (found: " + exerciseType + ")."));
        }
        int duration = readDuration(node);
        String languageLevel = readLanguageLevel(node);
        List<ParsedExercise.WritingChoiceTask> tasks = readTasks(node);
        rejectMarkup();
        rejectPlaceholders();
        if (tasks.size() == LABELS.size()) warn(tasks);
        return new Result(new ParsedExercise.WritingChoice(duration, languageLevel, tasks));
    }

    // ------------------------------------------------------------------ header

    private int readDuration(JsonNode node) {
        JsonNode value = node.get("durationMinutes");
        if (value == null || value.isNull()) {
            issues.add(error("WRITING_DURATION", p + "durationMinutes", "durationMinutes is required and must be " + ExamContentSpecs.WRITING_CHOICE_MINUTES + "."));
            return ExamContentSpecs.WRITING_CHOICE_MINUTES;
        }
        if (!value.isIntegralNumber() || value.asInt() != ExamContentSpecs.WRITING_CHOICE_MINUTES) {
            issues.add(error("WRITING_DURATION", p + "durationMinutes", "The writing time of DTZ Schreiben is " + ExamContentSpecs.WRITING_CHOICE_MINUTES
                    + " minutes (found: " + value.asText() + ")."));
            return ExamContentSpecs.WRITING_CHOICE_MINUTES;
        }
        return value.asInt();
    }

    private String readLanguageLevel(JsonNode node) {
        String difficulty = firstNonNull(text(node, "difficulty"), text(node, "level"));
        if (difficulty == null) return "A2_B1";
        String normalized = difficulty.toUpperCase(Locale.ROOT).replaceAll("[-– ]", "_");
        if (!LANGUAGE_LEVELS.contains(normalized)) {
            issues.add(warning("DIFFICULTY_UNKNOWN", p + "difficulty", "Unknown difficulty '" + difficulty + "' (use A2, A2_B1 or B1); A2_B1 is used."));
            return "A2_B1";
        }
        return normalized;
    }

    // ------------------------------------------------------------------ tasks

    private List<ParsedExercise.WritingChoiceTask> readTasks(JsonNode node) {
        List<ParsedExercise.WritingChoiceTask> tasks = new ArrayList<>();
        JsonNode array = node.get("tasks");
        if (array == null || !array.isArray()) {
            issues.add(error("TASKS_MISSING", p + "tasks", "tasks must be an array with exactly two tasks: Aufgabe A and Aufgabe B."));
            return tasks;
        }
        if (array.size() != LABELS.size()) {
            issues.add(error("TASK_COUNT", p + "tasks", "Exactly two tasks (A and B) are required (found " + array.size() + ")."));
        }
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode t = array.get(i);
            String path = p + "tasks[" + i + "]";
            if (t == null || !t.isObject()) {
                issues.add(error("TASK_NOT_OBJECT", path, "Each task must be a JSON object."));
                continue;
            }
            String label = readLabel(t, path, seen);
            tasks.add(readTask(t, path, label));
        }
        // The learner always sees A before B, whatever the order in the file.
        tasks.sort(java.util.Comparator.comparing(ParsedExercise.WritingChoiceTask::label, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())));
        return tasks;
    }

    private String readLabel(JsonNode t, String path, Set<String> seen) {
        String raw = text(t, "taskLabel");
        if (raw == null) {
            issues.add(error("TASK_LABEL_MISSING", path + ".taskLabel", "taskLabel must be A or B."));
            return null;
        }
        String label = raw.toUpperCase(Locale.ROOT);
        if (!LABELS.contains(label)) {
            issues.add(error("TASK_LABEL_INVALID", path + ".taskLabel", "taskLabel must be exactly A or B (found: " + raw + ")."));
            return null;
        }
        if (!seen.add(label)) {
            issues.add(error("TASK_LABEL_DUPLICATE", path + ".taskLabel", "taskLabel " + label + " is used more than once; the tasks must be A and B."));
        }
        return label;
    }

    private ParsedExercise.WritingChoiceTask readTask(JsonNode t, String path, String label) {
        String title = field(t, "title", path, MAX_TITLE, "TASK_TITLE_MISSING", "The task has no title.");
        String topic = field(t, "topic", path, MAX_FIELD, null, null);
        String situation = field(t, "situation", path, MAX_SITUATION, "SITUATION_MISSING", "The task has no situation.");
        String instruction = field(t, "writingInstruction", path, MAX_INSTRUCTION, "INSTRUCTION_MISSING", "The task has no writing instruction.");
        String communicationType = readCommunicationType(t, path);
        String[] recipient = readRecipient(t, path);
        List<String> points = readPoints(t, path);
        return new ParsedExercise.WritingChoiceTask(label, title, topic, communicationType, situation, recipient[0], recipient[1], instruction, points);
    }

    /** A required (or optional) string; a wrong JSON type is reported as FIELD_TYPE rather than as a missing value. */
    private String field(JsonNode t, String name, String path, int max, String missingCode, String missingMessage) {
        JsonNode value = t.get(name);
        if (value != null && !value.isNull() && !value.isTextual()) {
            issues.add(error("FIELD_TYPE", path + "." + name, name + " must be a text."));
            return null;
        }
        String s = text(t, name);
        if (s == null) {
            if (missingCode != null) issues.add(error(missingCode, path + "." + name, missingMessage));
            return null;
        }
        if (s.length() > max) {
            issues.add(error("FIELD_TOO_LONG", path + "." + name, name + " is longer than " + max + " characters."));
        }
        strings.add(s);
        return s;
    }

    private String readCommunicationType(JsonNode t, String path) {
        String raw = text(t, "communicationType");
        if (raw == null) {
            issues.add(error("COMMUNICATION_TYPE_INVALID", path + ".communicationType", "communicationType must be one of " + String.join(", ", new TreeSet<>(COMMUNICATION_TYPES)) + "."));
            return null;
        }
        String type = raw.toUpperCase(Locale.ROOT).replaceAll("[\\s-]+", "_");
        if (!COMMUNICATION_TYPES.contains(type)) {
            issues.add(error("COMMUNICATION_TYPE_INVALID", path + ".communicationType", "communicationType must be one of " + String.join(", ", new TreeSet<>(COMMUNICATION_TYPES)) + " (found: " + raw + ")."));
            return null;
        }
        return type;
    }

    /** {name, role}; both null when there is no recipient (allowed). */
    private String[] readRecipient(JsonNode t, String path) {
        JsonNode r = t.get("recipient");
        if (r == null || r.isNull()) return new String[]{null, null};
        if (!r.isObject()) {
            issues.add(error("RECIPIENT_NOT_OBJECT", path + ".recipient", "recipient must be an object with name and role, or null."));
            return new String[]{null, null};
        }
        String name = field(r, "name", path + ".recipient", MAX_FIELD, null, null);
        String role = field(r, "role", path + ".recipient", MAX_FIELD, null, null);
        return new String[]{name, role};
    }

    private List<String> readPoints(JsonNode t, String path) {
        List<String> points = new ArrayList<>();
        JsonNode array = t.get("points");
        if (array == null || !array.isArray()) {
            issues.add(error("POINTS_MISSING", path + ".points", "points must be an array of exactly " + POINT_COUNT + " content points."));
            return points;
        }
        if (array.size() != POINT_COUNT) {
            issues.add(error("POINT_COUNT", path + ".points", "Exactly " + POINT_COUNT + " content points are required per task (found " + array.size() + ")."));
        }
        Map<Integer, String> byNumber = new LinkedHashMap<>();
        for (int j = 0; j < array.size(); j++) {
            JsonNode point = array.get(j);
            String pointPath = path + ".points[" + j + "]";
            if (point == null || !point.isObject()) {
                issues.add(error("POINT_NOT_OBJECT", pointPath, "Each point must be an object with number and text."));
                continue;
            }
            JsonNode number = point.get("number");
            if (number == null || !number.isIntegralNumber() || number.asInt() < 1 || number.asInt() > POINT_COUNT) {
                issues.add(error("POINT_NUMBER_INVALID", pointPath + ".number", "The point number must be a whole number from 1 to " + POINT_COUNT + "."));
                continue;
            }
            int n = number.asInt();
            JsonNode textNode = point.get("text");
            String pointText = textNode != null && textNode.isTextual() ? text(point, "text") : null;
            if (byNumber.containsKey(n)) {
                issues.add(error("POINT_NUMBER_DUPLICATE", pointPath + ".number", "Point number " + n + " is used more than once."));
                continue;
            }
            if (pointText == null) {
                issues.add(error("POINT_TEXT_MISSING", pointPath + ".text", "Point " + n + " has no text."));
                byNumber.put(n, "");
                continue;
            }
            if (pointText.length() > MAX_POINT) {
                issues.add(error("POINT_TOO_LONG", pointPath + ".text", "Point " + n + " is longer than " + MAX_POINT + " characters."));
            }
            strings.add(pointText);
            byNumber.put(n, pointText);
        }
        for (int n = 1; n <= POINT_COUNT; n++) {
            if (byNumber.containsKey(n)) points.add(byNumber.get(n));
        }
        return points;
    }

    // ------------------------------------------------------------------ advisory warnings

    private void warn(List<ParsedExercise.WritingChoiceTask> tasks) {
        List<Integer> sizes = new ArrayList<>();
        for (int i = 0; i < tasks.size(); i++) {
            ParsedExercise.WritingChoiceTask task = tasks.get(i);
            String where = p + "tasks[" + i + "]";
            String name = "Aufgabe " + (task.label() == null ? i + 1 : task.label());
            String all = joinedText(task);
            sizes.add(TextSimilarity.wordCount(all));

            if (task.situation() != null && TextSimilarity.wordCount(task.situation()) < 8) {
                issues.add(warning("SITUATION_UNCLEAR", where + ".situation", name + ": the situation is very short; the learner may not know what happened or why they write."));
            }
            if (task.situation() != null && TextSimilarity.wordCount(task.situation()) > 90) {
                issues.add(warning("SITUATION_LONG", where + ".situation", name + ": the situation is long for an A2–B1 task; check that it stays easy to understand."));
            }
            if (task.recipientName() == null && task.recipientRole() == null && task.communicationType() != null && task.communicationType().startsWith("FORMAL")) {
                issues.add(warning("RECIPIENT_MISSING", where + ".recipient", name + ": a formal task should say who the learner writes to."));
            }
            checkStyle(task, where, name);
            checkPoints(task, where, name);
            String lower = all.toLowerCase(Locale.GERMAN);
            SPECIALIST_TERMS.stream().filter(lower::contains).findFirst().ifPresent(term ->
                    issues.add(warning("SPECIALIST_KNOWLEDGE", where, name + ": \"" + term + "\" may require specialist knowledge that an A2–B1 learner does not have.")));
        }
        if (sizes.size() == 2 && Math.min(sizes.get(0), sizes.get(1)) > 0
                && (double) Math.max(sizes.get(0), sizes.get(1)) / Math.min(sizes.get(0), sizes.get(1)) > 1.6) {
            issues.add(warning("TASKS_UNBALANCED", p + "tasks", "Aufgabe A has " + sizes.get(0) + " words and Aufgabe B " + sizes.get(1)
                    + "; the two alternatives may differ in reading effort or difficulty."));
        }
        ParsedExercise.WritingChoiceTask a = tasks.get(0);
        ParsedExercise.WritingChoiceTask b = tasks.get(1);
        if (a.topic() != null && a.topic().equalsIgnoreCase(b.topic()) && a.communicationType() != null && a.communicationType().equals(b.communicationType())) {
            issues.add(warning("TASKS_TOO_SIMILAR", p + "tasks", "Both tasks have the same topic and the same communication type; the learner gets little real choice."));
        }
        if (a.situation() != null && b.situation() != null && TextSimilarity.similarity(a.situation(), b.situation()) >= 0.5) {
            issues.add(warning("TASKS_TOO_SIMILAR", p + "tasks", "The situations of Aufgabe A and Aufgabe B are very similar."));
        }
    }

    private void checkStyle(ParsedExercise.WritingChoiceTask task, String where, String name) {
        if (task.communicationType() == null) return;
        boolean formal = task.communicationType().startsWith("FORMAL");
        boolean informal = task.communicationType().startsWith("INFORMAL");
        String text = (task.situation() == null ? "" : task.situation()) + " " + (task.writingInstruction() == null ? "" : task.writingInstruction())
                + " " + String.join(" ", task.points());
        String role = task.recipientRole() == null ? "" : task.recipientRole();
        if (formal && INFORMAL_PRONOUN.matcher(text).find()) {
            issues.add(warning("STYLE_MISMATCH", where, name + ": the task is formal but the text uses \"du\" forms; check the recipient and style."));
        }
        if (formal && PRIVATE_ROLE.matcher(role).find()) {
            issues.add(warning("STYLE_MISMATCH", where + ".recipient", name + ": the recipient \"" + role + "\" sounds private but the task is " + task.communicationType() + "."));
        }
        if (informal && (FORMAL_ROLE.matcher(role).find() || task.recipientName() != null && task.recipientName().matches("(?i)^(herr|frau)\\b.*"))) {
            issues.add(warning("STYLE_MISMATCH", where + ".recipient", name + ": the recipient sounds formal but the task is " + task.communicationType() + "."));
        }
    }

    private void checkPoints(ParsedExercise.WritingChoiceTask task, String where, String name) {
        List<String> points = task.points();
        String context = ((task.title() == null ? "" : task.title()) + " " + (task.situation() == null ? "" : task.situation()) + " "
                + (task.writingInstruction() == null ? "" : task.writingInstruction()) + " " + (task.topic() == null ? "" : task.topic())).toLowerCase(Locale.GERMAN);
        for (int i = 0; i < points.size(); i++) {
            String point = points.get(i);
            int words = TextSimilarity.wordCount(point);
            if (words > 0 && words < 2 && point.length() < 6) {
                issues.add(warning("POINT_VAGUE", where + ".points[" + i + "]", name + ", point " + (i + 1) + " (\"" + point + "\") is very short and may be too vague."));
            }
            if (words > 18) {
                issues.add(warning("POINT_COMPLEX", where + ".points[" + i + "]", name + ", point " + (i + 1) + " has " + words + " words; it may contain several tasks at once."));
            }
            if (words >= 3 && !sharesStem(point, context + " " + otherPoints(points, i))) {
                issues.add(warning("POINT_UNRELATED", where + ".points[" + i + "]", name + ", point " + (i + 1) + " shares no vocabulary with the situation; check that it belongs to it."));
            }
            for (int j = i + 1; j < points.size(); j++) {
                if (TextSimilarity.similarity(point, points.get(j)) >= ExamContentValidator.POINT_OVERLAP_THRESHOLD) {
                    issues.add(warning("POINT_OVERLAP", where + ".points[" + i + "]", name + ", points " + (i + 1) + " and " + (j + 1) + " overlap strongly."));
                }
            }
        }
    }

    private static String otherPoints(List<String> points, int skip) {
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < points.size(); i++) if (i != skip) b.append(' ').append(points.get(i));
        return b.toString().toLowerCase(Locale.GERMAN);
    }

    /** True when any word of {@code point} (5+ letters, compared by its first five letters) occurs in {@code context}. */
    private static boolean sharesStem(String point, String context) {
        String normalizedContext = TextSimilarity.normalize(context);
        for (String word : TextSimilarity.normalize(point).split(" ")) {
            if (word.length() >= 5 && normalizedContext.contains(word.substring(0, 5))) return true;
        }
        return false;
    }

    private static String joinedText(ParsedExercise.WritingChoiceTask task) {
        return String.join(" ", java.util.Arrays.asList(task.title(), task.situation(), task.writingInstruction()).stream()
                .filter(java.util.Objects::nonNull).toList()) + " " + String.join(" ", task.points());
    }

    // ------------------------------------------------------------------ plain-text guards

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

    private static String firstNonNull(String a, String b) {
        return a != null ? a : b;
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.isObject()) return null;
        JsonNode value = node.get(field);
        if (value == null || value.isNull() || !value.isValueNode()) return null;
        String s = value.asText();
        return s.isBlank() ? null : s.trim();
    }
}
