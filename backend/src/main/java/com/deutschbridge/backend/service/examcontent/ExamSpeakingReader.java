package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.Issue;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.Iterator;
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
 * Reads and validates the part-specific content of a Mündlicher Ausdruck exercise (Teil 1 topic interview, Teil 2 opinion
 * discussion, Teil 3 joint planning). Each part has its own reader and its own output shape - they are deliberately not forced into one
 * generic structure. The result is a map that contains only whitelisted keys with plain German strings, lists and maps.
 *
 * Learning content is German-only: translation keys ("en", "fa" ...) and Arabic-script text are rejected.
 */
final class ExamSpeakingReader {

    private static final Pattern MARKUP = Pattern.compile("<\\s*/?\\s*[a-zA-Z!]|javascript:", Pattern.CASE_INSENSITIVE);
    private static final Pattern ARABIC_SCRIPT = Pattern.compile("[\\u0600-\\u06FF\\u0750-\\u077F\\uFB50-\\uFDFF\\uFE70-\\uFEFF]");
    private static final Pattern IMAGE_REFERENCE = Pattern.compile("(/uploads/|https://)[^\\s<>\"']{1,280}");
    private static final Pattern FIRST_PERSON = Pattern.compile("\\b(ich|mir|mich|mein|meine|meiner|meinem|meinen|wir|uns)\\b", Pattern.CASE_INSENSITIVE);

    /** The validated content plus the strings that were read (for the plain-text / markup checks). */
    record Result(ParsedExercise.Speaking speaking) {
    }

    private final String p;
    private final List<Issue> issues;
    private final List<String> strings = new ArrayList<>();

    ExamSpeakingReader(String pathPrefix, List<Issue> issues) {
        this.p = pathPrefix;
        this.issues = issues;
    }

    /** Validates the Lernbereich content of one Teil; returns the normalised content. */
    static Map<String, Object> validateGuide(int part, JsonNode node, List<Issue> issues) {
        return new ExamSpeakingReader("", issues).readGuide(part, node);
    }

    Result read(ExamContentSpec spec, JsonNode node, String title, String instructions) {
        rejectTranslations(node, p.isEmpty() ? "$" : p.substring(0, p.length() - 1));
        String expectedType = SpeakingSchema.taskTypeOf(spec);
        String taskType = text(node, "taskType");
        if (taskType == null || !taskType.toUpperCase(Locale.ROOT).equals(expectedType)) {
            issues.add(error("TASK_TYPE_INVALID", p + "taskType", "taskType must be " + expectedType + " for " + spec.label() + " (found: " + taskType + ")."));
        }
        String topic = text(node, "topic");
        if (topic == null) {
            issues.add(error("TOPIC_MISSING", p + "topic", "topic must not be empty."));
        } else if (topic.length() > 200) {
            issues.add(error("TOPIC_TOO_LONG", p + "topic", "topic may be at most 200 characters."));
        }
        strings.add(title);
        strings.add(instructions);
        strings.add(topic);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("topic", topic);
        switch (spec.part()) {
            case 1 -> readTopicInterview(node, data);
            case 2 -> readOpinionDiscussion(node, data);
            default -> readJointPlanning(node, data);
        }
        // Optional per exercise: the Lernbereich of the Teil carries the standard checklist; an exercise may add its own.
        data.put("selfAssessment", stringList(node, "selfAssessment", p, 0, SpeakingSchema.MAX_SELF_ASSESSMENT, 250, "SELF_ASSESSMENT", false));

        checkPlainText();
        return new Result(new ParsedExercise.Speaking(expectedType, topic, data));
    }

    // ------------------------------------------------------------------ exercises
    // An exercise holds only what is specific to it. Questions, Redemittel, tips and goals are the same for every exercise of a Teil and
    // live once in the Lernbereich (see readGuide) - fields that moved there are ignored with a warning.

    private static final Set<String> MOVED_TO_GUIDE = Set.of(
            "communicationGoals", "phraseGroups", "usefulPhrases", "questions", "followUpQuestions");

    private void warnMovedFields(JsonNode node, String path) {
        for (String field : MOVED_TO_GUIDE) {
            if (node.has(field)) {
                issues.add(warning("MOVED_TO_GUIDE", path.isEmpty() ? field : path + "." + field,
                        "'" + field + "' belongs to the Lernbereich of this Teil, not to an exercise - it is ignored. Remove it to keep the file short."));
            }
        }
    }

    private void readTopicInterview(JsonNode node, Map<String, Object> data) {
        warnMovedFields(node, p.isEmpty() ? "" : p.substring(0, p.length() - 1));
        data.put("exampleProfile", optionalText(node, "exampleProfile", 300, "EXAMPLE_PROFILE"));
        List<Map<String, Object>> topics = new ArrayList<>();
        JsonNode array = node.get("topics");
        if (array == null || !array.isArray() || array.isEmpty()) {
            issues.add(error("TOPICS_MISSING", p + "topics", "topics must be a non-empty array with the example answers of the seven core topics: "
                    + String.join(", ", SpeakingSchema.CORE_TOPICS.keySet()) + "."));
        } else {
            Set<String> seen = new LinkedHashSet<>();
            Map<String, String> allowed = SpeakingSchema.allTopics();
            for (int i = 0; i < array.size(); i++) {
                JsonNode t = array.get(i);
                String path = p + "topics[" + i + "]";
                if (!t.isObject()) {
                    issues.add(error("TOPIC_NOT_OBJECT", path, "Each topic must be an object."));
                    continue;
                }
                warnMovedFields(t, path);
                String id = text(t, "id");
                if (id == null || !allowed.containsKey(id)) {
                    issues.add(error("TOPIC_ID_INVALID", path + ".id", "Topic id must be one of " + String.join(", ", allowed.keySet()) + " (found: " + id + ")."));
                    continue;
                }
                if (!seen.add(id)) {
                    issues.add(error("TOPIC_ID_DUPLICATE", path + ".id", "Topic id '" + id + "' is used more than once."));
                    continue;
                }
                Map<String, Object> topic = new LinkedHashMap<>();
                topic.put("id", id);
                topic.put("title", allowed.get(id));
                topic.put("exampleAnswers", stringList(t, "exampleAnswers", path, 1, 5, SpeakingSchema.MAX_TEXT, "TOPIC_EXAMPLES", true));
                topics.add(topic);
            }
            List<String> missing = SpeakingSchema.CORE_TOPICS.keySet().stream().filter(id -> !seen.contains(id)).toList();
            if (!missing.isEmpty()) {
                issues.add(error("CORE_TOPIC_MISSING", p + "topics", "Every Teil 1 exercise needs example answers for all seven core topics. Missing: " + String.join(", ", missing) + "."));
            }
        }
        data.put("topics", topics);
    }

    private void readOpinionDiscussion(JsonNode node, Map<String, Object> data) {
        warnMovedFields(node, p.isEmpty() ? "" : p.substring(0, p.length() - 1));
        Map<String, Object> person = new LinkedHashMap<>();
        JsonNode personNode = node.get("person");
        if (personNode == null || !personNode.isObject()) {
            issues.add(error("PERSON_MISSING", p + "person", "person (name, age, occupation) is required."));
        } else {
            String name = requiredText(personNode, "name", p + "person", 100, "PERSON_NAME");
            String occupation = requiredText(personNode, "occupation", p + "person", 100, "PERSON_OCCUPATION");
            Integer age = null;
            JsonNode ageNode = personNode.get("age");
            if (ageNode == null || !ageNode.isIntegralNumber() || ageNode.asInt() < 10 || ageNode.asInt() > 110) {
                issues.add(error("PERSON_AGE_INVALID", p + "person.age", "person.age must be a whole number between 10 and 110."));
            } else {
                age = ageNode.asInt();
            }
            person.put("name", name);
            person.put("age", age);
            person.put("occupation", occupation);
            String image = text(personNode, "image");
            if (image != null) {
                if (!IMAGE_REFERENCE.matcher(image).matches() || image.contains("..")) {
                    issues.add(error("IMAGE_REFERENCE_INVALID", p + "person.image",
                            "person.image must be an uploaded file path (/uploads/...) or an https:// URL without spaces (found: \"" + shorten(image) + "\")."));
                } else {
                    person.put("image", image);
                    String alt = text(personNode, "imageAlt");
                    if (alt == null) {
                        issues.add(error("IMAGE_ALT_MISSING", p + "person.imageAlt", "person.imageAlt (a German description of the portrait) is required when person.image is set."));
                    } else {
                        person.put("imageAlt", alt);
                        strings.add(alt);
                    }
                }
            }
            strings.add(name);
            strings.add(occupation);
        }
        data.put("person", person);

        String opinion = requiredText(node, "opinionText", p, SpeakingSchema.MAX_TEXT, "OPINION_TEXT");
        if (opinion != null) {
            int words = TextSimilarity.wordCount(opinion);
            if (words < 40 || words > 180) {
                issues.add(warning("OPINION_LENGTH", p + "opinionText", "opinionText has " + words + " words; the usual range is 40–180."));
            }
            if (!FIRST_PERSON.matcher(opinion).find()) {
                issues.add(warning("OPINION_NOT_FIRST_PERSON", p + "opinionText", "opinionText should be written in the first person (ich, mir, mein ...)."));
            }
            strings.add(opinion);
        }
        data.put("opinionText", opinion);
        data.put("preparationNotes", stringList(node, "preparationNotes", p, 0, 8, SpeakingSchema.MAX_LINE, "PREPARATION_NOTES", false));
        data.put("exampleResponse", optionalText(node, "exampleResponse", SpeakingSchema.MAX_TEXT, "EXAMPLE_RESPONSE"));
    }

    private void readJointPlanning(JsonNode node, Map<String, Object> data) {
        warnMovedFields(node, p.isEmpty() ? "" : p.substring(0, p.length() - 1));
        data.put("scenario", requiredText(node, "scenario", p, 1500, "SCENARIO"));

        List<Map<String, Object>> points = new ArrayList<>();
        JsonNode array = node.get("planningPoints");
        if (array == null || !array.isArray()) {
            issues.add(error("PLANNING_POINTS_MISSING", p + "planningPoints", "planningPoints must be an array of " + SpeakingSchema.MIN_PLANNING_POINTS + "–" + SpeakingSchema.MAX_PLANNING_POINTS + " points."));
        } else {
            if (array.size() < SpeakingSchema.MIN_PLANNING_POINTS || array.size() > SpeakingSchema.MAX_PLANNING_POINTS) {
                issues.add(error("PLANNING_POINTS_COUNT", p + "planningPoints", "Between " + SpeakingSchema.MIN_PLANNING_POINTS + " and "
                        + SpeakingSchema.MAX_PLANNING_POINTS + " planning points are required (found " + array.size() + ")."));
            }
            Set<String> titles = new LinkedHashSet<>();
            for (int i = 0; i < array.size(); i++) {
                JsonNode point = array.get(i);
                String path = p + "planningPoints[" + i + "]";
                String title = point.isTextual() ? point.asText().trim() : point.isObject() ? text(point, "title") : null;
                if (title == null || title.isEmpty()) {
                    issues.add(error("PLANNING_POINT_EMPTY", path + ".title", "Planning point " + (i + 1) + " needs a title (e.g. \"Wann?\")."));
                    continue;
                }
                if (title.length() > 120) issues.add(error("PLANNING_POINT_TOO_LONG", path + ".title", "A planning point title may be at most 120 characters."));
                if (!titles.add(TextSimilarity.normalize(title))) {
                    issues.add(error("PLANNING_POINT_DUPLICATE", path + ".title", "Planning point \"" + title + "\" appears more than once."));
                }
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("id", "point_" + (i + 1));
                entry.put("title", title);
                entry.put("hint", point.isObject() ? optionalText(point, "hint", SpeakingSchema.MAX_LINE, "PLANNING_HINT") : null);
                strings.add(title);
                points.add(entry);
            }
        }
        data.put("planningPoints", points);
        data.put("extraPhrases", stringList(node, "extraPhrases", p, 0, 8, SpeakingSchema.MAX_LINE, "EXTRA_PHRASES", false));
        data.put("decisionCriteria", stringList(node, "decisionCriteria", p, 0, SpeakingSchema.MAX_DECISION_CRITERIA, 250, "DECISION_CRITERIA", false));
        data.put("exampleDialogue", readDialogue(node));
    }

    private List<Map<String, Object>> readDialogue(JsonNode node) {
        JsonNode array = node.get("exampleDialogue");
        List<Map<String, Object>> turns = new ArrayList<>();
        if (array == null || array.isNull() || (array.isArray() && array.isEmpty())) return turns;
        if (!array.isArray()) {
            issues.add(error("DIALOGUE_INVALID", p + "exampleDialogue", "exampleDialogue must be an array of {speaker, text} turns (or be left out)."));
            return turns;
        }
        if (array.size() < SpeakingSchema.MIN_DIALOGUE_TURNS || array.size() > SpeakingSchema.MAX_DIALOGUE_TURNS) {
            issues.add(error("DIALOGUE_LENGTH", p + "exampleDialogue", "An example dialogue needs " + SpeakingSchema.MIN_DIALOGUE_TURNS + "–"
                    + SpeakingSchema.MAX_DIALOGUE_TURNS + " turns (found " + array.size() + ")."));
        }
        Set<String> speakers = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode turn = array.get(i);
            String path = p + "exampleDialogue[" + i + "]";
            String speaker = turn.isObject() ? text(turn, "speaker") : null;
            String line = turn.isObject() ? text(turn, "text") : null;
            if (speaker == null || !SpeakingSchema.SPEAKERS.contains(speaker.toUpperCase(Locale.ROOT))) {
                issues.add(error("DIALOGUE_SPEAKER_INVALID", path + ".speaker", "speaker must be A or B (found: " + speaker + ")."));
                continue;
            }
            if (line == null) {
                issues.add(error("DIALOGUE_TEXT_EMPTY", path + ".text", "Dialogue turn " + (i + 1) + " has no text."));
                continue;
            }
            if (line.length() > 600) issues.add(error("DIALOGUE_TEXT_TOO_LONG", path + ".text", "A dialogue turn may be at most 600 characters."));
            speakers.add(speaker.toUpperCase(Locale.ROOT));
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("speaker", speaker.toUpperCase(Locale.ROOT));
            entry.put("text", line);
            strings.add(line);
            turns.add(entry);
        }
        if (!turns.isEmpty() && speakers.size() < 2) {
            issues.add(error("DIALOGUE_ONE_SPEAKER", p + "exampleDialogue", "An example dialogue needs both speakers A and B."));
        }
        return turns;
    }

    // ------------------------------------------------------------------ Lernbereich (guide) of a Teil

    /**
     * Validates the shared learning content of one Teil: intro, tips, typical mistakes, the self-assessment checklist and the part-specific
     * questions / Redemittel (topics, goals or functions). Returns the normalised content; errors go to the issue list.
     */
    Map<String, Object> readGuide(int part, JsonNode node) {
        rejectTranslations(node, "$");
        Map<String, Object> data = new LinkedHashMap<>();
        String intro = requiredText(node, "intro", "", SpeakingSchema.MAX_TEXT, "INTRO");
        strings.add(intro);
        data.put("intro", intro);
        data.put("tips", readTitledTexts(node, "tips", 2, 8, "TIPS", true));
        data.put("steps", readTitledTexts(node, "steps", 0, 6, "STEPS", false));
        data.put("commonMistakes", stringList(node, "commonMistakes", "", 0, 8, SpeakingSchema.MAX_LINE, "COMMON_MISTAKES", false));
        data.put("selfAssessment", stringList(node, "selfAssessment", "", SpeakingSchema.MIN_SELF_ASSESSMENT, SpeakingSchema.MAX_SELF_ASSESSMENT, 250, "SELF_ASSESSMENT", true));
        switch (part) {
            case 1 -> readGuideTopics(node, data);
            case 2 -> readGuideGoals(node, data);
            default -> readGuideFunctions(node, data);
        }
        checkPlainText();
        return data;
    }

    private List<Map<String, Object>> readTitledTexts(JsonNode parent, String field, int min, int max, String code, boolean required) {
        List<Map<String, Object>> out = new ArrayList<>();
        JsonNode array = parent.get(field);
        if (array == null || array.isNull()) {
            if (required) issues.add(error(code + "_MISSING", field, field + " is required (" + min + "–" + max + " entries)."));
            return out;
        }
        if (!array.isArray()) {
            issues.add(error(code + "_INVALID", field, field + " must be an array of {title, text}."));
            return out;
        }
        for (int i = 0; i < array.size(); i++) {
            JsonNode entry = array.get(i);
            String title = entry.isObject() ? text(entry, "title") : null;
            String body = entry.isObject() ? text(entry, "text") : null;
            if (title == null || body == null) {
                issues.add(error(code + "_ENTRY_INVALID", field + "[" + i + "]", field + "[" + i + "] needs a title and a text."));
                continue;
            }
            if (title.length() > 150 || body.length() > 800) {
                issues.add(error(code + "_ENTRY_TOO_LONG", field + "[" + i + "]", field + "[" + i + "]: title max 150, text max 800 characters."));
            }
            strings.add(title);
            strings.add(body);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("title", title);
            m.put("text", body);
            out.add(m);
        }
        if (out.size() < min || out.size() > max) {
            issues.add(error(code + "_COUNT", field, field + " needs " + min + "–" + max + " entries (found " + out.size() + ")."));
        }
        return out;
    }

    private void readGuideTopics(JsonNode node, Map<String, Object> data) {
        List<Map<String, Object>> topics = new ArrayList<>();
        JsonNode array = node.get("topics");
        Map<String, String> allowed = SpeakingSchema.allTopics();
        Set<String> seen = new LinkedHashSet<>();
        if (array == null || !array.isArray() || array.isEmpty()) {
            issues.add(error("TOPICS_MISSING", "topics", "topics must cover the seven core topics: " + String.join(", ", SpeakingSchema.CORE_TOPICS.keySet()) + "."));
        } else {
            for (int i = 0; i < array.size(); i++) {
                JsonNode t = array.get(i);
                String path = "topics[" + i + "]";
                String id = t.isObject() ? text(t, "id") : null;
                if (id == null || !allowed.containsKey(id)) {
                    issues.add(error("TOPIC_ID_INVALID", path + ".id", "Topic id must be one of " + String.join(", ", allowed.keySet()) + " (found: " + id + ")."));
                    continue;
                }
                if (!seen.add(id)) {
                    issues.add(error("TOPIC_ID_DUPLICATE", path + ".id", "Topic id '" + id + "' is used more than once."));
                    continue;
                }
                Map<String, Object> topic = new LinkedHashMap<>();
                topic.put("id", id);
                topic.put("title", titleOr(t, allowed.get(id), path));
                List<String> questions = stringList(t, "questions", path, SpeakingSchema.MIN_TOPIC_QUESTIONS, SpeakingSchema.MAX_TOPIC_QUESTIONS, SpeakingSchema.MAX_LINE, "TOPIC_QUESTIONS", true);
                questions.stream().filter(q -> !q.endsWith("?")).forEach(q ->
                        issues.add(warning("QUESTION_FORMAT", path + ".questions", "A question should end with '?': \"" + shorten(q) + "\".")));
                topic.put("questions", questions);
                topic.put("followUpQuestions", stringList(t, "followUpQuestions", path, 1, SpeakingSchema.MAX_TOPIC_QUESTIONS, SpeakingSchema.MAX_LINE, "TOPIC_FOLLOW_UPS", true));
                topic.put("usefulPhrases", stringList(t, "usefulPhrases", path, SpeakingSchema.MIN_PHRASES, SpeakingSchema.MAX_PHRASES, SpeakingSchema.MAX_LINE, "TOPIC_PHRASES", true));
                topic.put("tip", optionalText(t, "tip", SpeakingSchema.MAX_LINE, "TOPIC_TIP"));
                topics.add(topic);
            }
            List<String> missing = SpeakingSchema.CORE_TOPICS.keySet().stream().filter(id -> !seen.contains(id)).toList();
            if (!missing.isEmpty()) issues.add(error("CORE_TOPIC_MISSING", "topics", "The guide needs all seven core topics. Missing: " + String.join(", ", missing) + "."));
        }
        data.put("topics", topics);
        data.put("usefulPhrases", stringList(node, "usefulPhrases", "", 0, SpeakingSchema.MAX_PHRASES, SpeakingSchema.MAX_LINE, "PHRASES", false));
    }

    private void readGuideGoals(JsonNode node, Map<String, Object> data) {
        List<Map<String, Object>> goals = new ArrayList<>();
        JsonNode array = node.get("goals");
        Set<String> seen = new LinkedHashSet<>();
        if (array == null || !array.isArray() || array.isEmpty()) {
            issues.add(error("GOALS_MISSING", "goals", "goals must contain the four goals: " + String.join(", ", SpeakingSchema.GOALS.keySet()) + "."));
        } else {
            for (int i = 0; i < array.size(); i++) {
                JsonNode g = array.get(i);
                String path = "goals[" + i + "]";
                String id = g.isObject() ? text(g, "id") : null;
                if (id == null || !SpeakingSchema.GOALS.containsKey(id)) {
                    issues.add(error("GOAL_ID_INVALID", path + ".id", "Goal id must be one of " + String.join(", ", SpeakingSchema.GOALS.keySet()) + " (found: " + id + ")."));
                    continue;
                }
                if (!seen.add(id)) {
                    issues.add(error("GOAL_ID_DUPLICATE", path + ".id", "Goal id '" + id + "' is used more than once."));
                    continue;
                }
                Map<String, Object> goal = new LinkedHashMap<>();
                goal.put("id", id);
                goal.put("title", titleOr(g, SpeakingSchema.GOALS.get(id), path));
                goal.put("description", requiredText(g, "description", path, 500, "GOAL_DESCRIPTION"));
                goal.put("usefulPhrases", stringList(g, "usefulPhrases", path, SpeakingSchema.MIN_GOAL_PHRASES, SpeakingSchema.MAX_PHRASES, SpeakingSchema.MAX_LINE, "GOAL_PHRASES", true));
                goal.put("tip", optionalText(g, "tip", SpeakingSchema.MAX_LINE, "GOAL_TIP"));
                goals.add(goal);
            }
            List<String> missing = SpeakingSchema.GOALS.keySet().stream().filter(id -> !seen.contains(id)).toList();
            if (!missing.isEmpty()) issues.add(error("GOAL_MISSING", "goals", "All four goals are required. Missing: " + String.join(", ", missing) + "."));
        }
        data.put("goals", goals);
    }

    private void readGuideFunctions(JsonNode node, Map<String, Object> data) {
        List<Map<String, Object>> groups = new ArrayList<>();
        JsonNode array = node.get("functions");
        Set<String> seen = new LinkedHashSet<>();
        if (array == null || !array.isArray() || array.isEmpty()) {
            issues.add(error("FUNCTIONS_MISSING", "functions", "functions must contain one group per function: " + String.join(", ", SpeakingSchema.FUNCTIONS.keySet()) + "."));
        } else {
            for (int i = 0; i < array.size(); i++) {
                JsonNode g = array.get(i);
                String path = "functions[" + i + "]";
                String function = g.isObject() ? text(g, "function") : null;
                if (function == null || !SpeakingSchema.FUNCTIONS.containsKey(function)) {
                    issues.add(error("FUNCTION_INVALID", path + ".function", "function must be one of " + String.join(", ", SpeakingSchema.FUNCTIONS.keySet()) + " (found: " + function + ")."));
                    continue;
                }
                if (!seen.add(function)) {
                    issues.add(error("FUNCTION_DUPLICATE", path + ".function", "function '" + function + "' is used more than once."));
                    continue;
                }
                Map<String, Object> group = new LinkedHashMap<>();
                group.put("function", function);
                group.put("title", titleOr(g, SpeakingSchema.FUNCTIONS.get(function), path));
                group.put("usefulPhrases", stringList(g, "usefulPhrases", path, SpeakingSchema.MIN_FUNCTION_PHRASES, SpeakingSchema.MAX_PHRASES, SpeakingSchema.MAX_LINE, "FUNCTION_PHRASES", true));
                group.put("tip", optionalText(g, "tip", SpeakingSchema.MAX_LINE, "FUNCTION_TIP"));
                groups.add(group);
            }
            List<String> missing = SpeakingSchema.FUNCTIONS.keySet().stream().filter(f -> !seen.contains(f)).toList();
            if (!missing.isEmpty()) issues.add(error("FUNCTION_MISSING", "functions", "A group is required for every function. Missing: " + String.join(", ", missing) + "."));
        }
        data.put("functions", groups);
        data.put("decisionCriteria", stringList(node, "decisionCriteria", "", SpeakingSchema.MIN_DECISION_CRITERIA, SpeakingSchema.MAX_DECISION_CRITERIA, 250, "DECISION_CRITERIA", true));
    }

    // ------------------------------------------------------------------ helpers

    private String titleOr(JsonNode node, String fallback, String path) {
        String title = text(node, "title");
        if (title == null) return fallback;
        if (title.length() > 150) issues.add(error("TITLE_TOO_LONG", path + ".title", "title may be at most 150 characters."));
        strings.add(title);
        return title;
    }

    private String requiredText(JsonNode node, String field, String path, int max, String code) {
        String value = text(node, field);
        String where = join(path, field);
        if (value == null) {
            issues.add(error(code + "_MISSING", where, field + " must not be empty."));
        } else if (value.length() > max) {
            issues.add(error(code + "_TOO_LONG", where, field + " may be at most " + max + " characters."));
        }
        return value;
    }

    private String optionalText(JsonNode node, String field, int max, String code) {
        JsonNode raw = node.get(field);
        if (raw != null && !raw.isNull() && !raw.isTextual()) {
            issues.add(error(code + "_INVALID", p + field, field + " must be a plain German string."));
            return null;
        }
        String value = text(node, field);
        if (value != null && value.length() > max) {
            issues.add(error(code + "_TOO_LONG", p + field, field + " may be at most " + max + " characters."));
        }
        if (value != null) strings.add(value);
        return value;
    }

    /** A list of plain German strings. Objects instead of strings (e.g. {"de": ..., "en": ...}) are rejected with a clear message. */
    private List<String> stringList(JsonNode parent, String field, String path, int min, int max, int maxLength, String code, boolean required) {
        List<String> values = new ArrayList<>();
        JsonNode array = parent.get(field);
        String where = join(path, field);
        if (array == null || array.isNull()) {
            if (required || min > 0) issues.add(error(code + "_MISSING", where, field + " is required (" + min + "–" + max + " entries)."));
            return values;
        }
        if (!array.isArray()) {
            issues.add(error(code + "_INVALID", where, field + " must be an array of German strings."));
            return values;
        }
        Set<String> seen = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode entry = array.get(i);
            if (!entry.isTextual()) {
                issues.add(error("NOT_A_STRING", where + "[" + i + "]", field + "[" + i + "] must be a plain German string"
                        + (entry.isObject() ? " (objects with translations are not allowed)." : ".")));
                continue;
            }
            String value = entry.asText().trim();
            if (value.isEmpty()) {
                issues.add(error(code + "_EMPTY", where + "[" + i + "]", field + "[" + i + "] is empty."));
                continue;
            }
            if (value.length() > maxLength) {
                issues.add(error(code + "_TOO_LONG", where + "[" + i + "]", field + "[" + i + "] is too long (max " + maxLength + " characters)."));
            }
            if (!seen.add(TextSimilarity.normalize(value))) {
                issues.add(warning(code + "_DUPLICATE", where + "[" + i + "]", "\"" + shorten(value) + "\" appears more than once in " + field + "."));
            }
            values.add(value);
            strings.add(value);
        }
        if (values.size() < min || values.size() > max) {
            issues.add(error(code + "_COUNT", where, field + " needs " + min + "–" + max + " entries (found " + values.size() + ")."));
        }
        return values;
    }

    /** Rejects translation keys anywhere in the exercise: speaking content is German only. */
    private void rejectTranslations(JsonNode node, String path) {
        if (node.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                String child = path + "." + field.getKey();
                if (SpeakingSchema.FORBIDDEN_KEYS.contains(field.getKey().toLowerCase(Locale.ROOT))) {
                    issues.add(error("TRANSLATION_NOT_ALLOWED", child, "Speaking content is German only - remove the '" + field.getKey()
                            + "' field (no English or Persian translations)."));
                } else {
                    rejectTranslations(field.getValue(), child);
                }
            }
        } else if (node.isArray()) {
            for (int i = 0; i < node.size(); i++) rejectTranslations(node.get(i), path + "[" + i + "]");
        }
    }

    private void checkPlainText() {
        for (String value : strings) {
            if (value == null) continue;
            if (MARKUP.matcher(value).find()) {
                issues.add(error("HTML_CONTENT", p.isEmpty() ? "$" : p.substring(0, p.length() - 1),
                        "Content must be plain text — HTML/script was found in: \"" + shorten(value) + "\"."));
                return;
            }
        }
        for (String value : strings) {
            if (value != null && ARABIC_SCRIPT.matcher(value).find()) {
                issues.add(error("NON_GERMAN_TEXT", p.isEmpty() ? "$" : p.substring(0, p.length() - 1),
                        "Speaking content must be German - Arabic/Persian script was found in: \"" + shorten(value) + "\"."));
                return;
            }
        }
    }

    private static String join(String path, String field) {
        return path.isEmpty() || path.endsWith(".") ? path + field : path + "." + field;
    }

    private static String shorten(String value) {
        return value.length() > 60 ? value.substring(0, 60) + "…" : value;
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.isObject()) return null;
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) return null;
        if (!value.isValueNode()) return null;
        String s = value.asText();
        return s == null || s.isBlank() ? null : s.trim();
    }
}
