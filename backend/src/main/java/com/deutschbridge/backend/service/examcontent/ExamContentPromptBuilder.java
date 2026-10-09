package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.PromptRequest;
import com.deutschbridge.backend.model.dto.ExamContentDtos.PromptResponse;
import com.deutschbridge.backend.model.enums.ExamType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Builds the copy-paste prompt an admin gives to any AI (Claude, ChatGPT, Gemini ...). The prompt is a
 * versioned content specification: the template file carries the rules, this class only fills in the
 * counts, difficulty/topic mix and the JSON structure for the chosen {@link ExamContentSpec}.
 */
public class ExamContentPromptBuilder {

    public static final List<String> TOPICS = List.of(
            "EVERYDAY_LIFE", "WORK", "HOUSING", "HEALTH", "LEISURE", "TRAVEL", "EDUCATION", "ENVIRONMENT", "GARDEN_NATURE", "SOCIETY",
            "SERVICES", "FAMILY", "TECHNOLOGY", "MEDIA", "FOOD", "TRAFFIC", "CONSUMPTION", "CLUBS", "GENERATIONS", "CITY_LIFE");
    public static final List<String> TEXT_TYPES = List.of("EMAIL", "NACHRICHT", "BRIEF", "PERSOENLICHER_BERICHT", "INFORMATIONSTEXT");
    public static final List<String> GRAMMAR_CATEGORIES = List.of(
            "KONJUNKTION", "ADVERBIEN_KONNEKTOREN", "ARTIKEL", "KASUS", "PRAEPOSITION", "VERBFORM", "ADJEKTIVENDUNG",
            "PERSONALPRONOMEN", "RELATIVPRONOMEN", "POSSESSIVARTIKEL", "VERB_PRAEPOSITION", "SATZSTRUKTUR");
    public static final List<String> WORD_CATEGORIES = List.of(
            "PRAEPOSITIONEN", "KONJUNKTIONEN", "KONNEKTOREN", "PRONOMEN", "FRAGEWOERTER", "FUNKTIONSWOERTER");
    public static final List<String> SCENARIO_TYPES = List.of("RANDOM", "STANDARD_EMAIL", "ALTERNATIVE_EMAIL");
    public static final List<String> RELATIONSHIPS = List.of("FRIEND", "FAMILY", "ACQUAINTANCE", "COURSE_COLLEAGUE", "COLLEAGUE", "ORGANIZATION");
    public static final List<String> COMMUNICATION_TYPES = List.of("INFORMAL_EMAIL", "SEMI_FORMAL_EMAIL", "FORMAL_EMAIL");
    public static final List<String> CONTEXT_MODES = List.of("RANDOM", "WITH_ADVERTISEMENT", "WITHOUT_ADVERTISEMENT");
    public static final List<String> DIFFICULTIES = List.of("MIXED", "EASY", "MEDIUM", "HARD");
    public static final int MAX_COUNT = 50;

    /** Rules shared by the three Mündlicher Ausdruck templates (language, quality, output); included as {{SPEAKING_COMMON}}. */
    static final String SPEAKING_COMMON_TEMPLATE = "exam-content/prompts/muendlicher-ausdruck-common.v1.0.txt";

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public PromptResponse build(ExamContentSpec spec, PromptRequest request, int existingCount, int firstNumber) {
        return build(spec, request, existingCount, firstNumber, List.of());
    }

    /** {@code existingSummaries}: one line per task already in the library (writing tasks), so the AI does not repeat them. */
    public PromptResponse build(ExamContentSpec spec, PromptRequest request, int existingCount, int firstNumber,
                                List<String> existingSummaries) {
        int count = request.count() == null ? 10 : request.count();
        if (count < 1 || count > MAX_COUNT) {
            throw new IllegalArgumentException("count must be between 1 and " + MAX_COUNT);
        }
        String difficulty = request.difficulty() == null || request.difficulty().isBlank()
                ? "MIXED" : request.difficulty().trim().toUpperCase(Locale.ROOT);
        if (!DIFFICULTIES.contains(difficulty)) {
            throw new IllegalArgumentException("Unknown difficulty: " + request.difficulty());
        }
        List<String> topics = request.topics() == null ? List.of() : request.topics().stream()
                .map(t -> t.trim().toUpperCase(Locale.ROOT)).distinct().toList();
        for (String topic : topics) {
            if (!TOPICS.contains(topic)) throw new IllegalArgumentException("Unknown topic: " + topic);
        }

        String firstId = spec.externalIdPrefix() + String.format("%03d", firstNumber);
        String example = jsonExample(spec, firstId, difficulty.equals("MIXED") ? "MEDIUM" : difficulty);

        Map<String, String> values = new java.util.LinkedHashMap<>();
        values.put("EXAM_NAME", spec.examType() == ExamType.TELC ? "TELC" : spec.examType().getValue());
        values.put("LEVEL", spec.level().getValue());
        values.put("SECTION_LABEL", ExamContentTokens.sectionLabel(spec.section()));
        values.put("PART_LABEL", "Teil " + spec.part());
        values.put("HEADING_COUNT", String.valueOf(spec.headingCount()));
        values.put("TEXT_COUNT", String.valueOf(spec.textCount()));
        values.put("UNUSED_COUNT", String.valueOf(spec.unusedHeadingCount()));
        values.put("HEADING_IDS", String.join(", ", spec.headingIds()));
        values.put("TEXT_IDS", String.join(", ", spec.textIds()));
        values.put("MIN_WORDS", String.valueOf(spec.minWords()));
        values.put("MAX_WORDS", String.valueOf(spec.maxWords()));
        values.put("QUESTION_COUNT", String.valueOf(spec.questionCount()));
        values.put("UNUSED_WORD_COUNT", String.valueOf(spec.unusedWordCount()));
        values.put("OPTION_COUNT", String.valueOf(spec.optionCount()));
        values.put("OPTION_IDS", String.join(", ", spec.optionIds()));
        values.put("FIRST_QUESTION_NUMBER", String.valueOf(spec.firstQuestionNumber()));
        values.put("LAST_QUESTION_NUMBER", String.valueOf(spec.lastQuestionNumber()));
        String textType = request.textType() == null || request.textType().isBlank() ? null : request.textType().trim().toUpperCase(Locale.ROOT);
        if (textType != null && !TEXT_TYPES.contains(textType)) throw new IllegalArgumentException("Unknown text type: " + request.textType());
        List<String> grammar = request.grammarCategories() == null ? List.of() : request.grammarCategories().stream()
                .map(c -> c.trim().toUpperCase(Locale.ROOT)).distinct().toList();
        for (String category : grammar) {
            if (!GRAMMAR_CATEGORIES.contains(category)) throw new IllegalArgumentException("Unknown grammar category: " + category);
        }
        if (!grammar.isEmpty() && grammar.size() < 5 && spec.isGapText()) {
            throw new IllegalArgumentException("Select at least 5 grammar categories (or none for all) so the ten gaps can be varied.");
        }
        String contextMode = request.contextMode() == null || request.contextMode().isBlank() ? "RANDOM" : request.contextMode().trim().toUpperCase(Locale.ROOT);
        if (!CONTEXT_MODES.contains(contextMode)) throw new IllegalArgumentException("Unknown context mode: " + request.contextMode());
        List<String> wordCategories = request.wordCategories() == null ? List.of() : request.wordCategories().stream()
                .map(c -> c.trim().toUpperCase(Locale.ROOT)).distinct().toList();
        for (String category : wordCategories) {
            if (!WORD_CATEGORIES.contains(category)) throw new IllegalArgumentException("Unknown word category: " + category);
        }
        if (!wordCategories.isEmpty() && wordCategories.size() < 3 && spec.isWordBank()) {
            throw new IllegalArgumentException("Select at least 3 word categories (or none for all) so the word bank can be varied.");
        }
        boolean includeVisuals = request.includeVisuals() == null || request.includeVisuals();
        String scenario = token(request.scenarioType(), "RANDOM", SCENARIO_TYPES, "scenario type");
        String relationship = token(request.relationship(), null, RELATIONSHIPS, "relationship");
        String communication = token(request.communicationType(), null, COMMUNICATION_TYPES, "communication type");
        if (spec.isWriting()) checkWritingStyle(relationship, communication);
        values.put("INSTRUCTIONS", spec.defaultInstructions());
        values.put("WRITING_GUIDANCE", ExamContentSpecs.WRITING_GUIDANCE);
        values.put("TASK_TYPE", SpeakingSchema.taskTypeOf(spec));
        values.put("CORE_TOPIC_IDS", String.join(", ", SpeakingSchema.CORE_TOPICS.keySet()));
        values.put("OPTIONAL_TOPIC_IDS", String.join(", ", SpeakingSchema.OPTIONAL_TOPICS.keySet()));
        values.put("GOAL_IDS", String.join(", ", SpeakingSchema.GOALS.keySet()));
        values.put("FUNCTION_IDS", String.join(", ", SpeakingSchema.FUNCTIONS.keySet()));
        values.put("MIN_PLANNING_POINTS", String.valueOf(SpeakingSchema.MIN_PLANNING_POINTS));
        values.put("MAX_PLANNING_POINTS", String.valueOf(SpeakingSchema.MAX_PLANNING_POINTS));
        values.put("REQUEST_BLOCK", requestBlock(spec, count, difficulty, topics, firstId, includeVisuals, textType, grammar, contextMode, wordCategories)
                + (spec.isWriting() ? writingBlock(scenario, relationship, communication, existingSummaries) : "")
                + (spec.isSpeaking() ? speakingBlock(spec, existingSummaries) : ""));
        values.put("VISUAL_RULES", visualRules(includeVisuals));
        values.put("JSON_EXAMPLE", example);
        values.put("NOTES_BLOCK", request.notes() == null || request.notes().isBlank() ? ""
                : "\nADDITIONAL INSTRUCTIONS FROM THE EDITOR:\n" + request.notes().strip());

        String prompt = loadTemplate(spec.promptTemplate());
        if (prompt.contains("{{SPEAKING_COMMON}}")) prompt = prompt.replace("{{SPEAKING_COMMON}}", loadTemplate(SPEAKING_COMMON_TEMPLATE));
        for (Map.Entry<String, String> e : values.entrySet()) {
            prompt = prompt.replace("{{" + e.getKey() + "}}", e.getValue());
        }
        return new PromptResponse(prompt.strip() + "\n", spec.promptVersion(), ExamContentSpecs.SCHEMA_VERSION, example, existingCount, firstId);
    }

    private String requestBlock(ExamContentSpec spec, int count, String difficulty, List<String> topics, String firstId, boolean includeVisuals,
                                String textType, List<String> grammar, String contextMode, List<String> wordCategories) {
        StringBuilder b = new StringBuilder();
        b.append("Generate exactly ").append(count).append(" exercise set").append(count == 1 ? "" : "s").append(".\n");
        b.append("Number the externalId values consecutively starting with ").append(firstId)
                .append(" (e.g. ").append(firstId).append(", then the following numbers).\n\n");

        if (difficulty.equals("MIXED")) {
            int easy = (int) Math.round(count * 0.2);
            int hard = (int) Math.round(count * 0.2);
            int medium = count - easy - hard;
            b.append("Difficulty (mixed): approximately ").append(easy).append(" EASY, ").append(medium).append(" MEDIUM, ")
                    .append(hard).append(" HARD. Set metadata.difficulty accordingly.\n");
        } else {
            b.append("Difficulty: all exercises ").append(difficulty).append(". Set metadata.difficulty to ").append(difficulty).append(".\n");
        }

        if (topics.isEmpty()) {
            b.append("Topics: choose a varied, balanced mix of everyday topics across the exercises.\n");
        } else {
            b.append(spec.isMultipleChoice() || spec.isWriting() || spec.isSpeaking()
                    ? "Topics: spread the exercises across the following topics (every exercise needs one clear central topic of its own):\n"
                    : "Topics: spread the exercises across the following topics (each exercise's five texts may touch related sub-topics):\n");
            int base = count / topics.size();
            int remainder = count % topics.size();
            for (int i = 0; i < topics.size(); i++) {
                int n = base + (i < remainder ? 1 : 0);
                b.append("- approximately ").append(n).append(" ").append(topics.get(i)).append("\n");
            }
            b.append("List the main topics of each exercise in metadata.topics.\n");
        }
        if (spec.isWordBank()) {
            b.append(switch (contextMode) {
                case "WITH_ADVERTISEMENT" -> "Context material: every exercise starts with an advertisement or information box (\"context\") that the main text refers to.\n";
                case "WITHOUT_ADVERTISEMENT" -> "Context material: do NOT include any context material; omit the \"context\" object and set contextType to a plain text type (EMAIL, LETTER, INQUIRY ...).\n";
                default -> "Context material: about half of the exercises have an advertisement / information box (\"context\") that the main text refers to; the others have none (omit \"context\").\n";
            });
            b.append(wordCategories.isEmpty()
                    ? "Word bank: use a balanced mix of prepositions, conjunctions, connectors, pronouns, question words and other common function words.\n"
                    : "Word bank: build the word banks mainly from these kinds of words: " + String.join(", ", wordCategories) + ".\n");
        }
        if (spec.isGapText()) {
            b.append(textType == null
                    ? "Text type: vary the text type between the exercises (EMAIL, NACHRICHT, BRIEF, PERSOENLICHER_BERICHT, INFORMATIONSTEXT); set \"textType\" accordingly.\n"
                    : "Text type: all exercises are of the type " + textType + "; set \"textType\" to " + textType + ".\n");
            b.append(grammar.isEmpty()
                    ? "Grammar categories: use a varied mix of all categories listed below.\n"
                    : "Grammar categories: test ONLY these categories (still a varied mix, no category more than 3 times per exercise): " + String.join(", ", grammar) + ".\n");
        }
        if (spec.isSituationMatching()) {
            b.append(includeVisuals
                    ? "Visual briefs: include them (visual.hasImage / imageType / imagePrompt / altText) for advertisements that benefit from a picture.\n"
                    : "Visual briefs: do not include any; set visual.hasImage to false and imageType to NONE in every advertisement.\n");
        }
        b.append("\nThe top-level fields exam, level, section and part describe the whole file: ")
                .append(spec.examType().name()).append(", ").append(spec.level().getValue()).append(", ")
                .append(ExamContentTokens.sectionToken(spec.section())).append(", ").append(ExamContentTokens.partToken(spec.part())).append(".");
        return b.toString();
    }

    private static String token(String raw, String fallback, List<String> allowed, String what) {
        if (raw == null || raw.isBlank()) return fallback;
        String value = raw.trim().toUpperCase(Locale.ROOT);
        if (!allowed.contains(value)) throw new IllegalArgumentException("Unknown " + what + ": " + raw);
        return value;
    }

    /** Rejects combinations the importer would reject later anyway, so the admin finds out before asking an AI. */
    private static void checkWritingStyle(String relationship, String communication) {
        if (relationship == null || communication == null) return;
        if (Set.of("FRIEND", "FAMILY", "COURSE_COLLEAGUE").contains(relationship) && communication.equals("FORMAL_EMAIL")) {
            throw new IllegalArgumentException(relationship + " cannot be combined with FORMAL_EMAIL — choose INFORMAL_EMAIL or another relationship.");
        }
        if (relationship.equals("ORGANIZATION") && communication.equals("INFORMAL_EMAIL")) {
            throw new IllegalArgumentException("ORGANIZATION cannot be combined with INFORMAL_EMAIL — choose SEMI_FORMAL_EMAIL or FORMAL_EMAIL.");
        }
    }

    private String writingBlock(String scenario, String relationship, String communication, List<String> existing) {
        StringBuilder b = new StringBuilder("\n\nWRITING TASK CONFIGURATION\n");
        b.append(switch (scenario) {
            case "STANDARD_EMAIL" -> "Scenario type: STANDARD_EMAIL for every task - the classic situation: a friend (or similar) writes to the learner and asks for a reply. "
                    + "Set scenarioType to STANDARD_EMAIL.\n";
            case "ALTERNATIVE_EMAIL" -> "Scenario type: ALTERNATIVE_EMAIL for every task - another realistic everyday situation with the same TELC writing structure "
                    + "(for example a birthday invitation, a weekend trip, helping with a move, a language course, a sport or hobby, a family visit, an appointment, an event, accommodation). "
                    + "Set scenarioType to ALTERNATIVE_EMAIL.\n";
            default -> "Scenario type: RANDOM - choose a fitting B1 situation for every task. Use roughly half STANDARD_EMAIL (a friend visits / asks for advice) and half "
                    + "ALTERNATIVE_EMAIL (another everyday situation such as an invitation, trip, move, course, hobby or event), and write the concrete value you chose "
                    + "(STANDARD_EMAIL or ALTERNATIVE_EMAIL, never RANDOM) into scenarioType.\n";
        });
        b.append(relationship == null
                ? "Relationship: choose the sender's relationship to the learner (FRIEND, FAMILY, ACQUAINTANCE, COURSE_COLLEAGUE, COLLEAGUE, ORGANIZATION) so that it fits the situation, and vary it across the tasks.\n"
                : "Relationship: " + relationship + " for every task.\n");
        b.append(communication == null
                ? "Communication type: choose the style that fits the relationship (FRIEND / FAMILY / COURSE_COLLEAGUE -> INFORMAL_EMAIL with du; COLLEAGUE / ACQUAINTANCE -> INFORMAL_EMAIL or SEMI_FORMAL_EMAIL; ORGANIZATION -> SEMI_FORMAL_EMAIL or FORMAL_EMAIL with Sie). Prefer INFORMAL_EMAIL and SEMI_FORMAL_EMAIL; use FORMAL_EMAIL only when the situation really requires it.\n"
                : "Communication type: " + communication + " for every task.\n");
        b.append("Every task in this batch must use a clearly different situation, different names and different four points.\n");
        if (!existing.isEmpty()) {
            b.append("\nEXISTING TASKS (do not repeat these topics, situations or wording; create something clearly different):\n");
            existing.forEach(line -> b.append("- ").append(line).append("\n"));
        }
        return b.toString().stripTrailing();
    }

    private static String speakingBlock(ExamContentSpec spec, List<String> existing) {
        StringBuilder b = new StringBuilder("\n\nSPEAKING TASK CONFIGURATION\n");
        b.append("Task type: ").append(SpeakingSchema.taskTypeOf(spec)).append(" for every exercise (set \"taskType\" to this value).\n");
        b.append("Language: ALL learning content is German. Do not write English or Persian anywhere in the JSON.\n");
        b.append(switch (spec.part()) {
            case 1 -> "Every exercise covers all seven core topics (" + String.join(", ", SpeakingSchema.CORE_TOPICS.keySet())
                    + ") and may add the optional topics (" + String.join(", ", SpeakingSchema.OPTIONAL_TOPICS.keySet())
                    + "). Vary the example persona (name, country, job, family, languages) from exercise to exercise. "
                    + "Any selected themes below only colour the example answers and optional topics.\n";
            case 2 -> "Every exercise has one realistic opinion stimulus: a person (name, age, occupation) states an opinion on a topic in the first person. "
                    + "Use a different topic, person and opinion in every exercise; opinions should be balanced so that learners can agree or disagree.\n";
            default -> "Every exercise has one realistic planning scenario with " + SpeakingSchema.MIN_PLANNING_POINTS + "–" + SpeakingSchema.MAX_PLANNING_POINTS
                    + " planning points. Use a different scenario (party, trip, gift, excursion, project, move ...) in every exercise.\n";
        });
        if (!existing.isEmpty()) {
            b.append("\nEXISTING EXERCISES (do not repeat these topics, scenarios or wording; create something clearly different):\n");
            existing.forEach(line -> b.append("- ").append(line).append("\n"));
        }
        return b.toString().stripTrailing();
    }

    private static String visualRules(boolean includeVisuals) {
        if (!includeVisuals) {
            return "Visual briefs are NOT requested: in every advertisement set \"visual\": {\"hasImage\": false, \"imageType\": \"NONE\"} and write all information as text.";
        }
        return "Visual briefs are requested: most advertisements may have an image brief, a few should not. For an advertisement with an image set "
                + "visual.hasImage to true, imageType (PHOTO, ILLUSTRATION, LOGO, ICON, DECORATIVE), imageUrl null, imagePrompt (a short English or German brief of the picture, "
                + "no text inside the picture) and altText (German, required). For an advertisement without an image use hasImage false and imageType NONE.";
    }

    private String jsonExample(ExamContentSpec spec, String firstId, String difficulty) {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", ExamContentSpecs.SCHEMA_VERSION);
        root.put("promptVersion", spec.promptVersion());
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", spec.examType().name());
        root.put("level", spec.level().getValue());
        root.put("section", ExamContentTokens.sectionToken(spec.section()));
        root.put("part", ExamContentTokens.partToken(spec.part()));
        ArrayNode exercises = root.putArray("exercises");
        ObjectNode ex = exercises.addObject();
        ex.put("externalId", firstId);
        ex.put("title", spec.level().getValue() + " " + ExamContentTokens.sectionLabel(spec.section()) + " Teil " + spec.part() + " – ...");
        ex.put("instructions", spec.defaultInstructions());
        if (spec.isSpeaking()) {
            SpeakingSchema.putExample(ex, spec, difficulty);
            return write(root);
        }
        if (spec.isWriting()) {
            ex.put("taskType", "EMAIL_RESPONSE");
            ex.put("scenarioType", "STANDARD_EMAIL");
            ex.put("topic", "...");
            ex.put("communicationType", "INFORMAL_EMAIL");
            ex.put("relationship", "FRIEND");
            ObjectNode task = ex.putObject("task");
            task.put("situation", "Sie haben von einer Freundin folgende E-Mail erhalten:");
            ObjectNode message = task.putObject("incomingMessage");
            message.put("greeting", "Liebe ...,").put("body", "...").put("closing", "Viele Grüße").put("sender", "...");
            ArrayNode points = ex.putArray("points");
            for (int i = 1; i <= spec.questionCount(); i++) points.addObject().put("number", i).put("text", "...");
            ex.putObject("writingGuidance").put("de", ExamContentSpecs.WRITING_GUIDANCE);
            ObjectNode meta = ex.putObject("metadata");
            meta.put("difficulty", difficulty);
            meta.putArray("topics").add("TRAVEL");
            meta.putArray("tags").add("reise").add("freundschaft");
            meta.put("source", "AI_IMPORTED");
            return write(root);
        }
        if (spec.isSituationMatching()) {
            ArrayNode situations = ex.putArray("situations");
            for (int i = 0; i < spec.situationCount(); i++) {
                ObjectNode sit = situations.addObject();
                sit.put("id", "situation_" + (spec.firstQuestionNumber() + i));
                sit.put("number", spec.firstQuestionNumber() + i);
                sit.put("text", "...");
                sit.put("correctAdvertisementId", "...");
                ObjectNode profile = sit.putObject("matchingProfile");
                profile.put("primaryNeed", "...");
                profile.putArray("requirements").add("...");
            }
            ArrayNode ads = ex.putArray("advertisements");
            for (String id : spec.optionIds()) {
                ObjectNode ad = ads.addObject();
                ad.put("id", id);
                ad.put("type", "RESTAURANT");
                ad.put("layout", "CLASSIC");
                ObjectNode content = ad.putObject("content");
                content.put("headline", "...");
                content.put("subheadline", "...");
                content.put("description", "...");
                content.putArray("details").add("...");
                content.put("price", "...");
                content.put("openingHours", "...");
                content.putObject("contact").put("address", "...").put("phone", "...");
                ObjectNode visual = ad.putObject("visual");
                visual.put("hasImage", true).put("imageType", "PHOTO").putNull("imageUrl");
                visual.put("imagePrompt", "...").put("altText", "...");
                ObjectNode apf = ad.putObject("matchingProfile");
                apf.put("primaryService", "...");
                apf.putArray("features").add("...");
            }
            ObjectNode meta = ex.putObject("metadata");
            meta.put("difficulty", difficulty);
            meta.putArray("topics").add("EVERYDAY_LIFE").add("SERVICES");
            meta.putArray("skills").add("SELECTIVE_READING").add("INFORMATION_MATCHING");
            meta.put("source", "AI_GENERATED_ORIGINAL");
            return write(root);
        }
        if (spec.isWordBank()) {
            ex.put("contextType", "ADVERTISEMENT_EMAIL");
            ex.put("topic", "...");
            ex.putObject("context").put("type", "ADVERTISEMENT").put("title", "...").put("text", "...");
            ex.put("text", "Complete German text containing [31] through [40]");
            ArrayNode bank = ex.putArray("wordBank");
            spec.optionIds().forEach(id -> bank.addObject().put("key", id).put("word", "WORD"));
            ArrayNode wordQuestions = ex.putArray("questions");
            for (int i = 0; i < spec.questionCount(); i++) {
                ObjectNode q = wordQuestions.addObject();
                q.put("number", spec.firstQuestionNumber() + i);
                q.put("correctAnswer", "...");
                q.put("correctWord", "WORD");
                q.put("grammarCategory", "PRAEPOSITION");
                q.put("grammarFocus", "...");
                q.putObject("explanation").put("de", "Kurze Erklärung auf Deutsch.").put("en", "Short explanation in English.")
                        .put("fa", "توضیح کوتاه به زبان فارسی.");
            }
            ObjectNode meta = ex.putObject("metadata");
            meta.put("difficulty", difficulty);
            meta.putArray("topics").add("TRAVEL");
            meta.putArray("skills").add("GRAMMAR_IN_CONTEXT");
            meta.put("source", "AI_GENERATED_ORIGINAL");
            return write(root);
        }
        if (spec.isGapText()) {
            ex.put("textType", "EMAIL");
            ex.put("topic", "...");
            ex.put("text", "Text with the gaps marked as [21], [22] ... [30]");
            ArrayNode gapQuestions = ex.putArray("questions");
            for (int i = 0; i < spec.questionCount(); i++) {
                ObjectNode q = gapQuestions.addObject();
                q.put("number", spec.firstQuestionNumber() + i);
                ArrayNode options = q.putArray("options");
                spec.optionIds().forEach(id -> options.addObject().put("key", id).put("text", "..."));
                q.put("correctAnswer", "...");
                q.put("category", "KONJUNKTION");
                q.put("grammarFocus", "...");
                q.putObject("explanation").put("de", "Kurze Erklärung auf Deutsch.").put("en", "Short explanation in English.")
                        .put("fa", "توضیح کوتاه به زبان فارسی.");
            }
            ObjectNode meta = ex.putObject("metadata");
            meta.put("difficulty", difficulty);
            meta.putArray("topics").add("EVERYDAY_LIFE");
            meta.putArray("skills").add("GRAMMAR_IN_CONTEXT");
            meta.put("source", "AI_GENERATED_ORIGINAL");
            return write(root);
        }
        if (spec.isMultipleChoice()) {
            ex.putObject("text").put("content", "...");
            ArrayNode questions = ex.putArray("questions");
            for (int i = 0; i < spec.questionCount(); i++) {
                ObjectNode q = questions.addObject();
                q.put("id", "question_" + (i + 1));
                q.put("number", spec.firstQuestionNumber() + i);
                q.put("question", "...");
                ArrayNode options = q.putArray("options");
                spec.optionIds().forEach(id -> options.addObject().put("id", id).put("text", "..."));
                q.put("correctOptionId", "...");
                q.put("questionType", "...");
            }
            ObjectNode meta = ex.putObject("metadata");
            meta.put("difficulty", difficulty);
            meta.putArray("topics").add("SOCIETY");
            meta.putArray("skills").add("READING_COMPREHENSION");
            meta.put("source", "AI_GENERATED_ORIGINAL");
            return write(root);
        }
        ArrayNode headings = ex.putArray("headings");
        spec.headingIds().forEach(id -> headings.addObject().put("id", id).put("text", "..."));
        ArrayNode texts = ex.putArray("texts");
        spec.textIds().forEach(id -> texts.addObject().put("id", id).put("content", "...").put("correctHeadingId", "..."));
        ObjectNode metadata = ex.putObject("metadata");
        metadata.put("difficulty", difficulty);
        metadata.putArray("topics").add("EVERYDAY_LIFE");
        ArrayNode skills = metadata.putArray("skills");
        skills.add("MAIN_IDEA").add("SELECTIVE_READING").add("PARAPHRASING");
        metadata.put("source", "AI_GENERATED_ORIGINAL");
        return write(root);
    }

    private String write(ObjectNode root) {
        try {
            return MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(root);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private String loadTemplate(String path) {
        try {
            return new ClassPathResource(path).getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("Prompt template missing: " + path, e);
        }
    }

    /** Next free number for generated external ids, given the ids already stored with that prefix. */
    public static int nextNumber(String prefix, List<String> existingIds) {
        int max = 0;
        for (String id : new ArrayList<>(existingIds)) {
            if (id == null || !id.startsWith(prefix)) continue;
            String suffix = id.substring(prefix.length());
            if (suffix.matches("\\d{1,6}")) max = Math.max(max, Integer.parseInt(suffix));
        }
        return max + 1;
    }
}
