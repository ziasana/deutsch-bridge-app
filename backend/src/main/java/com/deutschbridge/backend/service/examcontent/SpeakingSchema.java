package com.deutschbridge.backend.service.examcontent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * The one definition of the Mündlicher Ausdruck import schema: the allowed ids, their default German titles, the size limits and the
 * example JSON. {@link ExamSpeakingReader} validates against it and {@link ExamContentPromptBuilder} prints it into the admin prompt,
 * so the schema an AI is told to produce and the schema the importer accepts cannot drift apart.
 *
 * All learning content is German-only: there are deliberately no translation fields (no "en" / "fa") anywhere in this schema.
 */
public final class SpeakingSchema {

    private SpeakingSchema() {
    }

    // ---- Teil 1: topics

    /** The seven topics of TELC B1 Teil 1 - every exercise must contain all of them. */
    public static final Map<String, String> CORE_TOPICS = orderedMap(
            "name", "Name",
            "herkunft", "Woher Sie kommen",
            "wohnen", "Wie Sie wohnen",
            "familie", "Familie",
            "deutsch_gelernt", "Wo Sie Deutsch gelernt haben",
            "beruf", "Was Sie machen (Schule, Studium, Beruf)",
            "sprachen", "Sprachen");
    /** Additional topics an exercise may contain. */
    public static final Map<String, String> OPTIONAL_TOPICS = orderedMap(
            "wochenende", "Wochenende",
            "hobbys", "Hobbys");

    // ---- Teil 2: the four communication goals

    public static final Map<String, String> GOALS = orderedMap(
            "REPORT_OPINION", "Die Meinung der Person wiedergeben",
            "EXPRESS_OWN_OPINION", "Die eigene Meinung sagen",
            "DESCRIBE_EXPERIENCE", "Eigene Erfahrungen erzählen",
            "REACT_TO_PARTNER", "Auf die Meinung des Partners reagieren");

    // ---- Teil 3: conversational functions

    public static final Map<String, String> FUNCTIONS = orderedMap(
            "SUGGEST", "Vorschläge machen",
            "GIVE_REASON", "Begründen",
            "AGREE", "Zustimmen",
            "DISAGREE", "Höflich widersprechen",
            "NEGOTIATE", "Alternativen anbieten und aushandeln",
            "DECIDE", "Eine gemeinsame Entscheidung treffen");

    public static final Set<String> SPEAKERS = Set.of("A", "B");

    // ---- limits

    public static final int MIN_SELF_ASSESSMENT = 3;
    public static final int MAX_SELF_ASSESSMENT = 8;
    public static final int MIN_PHRASES = 2;
    public static final int MAX_PHRASES = 12;
    public static final int MIN_GOAL_PHRASES = 3;
    public static final int MIN_FUNCTION_PHRASES = 3;
    public static final int MIN_TOPIC_QUESTIONS = 2;
    public static final int MAX_TOPIC_QUESTIONS = 8;
    public static final int MIN_PLANNING_POINTS = 4;
    public static final int MAX_PLANNING_POINTS = 10;
    public static final int MIN_DIALOGUE_TURNS = 4;
    public static final int MAX_DIALOGUE_TURNS = 30;
    public static final int MIN_DECISION_CRITERIA = 2;
    public static final int MAX_DECISION_CRITERIA = 6;
    public static final int MAX_LINE = 400;
    public static final int MAX_TEXT = 2500;

    /** Keys that would introduce a translation; they are rejected anywhere in a speaking exercise. */
    public static final Set<String> FORBIDDEN_KEYS = Set.of("en", "fa", "english", "persian", "farsi", "translation", "translations");

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static Map<String, String> orderedMap(String... keysAndValues) {
        Map<String, String> map = new LinkedHashMap<>();
        for (int i = 0; i < keysAndValues.length; i += 2) map.put(keysAndValues[i], keysAndValues[i + 1]);
        return java.util.Collections.unmodifiableMap(map);
    }

    /** The task type name of a speaking part (TOPIC_INTERVIEW, OPINION_DISCUSSION, JOINT_PLANNING). */
    public static String taskTypeOf(ExamContentSpec spec) {
        return spec.taskType().name();
    }

    /**
     * Part-specific fields of the example exercise (everything after externalId / title / instructions), in the exact shape the importer
     * accepts. An exercise only carries what is specific to it; questions, Redemittel and tips live in the Lernbereich of the Teil
     * (see {@link #putGuideExample}). Placeholders are "..." exactly like the other prompt examples.
     */
    public static void putExample(ObjectNode ex, ExamContentSpec spec, String difficulty) {
        ex.put("taskType", taskTypeOf(spec));
        switch (spec.part()) {
            case 1 -> {
                ex.put("topic", "Sich kennenlernen");
                ex.put("exampleProfile", "...");
                ArrayNode topics = ex.putArray("topics");
                for (String id : allTopics().keySet()) {
                    ObjectNode topic = topics.addObject();
                    topic.put("id", id);
                    topic.putArray("exampleAnswers").add("...");
                }
            }
            case 2 -> {
                ex.put("topic", "...");
                ObjectNode person = ex.putObject("person");
                person.put("name", "...").put("age", 33).put("occupation", "...");
                person.put("image", "").put("imageAlt", "");
                ex.put("opinionText", "...");
                ex.putArray("preparationNotes").add("...");
                ex.put("exampleResponse", "...");
            }
            default -> {
                ex.put("topic", "...");
                ex.put("scenario", "...");
                ex.put("image", "").put("imageAlt", "");
                ArrayNode points = ex.putArray("planningPoints");
                points.addObject().put("title", "Wann?").put("hint", "...");
                points.addObject().put("title", "Wo?");
                points.addObject().put("title", "...");
                points.addObject().put("title", "...");
                ex.putArray("extraPhrases").add("...");
                ex.putArray("decisionCriteria").add("...");
                ArrayNode dialogue = ex.putArray("exampleDialogue");
                dialogue.addObject().put("speaker", "A").put("text", "...");
                dialogue.addObject().put("speaker", "B").put("text", "...");
                dialogue.addObject().put("speaker", "A").put("text", "...");
                dialogue.addObject().put("speaker", "B").put("text", "...");
            }
        }
        ObjectNode meta = ex.putObject("metadata");
        meta.put("difficulty", difficulty);
        meta.putArray("topics").add("FREE_TIME");
        meta.putArray("tags").add("...");
        meta.put("source", "AI_IMPORTED");
    }

    /** The shape of the Lernbereich (guide) content of a Teil, as documented for the admin editor. */
    public static ObjectNode putGuideExample(ObjectNode g, int part) {
        g.put("intro", "...");
        g.putArray("tips").add(MAPPER.createObjectNode().put("title", "...").put("text", "...")).add(MAPPER.createObjectNode().put("title", "...").put("text", "..."));
        g.putArray("steps").add(MAPPER.createObjectNode().put("title", "...").put("text", "..."));
        g.putArray("commonMistakes").add("...");
        g.putArray("selfAssessment").add("...").add("...").add("...");
        switch (part) {
            case 1 -> {
                ArrayNode topics = g.putArray("topics");
                for (Map.Entry<String, String> t : allTopics().entrySet()) {
                    ObjectNode topic = topics.addObject();
                    topic.put("id", t.getKey()).put("title", t.getValue());
                    topic.putArray("questions").add("...?").add("...?");
                    topic.putArray("followUpQuestions").add("...?");
                    topic.putArray("usefulPhrases").add("...").add("...");
                    topic.put("tip", "...");
                }
                g.putArray("usefulPhrases").add("...");
            }
            case 2 -> {
                ArrayNode goals = g.putArray("goals");
                for (Map.Entry<String, String> e : GOALS.entrySet()) {
                    ObjectNode goal = goals.addObject();
                    goal.put("id", e.getKey()).put("title", e.getValue()).put("description", "...");
                    goal.putArray("usefulPhrases").add("...").add("...").add("...");
                    goal.put("tip", "...");
                }
            }
            default -> {
                ArrayNode groups = g.putArray("functions");
                for (Map.Entry<String, String> e : FUNCTIONS.entrySet()) {
                    ObjectNode group = groups.addObject();
                    group.put("function", e.getKey()).put("title", e.getValue());
                    group.putArray("usefulPhrases").add("...").add("...").add("...");
                    group.put("tip", "...");
                }
                g.putArray("decisionCriteria").add("...").add("...");
            }
        }
        return g;
    }

    public static Map<String, String> allTopics() {
        Map<String, String> all = new LinkedHashMap<>(CORE_TOPICS);
        all.putAll(OPTIONAL_TOPICS);
        return all;
    }

    /** For tests and docs: the example as a standalone object. */
    public static ObjectNode example(ExamContentSpec spec) {
        ObjectNode ex = MAPPER.createObjectNode();
        putExample(ex, spec, "MEDIUM");
        return ex;
    }

    public static List<String> goalIds() {
        return List.copyOf(GOALS.keySet());
    }
}
