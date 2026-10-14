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
    /** DTZ Lesen Teil 1 generator choices (the first entry of each list is the default). */
    public static final List<String> DIRECTORY_TOPICS = List.of(
            "RANDOM", "TOWN_HALL", "LIBRARY", "HOSPITAL", "PUBLIC_TRANSPORT", "COURSE_CATALOGUE", "JOB_TRAINING", "HOUSING",
            "SHOPPING_SERVICES", "SPORTS_LEISURE");
    public static final List<String> DIRECTORY_SOURCE_TYPES = List.of("RANDOM", "DIRECTORY", "REGISTER", "CATALOGUE", "SERVICE_LIST");
    public static final List<String> DIRECTORY_LEVELS = List.of("A2_B1", "A2", "B1");
    public static final List<String> DIRECTORY_VARIATIONS = List.of("RANDOM", "NEW_SCENARIO", "AVOID_KNOWN_TOPICS");
    /** DTZ Lesen Teil 2 generator choices (the first entry of each list is the default). */
    public static final List<String> AD_TOPICS = List.of("RANDOM", "WORK", "EDUCATION", "COURSES", "FAMILY", "LEISURE", "SERVICES");
    public static final List<String> AD_CATEGORIES = List.of(
            "JOBS", "TRAINING", "COURSES", "EDUCATION", "DRIVING_SCHOOL", "CHILDCARE", "HOUSING", "LEISURE", "PUBLIC_SERVICES",
            "FINANCIAL_SUPPORT", "COUNSELLING", "SPORTS_COMMUNITY", "CONTINUING_EDUCATION", "SERVICES");
    /** DTZ Lesen Teil 3 generator choices (the first entry of each list is the default). */
    public static final List<String> LESEN_TEXT_TOPICS = List.of("RANDOM", "TRANSPORT", "WORK", "EDUCATION", "FAMILY", "HEALTH", "HOUSING",
            "LEISURE", "PUBLIC_SERVICES", "SHOPPING", "ENVIRONMENT", "COMMUNITY");
    public static final List<String> LESEN_TEXT_MIXES = List.of("RANDOM_MIX", "PRESS_EMAIL_NOTICE", "THREE_PRESS", "THREE_EMAILS", "THREE_NOTICES", "CUSTOM");
    public static final List<String> LESEN_TEXT_TYPES = List.of("PRESS_TEXT", "EMAIL", "FORMAL_NOTICE", "PUBLIC_ANNOUNCEMENT", "INFORMATION_TEXT");
    public static final List<String> LESEN_TEXT_LENGTHS = List.of("MEDIUM", "SHORT", "LONG");
    /** DTZ Lesen Teil 4 generator choices (the first entry of each list is the default). */
    public static final List<String> TRUE_FALSE_TOPICS = List.of("RANDOM", "SCHOOL_CHILDCARE", "PUBLIC_SERVICES", "HOUSING", "EDUCATION_COURSES",
            "WORK_EMPLOYMENT", "HEALTH_APPOINTMENTS", "LEISURE_COMMUNITY", "PUBLIC_TRANSPORT", "EVERYDAY_RULES");
    public static final List<String> TRUE_FALSE_STYLES = List.of("RANDOM", "INFORMATION_SHEET", "FORMAL_NOTICE", "INSTITUTIONAL_ANNOUNCEMENT",
            "RULES_AND_CONDITIONS", "PUBLIC_INFORMATION_TEXT");
    /** DTZ Lesen Teil 5 generator choices (the first entry of each list is the default). */
    public static final List<String> LETTER_TOPICS = List.of("RANDOM", "TRAVEL_ACCOMMODATION", "WORK_APPLICATIONS", "SCHOOL_EDUCATION", "FAMILY_FRIENDS",
            "HEALTH_APPOINTMENTS", "HOUSING", "COURSES_LEISURE", "PUBLIC_SERVICES", "SHOPPING_COMPLAINTS", "EVERYDAY_COMMUNICATION");
    public static final List<String> LETTER_TEXT_TYPES = List.of("RANDOM", "FORMAL_LETTER", "FORMAL_EMAIL", "INFORMAL_EMAIL", "COMPLAINT",
            "REQUEST_FOR_INFORMATION", "INVITATION");
    public static final List<String> LETTER_GRAMMAR_FOCUS = List.of("MIXED", "CONNECTORS", "PRONOUNS", "ARTICLES_ENDINGS", "PREPOSITIONS", "VERB_FORMS",
            "WORD_ORDER", "EVERYDAY_EXPRESSIONS", "RANDOM_MIX");
    public static final List<String> LETTER_REGISTERS = List.of("AUTO", "FORMAL", "INFORMAL");
    /** DTZ Schreiben generator choices (the first entry of each list is the default). */
    public static final List<String> WRITING_TOPICS = List.of("RANDOM", "HOUSING_NEIGHBOURS", "COURSES_EDUCATION", "WORK_EMPLOYMENT", "FAMILY_EVERYDAY",
            "APPOINTMENTS", "HEALTH_SERVICES", "PUBLIC_SERVICES", "SHOPPING_COMPLAINTS", "INVITATIONS_EVENTS", "TRAVEL_ACCOMMODATION");
    public static final List<String> WRITING_PURPOSES = List.of("MIXED", "ENQUIRY_REQUEST", "COMPLAINT", "INVITATION_REPLY", "APPOINTMENT_CHANGE",
            "APPLICATION", "PROBLEM_EXPLANATION", "REQUEST_FOR_ASSISTANCE");
    public static final List<String> WRITING_FORMATS = List.of("MIXED", "FORMAL", "INFORMAL_EMAIL", "SEMI_FORMAL");
    public static final List<String> WRITING_PAIRS = List.of("RANDOM_BALANCED", "DIFFERENT_TOPICS", "DIFFERENT_PURPOSES", "FORMAL_AND_INFORMAL");
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
        if (spec.isDirectoryMatching()) {
            return buildDirectory(spec, request, existingCount, firstNumber, existingSummaries);
        }
        if (spec.isDtzOral()) {
            return buildDtzOral(spec, request, existingCount, firstNumber, existingSummaries);
        }
        if (spec.isWritingChoice()) {
            return buildWritingChoice(spec, request, existingCount, firstNumber, existingSummaries);
        }
        if (spec.isLetterGap()) {
            return buildLetterGap(spec, request, existingCount, firstNumber, existingSummaries);
        }
        if (spec.isTrueFalseText()) {
            return buildTrueFalseText(spec, request, existingCount, firstNumber, existingSummaries);
        }
        if (spec.isTextQuestions()) {
            return buildTextQuestions(spec, request, existingCount, firstNumber, existingSummaries);
        }
        if (spec.isAdMatching()) {
            return buildAdMatching(spec, request, existingCount, firstNumber, existingSummaries);
        }
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

    // ------------------------------------------------------------------ DTZ Lesen Teil 1 (directory matching)

    private static final Map<String, String> DIRECTORY_TOPIC_TEXT = Map.of(
            "TOWN_HALL", "Rathaus and authorities (town hall departments, citizens' services)",
            "LIBRARY", "Library (sections, services, opening areas)",
            "HOSPITAL", "Hospital (departments, practices, services)",
            "PUBLIC_TRANSPORT", "Public transport information (lines, ticket and customer services)",
            "COURSE_CATALOGUE", "Course catalogue (adult education, language and leisure courses)",
            "JOB_TRAINING", "Job and training services (employment agency, counselling, training)",
            "HOUSING", "Housing services (housing office, tenants' advice, utilities)",
            "SHOPPING_SERVICES", "Shopping and services (shopping centre, department store, service points)",
            "SPORTS_LEISURE", "Sports and leisure (sports centre, pool, clubs)");

    private PromptResponse buildDirectory(ExamContentSpec spec, PromptRequest request, int existingCount, int firstNumber,
                                          List<String> existingSummaries) {
        String level = directoryToken(request.difficulty(), "A2_B1", DIRECTORY_LEVELS, "difficulty");
        int count = request.count() == null ? 1 : request.count();
        if (count < 1 || count > MAX_COUNT) throw new IllegalArgumentException("count must be between 1 and " + MAX_COUNT);
        List<String> topics = new ArrayList<>();
        for (String t : request.topics() == null ? List.<String>of() : request.topics()) {
            String token = topicToken(t, DIRECTORY_TOPICS);
            if (!token.equals("RANDOM") && !topics.contains(token)) topics.add(token);
        }
        String sourceType = directoryToken(request.sourceType(), "RANDOM", DIRECTORY_SOURCE_TYPES, "source type");
        String variation = directoryToken(request.variation(), "RANDOM", DIRECTORY_VARIATIONS, "variation");
        boolean includeExample = request.includeExample() == null || request.includeExample();

        String firstId = spec.externalIdPrefix() + String.format("%03d", firstNumber);
        String example = directoryJsonExample(spec, level, sourceType, includeExample, count);

        Map<String, String> values = new java.util.LinkedHashMap<>();
        values.put("DIFFICULTY", level);
        values.put("COUNT_LINE", count == 1 ? "Generate exactly ONE complete exercise" : "Generate exactly " + count + " complete, clearly different exercises");
        values.put("BATCH_RULE", count == 1 ? ""
                : "Because there are " + count + " exercises, return ONE JSON object that wraps them: schemaVersion, contentType \"EXAM_EXERCISE_BATCH\", exam, level, section, part and an \"exercises\" array with exactly " + count + " exercise objects. Each exercise must use a different scenario, source and wording.\n");
        values.put("STRUCTURE_NOTE", count == 1 ? "" : " (the object inside the \"exercises\" array; repeat it " + count + " times)");
        values.put("TOPIC", topics.isEmpty() ? "any suitable everyday topic (your choice; vary it between exercises)"
                : count == 1 || topics.size() == 1 ? topicText(DIRECTORY_TOPIC_TEXT, topics.get(0))
                : "spread the " + count + " exercises over these topics, each exercise with one topic: "
                + topics.stream().map(t -> topicText(DIRECTORY_TOPIC_TEXT, t)).collect(java.util.stream.Collectors.joining("; ")));
        values.put("SOURCE_TYPE", sourceType.equals("RANDOM") ? "your choice (DIRECTORY, REGISTER, CATALOGUE or SERVICE_LIST - whichever fits the topic best; set informationSource.type accordingly)" : sourceType);
        values.put("INCLUDE_EXAMPLE", includeExample ? "include one unscored example" : "do not include an example");
        values.put("VARIATION_BLOCK", switch (variation) {
            case "NEW_SCENARIO" -> "Variation: invent a new, original scenario; do not fall back on the most typical textbook setting for this topic.\n";
            case "AVOID_KNOWN_TOPICS" -> existingSummaries.isEmpty()
                    ? "Variation: avoid the most common textbook scenarios for this topic.\n"
                    : "Variation: the library already contains these exercises - choose a clearly different scenario, source and wording:\n"
                    + existingSummaries.stream().map(line -> "- " + line).collect(java.util.stream.Collectors.joining("\n")) + "\n";
            default -> "";
        });
        values.put("LEVEL_RULES", directoryLevelRules(level));
        values.put("EXAMPLE_RULE", includeExample
                ? "- Set example.enabled to true and give a complete example with its own situation, three options, correct answer and explanation. The example is not scored and has no number."
                : "- The example is disabled: use exactly \"example\": {\"enabled\": false}.");
        values.put("JSON_EXAMPLE", example);
        values.put("NOTES_BLOCK", request.notes() == null || request.notes().isBlank() ? ""
                : "\nADDITIONAL INSTRUCTIONS FROM THE EDITOR:\n" + request.notes().strip());

        String prompt = loadTemplate(spec.promptTemplate());
        for (Map.Entry<String, String> e : values.entrySet()) {
            prompt = prompt.replace("{{" + e.getKey() + "}}", e.getValue());
        }
        return new PromptResponse(prompt.strip() + "\n", spec.promptVersion(), ExamContentSpecs.SCHEMA_VERSION, example, existingCount, firstId);
    }

    // ------------------------------------------------------------------ DTZ Lesen Teil 2 (advertisement matching)

    private static final Map<String, String> AD_TOPIC_TEXT = Map.of(
            "WORK", "Work (jobs, part-time work, applications)",
            "EDUCATION", "Education and qualifications (school leaving certificates, training, studies)",
            "COURSES", "Courses (language, computer and leisure courses)",
            "FAMILY", "Family (childcare, children, family services)",
            "LEISURE", "Leisure (sports, clubs, culture)",
            "SERVICES", "Services (local services, public offices, advice)");

    /** One or several exercises per prompt; several are returned as one batch file. */
    private PromptResponse buildAdMatching(ExamContentSpec spec, PromptRequest request, int existingCount, int firstNumber,
                                           List<String> existingSummaries) {
        String level = directoryToken(request.difficulty(), "A2_B1", DIRECTORY_LEVELS, "difficulty");
        int count = request.count() == null ? 1 : request.count();
        if (count < 1 || count > MAX_COUNT) throw new IllegalArgumentException("count must be between 1 and " + MAX_COUNT);
        List<String> topics = new ArrayList<>();
        for (String t : request.topics() == null ? List.<String>of() : request.topics()) {
            String token = topicToken(t, AD_TOPICS);
            if (!token.equals("RANDOM") && !topics.contains(token)) topics.add(token);
        }
        List<String> categories = new ArrayList<>();
        for (String c : request.adCategories() == null ? List.<String>of() : request.adCategories()) {
            String token = directoryToken(c, "", AD_CATEGORIES, "advertisement category");
            if (!token.isEmpty() && !categories.contains(token)) categories.add(token);
        }
        String variation = directoryToken(request.variation(), "RANDOM", DIRECTORY_VARIATIONS, "variation");
        boolean includeExample = request.includeExample() != null && request.includeExample();

        String firstId = spec.externalIdPrefix() + String.format("%03d", firstNumber);
        String example = adMatchingJsonExample(spec, level, includeExample, count);

        Map<String, String> values = new java.util.LinkedHashMap<>();
        values.put("DIFFICULTY", level);
        values.put("COUNT_LINE", count == 1 ? "Generate exactly ONE complete exercise" : "Generate exactly " + count + " complete, clearly different exercises");
        values.put("BATCH_RULE", count == 1 ? ""
                : "Because there are " + count + " exercises, return ONE JSON object that wraps them: schemaVersion, contentType \"EXAM_EXERCISE_BATCH\", exam, level, section, part and an \"exercises\" array with exactly " + count + " exercise objects. Each exercise must use a different scenario, set of advertisements and wording.\n\n");
        values.put("STRUCTURE_NOTE", count == 1 ? "" : " (the object inside the \"exercises\" array; repeat it " + count + " times)");
        values.put("TOPIC", topics.isEmpty() ? "any suitable everyday topic (your choice)"
                : topics.stream().map(t -> topicText(AD_TOPIC_TEXT, t)).collect(java.util.stream.Collectors.joining("; ")));
        values.put("ADVERTISEMENT_CATEGORIES", categories.isEmpty() ? "your choice (varied, fitting the topic)" : String.join(", ", categories));
        values.put("INCLUDE_EXAMPLE", includeExample ? "true (include one unscored example)" : "false (do not include an example)");
        values.put("INSTRUCTIONS", spec.defaultInstructions());
        values.put("VARIATION_BLOCK", switch (variation) {
            case "NEW_SCENARIO" -> "Variation: invent new, original scenarios; do not fall back on the most typical textbook setting for this topic.\n";
            case "AVOID_KNOWN_TOPICS" -> existingSummaries.isEmpty()
                    ? "Variation: avoid the most common textbook scenarios for this topic.\n"
                    : "Variation: the library already contains these exercises - choose clearly different scenarios, advertisements and wording:\n"
                    + existingSummaries.stream().map(line -> "- " + line).collect(java.util.stream.Collectors.joining("\n")) + "\n";
            default -> "";
        });
        values.put("LEVEL_RULES", switch (level) {
            case "A2" -> "For A2: use short, direct sentences; prefer familiar vocabulary; keep conditions easy to understand; avoid advanced grammar and specialist language.";
            case "B1" -> "For B1: allow more varied vocabulary and phrasing; keep all matches supported by explicit information; do not require advanced background knowledge.";
            default -> "For A2–B1: use accessible everyday German; include simple paraphrases; use realistic practical details; avoid unnecessary ambiguity.";
        });
        values.put("EXAMPLE_RULE", includeExample
                ? "Generate one separate unscored example with a short situation, a correct advertisement label or `X`, and a brief German explanation. "
                + "Use `\"example\": {\"enabled\": true, \"situation\": \"...\", \"correctAnswer\": \"...\", \"explanation\": {\"de\": \"...\"}}`. "
                + "The example is not one of the questions 26–30 and must not break the matching rules of the five scored questions."
                : "The example is disabled: return exactly `\"example\": {\"enabled\": false}`.");
        values.put("JSON_EXAMPLE", example);
        values.put("NOTES_BLOCK", request.notes() == null || request.notes().isBlank() ? ""
                : "\nADDITIONAL INSTRUCTIONS FROM THE EDITOR:\n" + request.notes().strip() + "\n");

        String prompt = loadTemplate(spec.promptTemplate());
        for (Map.Entry<String, String> e : values.entrySet()) {
            prompt = prompt.replace("{{" + e.getKey() + "}}", e.getValue());
        }
        return new PromptResponse(prompt.strip() + "\n", spec.promptVersion(), ExamContentSpecs.SCHEMA_VERSION, example, existingCount, firstId);
    }

    private String adMatchingJsonExample(ExamContentSpec spec, String level, boolean includeExample, int count) {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("exam", "DTZ");
        ex.put("section", "LESEN");
        ex.put("part", 2);
        ex.put("exerciseType", "ADVERTISEMENT_MATCHING");
        ex.put("skill", "ANZEIGEN_ZUORDNEN");
        ex.put("level", "A2_B1");
        ex.put("title", "...");
        ex.put("topic", "...");
        ex.put("difficulty", level);
        ex.putObject("instructions").put("de", spec.defaultInstructions());
        ArrayNode situations = ex.putArray("situations");
        for (int i = 0; i < spec.situationCount(); i++) {
            situations.addObject().put("number", spec.firstQuestionNumber() + i).put("text", "...");
        }
        ArrayNode ads = ex.putArray("advertisements");
        for (String label : spec.optionIds()) {
            ObjectNode ad = ads.addObject();
            ad.put("label", label);
            ad.put("title", "...");
            ad.put("body", "...");
            ad.put("category", "...");
        }
        if (includeExample) {
            ObjectNode example = ex.putObject("example");
            example.put("enabled", true);
            example.put("situation", "...");
            example.put("correctAnswer", "...");
            example.putObject("explanation").put("de", "...");
        } else {
            ex.putObject("example").put("enabled", false);
        }
        ArrayNode key = ex.putArray("answerKey");
        for (int i = 0; i < spec.situationCount(); i++) {
            ObjectNode entry = key.addObject();
            entry.put("questionNumber", spec.firstQuestionNumber() + i);
            entry.put("correctAnswer", "...");
            entry.putObject("explanation").put("de", "...");
        }
        ObjectNode meta = ex.putObject("metadata");
        meta.put("schemaVersion", 1);
        meta.put("source", "AI_IMPORTED");
        meta.putArray("tags");
        if (count == 1) return write(ex);
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", ExamContentSpecs.SCHEMA_VERSION);
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", "DTZ");
        root.put("level", "A2_B1");
        root.put("section", "LESEN");
        root.put("part", "TEIL_2");
        root.putArray("exercises").add(ex);
        return write(root);
    }

    // ------------------------------------------------------------------ DTZ Lesen Teil 3 (texts with richtig/falsch + multiple choice)

    private static final Map<String, String> LESEN_TEXT_TOPIC_TEXT = Map.ofEntries(
            Map.entry("TRANSPORT", "Public transport and mobility"),
            Map.entry("WORK", "Work and employment"),
            Map.entry("EDUCATION", "Education and courses"),
            Map.entry("FAMILY", "Family and childcare"),
            Map.entry("HEALTH", "Health and appointments"),
            Map.entry("HOUSING", "Housing and neighbourhood"),
            Map.entry("LEISURE", "Leisure and events"),
            Map.entry("PUBLIC_SERVICES", "Public services"),
            Map.entry("SHOPPING", "Shopping and everyday life"),
            Map.entry("ENVIRONMENT", "Environment"),
            Map.entry("COMMUNITY", "Community projects"));

    private static final Map<String, String> LESEN_TEXT_LENGTH_TEXT = Map.of(
            "SHORT", "short (about 80–130 words per text)",
            "MEDIUM", "medium (about 100–160 words per text)",
            "LONG", "longer (about 120–180 words per text)");

    /** One or several exercises per prompt; several are returned as one batch file. */
    private PromptResponse buildTextQuestions(ExamContentSpec spec, PromptRequest request, int existingCount, int firstNumber,
                                              List<String> existingSummaries) {
        String level = directoryToken(request.difficulty(), "A2_B1", DIRECTORY_LEVELS, "difficulty");
        int count = request.count() == null ? 1 : request.count();
        if (count < 1 || count > MAX_COUNT) throw new IllegalArgumentException("count must be between 1 and " + MAX_COUNT);
        List<String> topics = new ArrayList<>();
        for (String t : request.topics() == null ? List.<String>of() : request.topics()) {
            String token = topicToken(t, LESEN_TEXT_TOPICS);
            if (!token.equals("RANDOM") && !topics.contains(token)) topics.add(token);
        }
        String mix = directoryToken(request.textMix(), "RANDOM_MIX", LESEN_TEXT_MIXES, "text mix");
        String length = directoryToken(request.textLength(), "MEDIUM", LESEN_TEXT_LENGTHS, "text length");
        String variation = directoryToken(request.variation(), "RANDOM", DIRECTORY_VARIATIONS, "variation");
        boolean dates = request.includeDatesTimes() == null || request.includeDatesTimes();
        List<String> custom = new ArrayList<>();
        if (mix.equals("CUSTOM")) {
            List<String> given = request.customTextTypes() == null ? List.of() : request.customTextTypes();
            if (given.size() != 3) throw new IllegalArgumentException("A custom text mix needs exactly three text types.");
            for (String t : given) custom.add(directoryToken(t, "", LESEN_TEXT_TYPES, "text type"));
            if (custom.contains("")) throw new IllegalArgumentException("A custom text mix needs exactly three text types.");
        }
        List<String> tags = new ArrayList<>();
        for (String tag : request.tags() == null ? List.<String>of() : request.tags()) {
            String clean = tag == null ? "" : tag.strip().replaceAll("[\\r\\n\"]", " ");
            if (!clean.isEmpty() && clean.length() <= 40 && !tags.contains(clean) && tags.size() < 10) tags.add(clean);
        }

        String firstId = spec.externalIdPrefix() + String.format("%03d", firstNumber);
        String example = textQuestionsJsonExample(spec, level, count, mix, custom, tags);

        Map<String, String> values = new java.util.LinkedHashMap<>();
        values.put("DIFFICULTY", level);
        values.put("COUNT_LINE", count == 1 ? "Generate exactly ONE complete exercise" : "Generate exactly " + count + " complete, clearly different exercises");
        values.put("BATCH_RULE", count == 1 ? ""
                : "Because there are " + count + " exercises, return ONE JSON object that wraps them: schemaVersion, contentType \"EXAM_EXERCISE_BATCH\", exam, level, section, part and an \"exercises\" array with exactly " + count + " exercise objects. Each exercise must use a different scenario, set of texts and wording.\n\n");
        values.put("STRUCTURE_NOTE", count == 1 ? "" : " (the object inside the \"exercises\" array; repeat it " + count + " times)");
        values.put("TOPIC", topics.isEmpty() ? "any suitable everyday topic (your choice)"
                : topics.stream().map(t -> topicText(LESEN_TEXT_TOPIC_TEXT, t)).collect(java.util.stream.Collectors.joining("; ")));
        values.put("TEXT_TYPES", switch (mix) {
            case "PRESS_EMAIL_NOTICE" -> "Text 1 PRESS_TEXT, Text 2 EMAIL, Text 3 FORMAL_NOTICE";
            case "THREE_PRESS" -> "three press texts (type PRESS_TEXT for all three; vary topic, structure and style)";
            case "THREE_EMAILS" -> "three emails or messages (type EMAIL for all three; vary sender, purpose and style)";
            case "THREE_NOTICES" -> "three formal notices (type FORMAL_NOTICE for all three; vary sender and purpose)";
            case "CUSTOM" -> "Text 1 " + custom.get(0) + ", Text 2 " + custom.get(1) + ", Text 3 " + custom.get(2);
            default -> "a varied mix of different text types (at least two different types) chosen from " + String.join(", ", LESEN_TEXT_TYPES);
        });
        values.put("TEXT_LENGTH", LESEN_TEXT_LENGTH_TEXT.get(length));
        values.put("DATES_RULE", dates
                ? "Include concrete dates, times, places or numbers where they fit the text type (they make good question targets)."
                : "Do not use specific dates or times unless the content cannot work without them.");
        values.put("INSTRUCTIONS", spec.defaultInstructions());
        values.put("VARIATION_BLOCK", switch (variation) {
            case "NEW_SCENARIO" -> "Variation: invent new, original scenarios; do not fall back on the most typical textbook setting for this topic.\n";
            case "AVOID_KNOWN_TOPICS" -> existingSummaries.isEmpty()
                    ? "Variation: avoid the most common textbook scenarios for this topic.\n"
                    : "Variation: the library already contains these exercises - choose clearly different scenarios, texts and wording:\n"
                    + existingSummaries.stream().map(line -> "- " + line).collect(java.util.stream.Collectors.joining("\n")) + "\n";
            default -> "";
        });
        values.put("LEVEL_RULES", switch (level) {
            case "A2" -> "For A2: use common vocabulary; prefer short, clear sentences; keep the message direct; avoid complex sentence structures.";
            case "B1" -> "For B1: allow richer vocabulary and more detailed information; test the main message, important details and simple reasoning; avoid unnecessary specialist vocabulary.";
            default -> "For A2–B1: use accessible everyday German; include realistic information and simple paraphrases; allow some variety in sentence structure; keep the meaning clear.";
        });
        values.put("TAGS_RULE", tags.isEmpty() ? "" : "Put these tags into metadata.tags: " + String.join(", ", tags) + ".\n");
        values.put("JSON_EXAMPLE", example);
        values.put("NOTES_BLOCK", request.notes() == null || request.notes().isBlank() ? ""
                : "\nADDITIONAL INSTRUCTIONS FROM THE EDITOR:\n" + request.notes().strip() + "\n");

        String prompt = loadTemplate(spec.promptTemplate());
        for (Map.Entry<String, String> e : values.entrySet()) {
            prompt = prompt.replace("{{" + e.getKey() + "}}", e.getValue());
        }
        return new PromptResponse(prompt.strip() + "\n", spec.promptVersion(), ExamContentSpecs.SCHEMA_VERSION, example, existingCount, firstId);
    }

    // ------------------------------------------------------------------ DTZ Lesen Teil 5 (one letter with six gaps)

    private static final Map<String, String> LETTER_TOPIC_TEXT = Map.ofEntries(
            Map.entry("TRAVEL_ACCOMMODATION", "Travel and accommodation"),
            Map.entry("WORK_APPLICATIONS", "Work and applications"),
            Map.entry("SCHOOL_EDUCATION", "School and education"),
            Map.entry("FAMILY_FRIENDS", "Family and friends"),
            Map.entry("HEALTH_APPOINTMENTS", "Health and appointments"),
            Map.entry("HOUSING", "Housing"),
            Map.entry("COURSES_LEISURE", "Courses and leisure"),
            Map.entry("PUBLIC_SERVICES", "Public services"),
            Map.entry("SHOPPING_COMPLAINTS", "Shopping and complaints"),
            Map.entry("EVERYDAY_COMMUNICATION", "Everyday communication"));

    private static final Map<String, String> LETTER_TEXT_TYPE_TEXT = Map.of(
            "FORMAL_LETTER", "a formal letter",
            "FORMAL_EMAIL", "a formal email",
            "INFORMAL_EMAIL", "an informal email to a friend or acquaintance",
            "COMPLAINT", "a complaint",
            "REQUEST_FOR_INFORMATION", "a request for information",
            "INVITATION", "an invitation or the reply to an invitation");

    private static final Map<String, String> LETTER_GRAMMAR_TEXT = Map.of(
            "MIXED", "mixed grammar and vocabulary (a balanced mixture)",
            "CONNECTORS", "connectors and conjunctions (weil, obwohl, deshalb, trotzdem, dass, wenn, sondern ...)",
            "PRONOUNS", "personal, possessive and relative pronouns",
            "ARTICLES_ENDINGS", "articles and adjective endings",
            "PREPOSITIONS", "prepositions and verb-preposition combinations",
            "VERB_FORMS", "verb forms, tenses and modal verbs",
            "WORD_ORDER", "word order and subordinate-clause structures",
            "EVERYDAY_EXPRESSIONS", "common vocabulary, fixed expressions and collocations",
            "RANDOM_MIX", "a random mix of the language points below (your choice)");

    /** Category name -> what it covers; the order is the order shown in the prompt. */
    private static final Map<String, String> LETTER_CATEGORY_TEXT = new java.util.LinkedHashMap<>();
    static {
        LETTER_CATEGORY_TEXT.put("ARTIKEL", "articles");
        LETTER_CATEGORY_TEXT.put("ADJEKTIVENDUNG", "adjective endings");
        LETTER_CATEGORY_TEXT.put("PERSONALPRONOMEN", "personal pronouns");
        LETTER_CATEGORY_TEXT.put("POSSESSIVARTIKEL", "possessive articles / pronouns");
        LETTER_CATEGORY_TEXT.put("RELATIVPRONOMEN", "relative pronouns");
        LETTER_CATEGORY_TEXT.put("VERBFORM", "verb forms and tenses");
        LETTER_CATEGORY_TEXT.put("MODALVERB", "modal verbs");
        LETTER_CATEGORY_TEXT.put("KONJUNKTION", "conjunctions");
        LETTER_CATEGORY_TEXT.put("ADVERBIEN_KONNEKTOREN", "connecting adverbs (deshalb, trotzdem, außerdem ...)");
        LETTER_CATEGORY_TEXT.put("PRAEPOSITION", "prepositions");
        LETTER_CATEGORY_TEXT.put("VERB_PRAEPOSITION", "verb-preposition combinations");
        LETTER_CATEGORY_TEXT.put("NEGATION", "negation");
        LETTER_CATEGORY_TEXT.put("SATZSTRUKTUR", "word order and subordinate clauses");
        LETTER_CATEGORY_TEXT.put("INFINITIV", "infinitive structures (zu + Infinitiv)");
        LETTER_CATEGORY_TEXT.put("WORTSCHATZ", "common vocabulary");
        LETTER_CATEGORY_TEXT.put("FESTE_WENDUNG", "fixed expressions and collocations");
    }

    // ------------------------------------------------------------------ DTZ Schreiben (Aufgabe A / Aufgabe B)

    private static final Map<String, String> WRITING_TOPIC_TEXT = Map.ofEntries(
            Map.entry("HOUSING_NEIGHBOURS", "Housing and neighbours"),
            Map.entry("COURSES_EDUCATION", "Courses and education"),
            Map.entry("WORK_EMPLOYMENT", "Work and employment"),
            Map.entry("FAMILY_EVERYDAY", "Family and everyday life"),
            Map.entry("APPOINTMENTS", "Appointments"),
            Map.entry("HEALTH_SERVICES", "Health services"),
            Map.entry("PUBLIC_SERVICES", "Public services"),
            Map.entry("SHOPPING_COMPLAINTS", "Shopping and complaints"),
            Map.entry("INVITATIONS_EVENTS", "Invitations and events"),
            Map.entry("TRAVEL_ACCOMMODATION", "Travel and accommodation"));

    private static final Map<String, String> WRITING_PURPOSE_TEXT = Map.of(
            "MIXED", "mixed (use a different purpose for each task)",
            "ENQUIRY_REQUEST", "enquiry or request",
            "COMPLAINT", "complaint",
            "INVITATION_REPLY", "invitation or reply to an invitation",
            "APPOINTMENT_CHANGE", "appointment change",
            "APPLICATION", "application",
            "PROBLEM_EXPLANATION", "explanation of a problem",
            "REQUEST_FOR_ASSISTANCE", "request for assistance");

    private static final Map<String, String> WRITING_FORMAT_TEXT = Map.of(
            "MIXED", "mixed (your choice; combine formal and informal or semi-formal where it fits)",
            "FORMAL", "formal email or letter (FORMAL_EMAIL or FORMAL_LETTER)",
            "INFORMAL_EMAIL", "informal email (INFORMAL_EMAIL)",
            "SEMI_FORMAL", "semi-formal email or letter (SEMI_FORMAL_EMAIL or SEMI_FORMAL_LETTER)");

    private static final Map<String, String> WRITING_PAIR_TEXT = Map.of(
            "RANDOM_BALANCED", "random balanced pair (two comparable tasks that are different from each other)",
            "DIFFERENT_TOPICS", "two different topics",
            "DIFFERENT_PURPOSES", "two different communication purposes",
            "FORMAL_AND_INFORMAL", "one formal task and one informal or semi-formal task");

    /**
     * One exercise per prompt: a complete A/B pair. The settings only guide the content; they never change the two-task structure,
     * and the prompt itself tells the AI to prefer the structure when settings contradict each other.
     */
    private PromptResponse buildWritingChoice(ExamContentSpec spec, PromptRequest request, int existingCount, int firstNumber,
                                              List<String> existingSummaries) {
        String level = directoryToken(request.difficulty(), "A2_B1", DIRECTORY_LEVELS, "difficulty");
        List<String> topics = new ArrayList<>();
        for (String t : request.topics() == null ? List.<String>of() : request.topics()) {
            String token = topicToken(t, WRITING_TOPICS);
            if (!token.equals("RANDOM") && !topics.contains(token)) topics.add(token);
        }
        String purpose = directoryToken(request.textType(), "MIXED", WRITING_PURPOSES, "communication purpose");
        String format = directoryToken(request.communicationType(), "MIXED", WRITING_FORMATS, "communication format");
        String pair = directoryToken(request.pairPreference(), "RANDOM_BALANCED", WRITING_PAIRS, "pair preference");
        String variation = directoryToken(request.variation(), "RANDOM", DIRECTORY_VARIATIONS, "variation");
        int count = request.count() == null ? 1 : request.count();
        if (count < 1 || count > MAX_COUNT) throw new IllegalArgumentException("count must be between 1 and " + MAX_COUNT);

        Map<String, String> values = new java.util.LinkedHashMap<>();
        values.put("COUNT_LINE", count == 1 ? "Create exactly ONE complete writing exercise" : "Create exactly " + count + " complete, clearly different writing exercises");
        values.put("BATCH_RULE", count == 1 ? ""
                : "Because there are " + count + " exercises, return ONE JSON object that wraps them: schemaVersion, contentType \"EXAM_EXERCISE_BATCH\", exam, level, section, part and an \"exercises\" array with exactly "
                + count + " exercise objects (each with the structure below). Each exercise must use different scenarios and wording.\n\n");
        values.put("DIFFICULTY", level);
        values.put("TOPIC", topics.isEmpty() ? "random (your choice of everyday topics)"
                : topics.size() == 1 ? topicText(WRITING_TOPIC_TEXT, topics.get(0))
                : "choose from these topics, spread over the exercises and the two tasks: "
                + topics.stream().map(t -> topicText(WRITING_TOPIC_TEXT, t)).collect(java.util.stream.Collectors.joining("; ")));
        values.put("COMMUNICATION_PURPOSE", WRITING_PURPOSE_TEXT.get(purpose));
        values.put("COMMUNICATION_FORMAT", WRITING_FORMAT_TEXT.get(format));
        values.put("PAIR_PREFERENCE", WRITING_PAIR_TEXT.get(pair));
        values.put("VARIATION_BLOCK", switch (variation) {
            case "NEW_SCENARIO" -> "\nVariation: invent new, original scenarios; do not fall back on the most typical textbook setting for the topic.\n";
            case "AVOID_KNOWN_TOPICS" -> existingSummaries.isEmpty()
                    ? "\nVariation: avoid the most common textbook scenarios.\n"
                    : "\nVariation: the library already contains these exercises - choose clearly different scenarios and wording:\n"
                    + existingSummaries.stream().map(line -> "- " + line).collect(java.util.stream.Collectors.joining("\n")) + "\n";
            default -> "";
        });
        values.put("INSTRUCTIONS", spec.defaultInstructions());
        values.put("COMMUNICATION_TYPE_NAMES", String.join(", ", new java.util.TreeSet<>(ExamWritingChoiceReader.COMMUNICATION_TYPES)));
        values.put("LEVEL_RULES", switch (level) {
            case "A2" -> "For A2: use familiar everyday vocabulary and direct instructions; avoid complex or abstract situations.";
            case "B1" -> "For B1: allow somewhat more detailed situations that encourage clear explanations and connected sentences; avoid specialist or academic language.";
            default -> "For A2–B1: allow common everyday problems with several related details; use natural, accessible wording; include practical requests, explanations and questions.";
        });
        String jsonExample = writingChoiceJsonExample(spec, level, count);
        values.put("JSON_EXAMPLE", jsonExample);
        values.put("NOTES_BLOCK", request.notes() == null || request.notes().isBlank() ? ""
                : "\nADDITIONAL INSTRUCTIONS FROM THE EDITOR:\n" + request.notes().strip() + "\n");

        String prompt = loadTemplate(spec.promptTemplate());
        for (Map.Entry<String, String> e : values.entrySet()) {
            prompt = prompt.replace("{{" + e.getKey() + "}}", e.getValue());
        }
        String firstId = spec.externalIdPrefix() + String.format("%03d", firstNumber);
        return new PromptResponse(prompt.strip() + "\n", spec.promptVersion(), ExamContentSpecs.SCHEMA_VERSION, jsonExample, existingCount, firstId);
    }

    private String writingChoiceJsonExample(ExamContentSpec spec, String level, int count) {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("exam", "DTZ");
        ex.put("section", "SCHREIBEN");
        ex.put("part", 1);
        ex.put("level", level);
        ex.put("exerciseType", ExamWritingChoiceReader.EXERCISE_TYPE);
        ex.put("title", "...");
        ex.put("durationMinutes", ExamContentSpecs.WRITING_CHOICE_MINUTES);
        ex.putObject("instructions").put("de", spec.defaultInstructions());
        ArrayNode tasks = ex.putArray("tasks");
        for (String label : ExamWritingChoiceReader.LABELS) {
            ObjectNode task = tasks.addObject();
            task.put("taskLabel", label);
            task.put("title", "...");
            task.put("topic", "...");
            task.put("communicationType", "...");
            task.put("situation", "...");
            task.putObject("recipient").put("name", "...").put("role", "...");
            task.put("writingInstruction", "...");
            ArrayNode points = task.putArray("points");
            for (int n = 1; n <= ExamWritingChoiceReader.POINT_COUNT; n++) points.addObject().put("number", n).put("text", "...");
        }
        ObjectNode meta = ex.putObject("metadata");
        meta.put("schemaVersion", 1);
        meta.put("source", "AI_IMPORTED");
        meta.putArray("tags");
        if (count == 1) return write(ex);
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", ExamContentSpecs.SCHEMA_VERSION);
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", "DTZ");
        root.put("level", "A2_B1");
        root.put("section", "SCHREIBEN");
        root.put("part", "TEIL_1");
        root.putArray("exercises").add(ex);
        return write(root);
    }

    /** One or several exercises per prompt (several come back as one batch file); the settings only shape the content, never the six-gap structure. */
    private PromptResponse buildLetterGap(ExamContentSpec spec, PromptRequest request, int existingCount, int firstNumber,
                                          List<String> existingSummaries) {
        String level = directoryToken(request.difficulty(), "A2_B1", DIRECTORY_LEVELS, "difficulty");
        int count = request.count() == null ? 1 : request.count();
        if (count < 1 || count > MAX_COUNT) throw new IllegalArgumentException("count must be between 1 and " + MAX_COUNT);
        List<String> topics = new ArrayList<>();
        for (String t : request.topics() == null ? List.<String>of() : request.topics()) {
            String token = topicToken(t, LETTER_TOPICS);
            if (!token.equals("RANDOM") && !topics.contains(token)) topics.add(token);
        }
        String textType = directoryToken(request.textType(), "RANDOM", LETTER_TEXT_TYPES, "text type");
        String focus = "MIXED";
        for (String g : request.grammarCategories() == null ? List.<String>of() : request.grammarCategories()) {
            focus = directoryToken(g, "MIXED", LETTER_GRAMMAR_FOCUS, "grammar focus");
            break;
        }
        String register = directoryToken(request.communicationType(), "AUTO", LETTER_REGISTERS, "register");
        boolean example = request.includeExample() == null || request.includeExample();
        String variation = directoryToken(request.variation(), "RANDOM", DIRECTORY_VARIATIONS, "variation");

        String textTypeValue = textType.equals("RANDOM")
                ? "your choice of " + String.join(" | ", LETTER_TEXT_TYPES.subList(1, LETTER_TEXT_TYPES.size())) + " (use the chosen token as text.type)"
                : textType + " (" + LETTER_TEXT_TYPE_TEXT.get(textType) + ")";
        String jsonExample = letterJsonExample(spec, level, textType, example, count);

        Map<String, String> values = new java.util.LinkedHashMap<>();
        values.put("DIFFICULTY", level);
        values.put("COUNT_LINE", count == 1 ? "Generate exactly ONE complete exercise" : "Generate exactly " + count + " complete, clearly different exercises");
        values.put("TOPIC", topics.isEmpty() ? "any suitable everyday topic (your choice)"
                : topics.stream().map(t -> topicText(LETTER_TOPIC_TEXT, t)).collect(java.util.stream.Collectors.joining("; ")));
        values.put("TEXT_TYPE", textTypeValue);
        values.put("GRAMMAR_FOCUS", LETTER_GRAMMAR_TEXT.get(focus));
        values.put("INCLUDE_EXAMPLE", example ? "true" : "false");
        values.put("REGISTER_LINE", switch (register) {
            case "FORMAL" -> "- Register: formal (Sie, Sehr geehrte Damen und Herren / Mit freundlichen Grüßen)\n";
            case "INFORMAL" -> "- Register: informal (du, Liebe/Lieber ..., Liebe Grüße)\n";
            default -> "";
        });
        values.put("VARIATION_BLOCK", switch (variation) {
            case "NEW_SCENARIO" -> "\nVariation: invent a new, original scenario; do not fall back on the most typical textbook setting for this topic.\n";
            case "AVOID_KNOWN_TOPICS" -> existingSummaries.isEmpty()
                    ? "\nVariation: avoid the most common textbook scenarios for this topic.\n"
                    : "\nVariation: the library already contains these exercises - choose a clearly different scenario, text and wording:\n"
                    + existingSummaries.stream().map(line -> "- " + line).collect(java.util.stream.Collectors.joining("\n")) + "\n";
            default -> "";
        });
        values.put("INSTRUCTIONS", spec.defaultInstructions());
        values.put("WORD_RANGE", level.equals("A2") ? "110–160" : level.equals("B1") ? "140–200" : "120–200");
        values.put("LEVEL_RULES", switch (level) {
            case "A2" -> "For A2: use common everyday vocabulary, short sentences and few subordinate clauses; the gaps test basic, frequent structures.";
            case "B1" -> "For B1: allow more complex sentences and connectors; the gaps may test subordinate clauses, relative pronouns and verb-preposition combinations; no specialist language.";
            default -> "For A2–B1: accessible everyday German with a few subordinate clauses; the gaps test frequent structures and common expressions.";
        });
        values.put("EXAMPLE_RULES", example
                ? "Include one instructional example gap numbered 0. It demonstrates the task (typically the greeting or the first sentence) without duplicating one of the scored questions. Give the sentence around the gap as \"textBeforeGap\" and \"textAfterGap\" (keep the spaces next to the gap), exactly three options a, b, c, the correctAnswer and a short explanation in de, en and fa. Keep the example separate from the six scored questions and do NOT put it into the body."
                : "The example is disabled: omit it completely and use \"example\": null.");
        values.put("EXAMPLE_JSON_RULE", example ? "The example object follows the structure shown." : "\"example\" must be null.");
        values.put("CATEGORY_LIST", LETTER_CATEGORY_TEXT.entrySet().stream().map(e -> "- " + e.getValue()).collect(java.util.stream.Collectors.joining("\n")));
        values.put("CATEGORY_NAMES", String.join(", ", LETTER_CATEGORY_TEXT.keySet()));
        values.put("TEXT_TYPE_NAMES", String.join(", ", new java.util.TreeSet<>(ExamLetterReader.TEXT_TYPES)));
        values.put("BATCH_RULE", count == 1 ? ""
                : "Because there are " + count + " exercises, return ONE JSON object that wraps them: schemaVersion, contentType \"EXAM_EXERCISE_BATCH\", exam, level, section, part and an \"exercises\" array with exactly " + count + " exercise objects (each with the structure below). Each exercise must use a different scenario, text and wording"
                + (topics.size() > 1 ? ", and the exercises should be spread over the listed topics" : "") + ".\n\n");
        values.put("TAGS_RULE", "");
        values.put("JSON_EXAMPLE", jsonExample);
        values.put("NOTES_BLOCK", request.notes() == null || request.notes().isBlank() ? ""
                : "\nADDITIONAL INSTRUCTIONS FROM THE EDITOR:\n" + request.notes().strip() + "\n");

        String prompt = loadTemplate(spec.promptTemplate());
        for (Map.Entry<String, String> e : values.entrySet()) {
            prompt = prompt.replace("{{" + e.getKey() + "}}", e.getValue());
        }
        String firstId = spec.externalIdPrefix() + String.format("%03d", firstNumber);
        return new PromptResponse(prompt.strip() + "\n", spec.promptVersion(), ExamContentSpecs.SCHEMA_VERSION, jsonExample, existingCount, firstId);
    }

    private String letterJsonExample(ExamContentSpec spec, String level, String textType, boolean withExample, int count) {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("exam", "DTZ");
        ex.put("section", "LESEN");
        ex.put("part", 5);
        ex.put("exerciseType", ExamLetterReader.EXERCISE_TYPE);
        ex.put("level", level);
        ex.put("title", "...");
        ex.put("topic", "...");
        ex.put("difficulty", level);
        ex.putObject("instructions").put("de", spec.defaultInstructions());
        if (withExample) {
            ObjectNode example = ex.putObject("example");
            example.put("number", 0);
            example.put("textBeforeGap", "... ");
            example.put("textAfterGap", " ...");
            ArrayNode options = example.putArray("options");
            for (String key : List.of("a", "b", "c")) options.addObject().put("key", key).put("text", "...");
            example.put("correctAnswer", "a");
            example.putObject("explanation").put("de", "...").put("en", "...").put("fa", "...");
        } else {
            ex.putNull("example");
        }
        ObjectNode text = ex.putObject("text");
        text.put("type", textType.equals("RANDOM") ? "FORMAL_EMAIL" : textType);
        text.putNull("sender");
        text.putNull("recipient");
        text.putNull("date");
        text.put("subject", "...");
        StringBuilder body = new StringBuilder("... ");
        for (int n = spec.firstQuestionNumber(); n <= spec.lastQuestionNumber(); n++) body.append("{{").append(n).append("}} ... ");
        text.put("body", body.toString().strip());
        ArrayNode questions = ex.putArray("questions");
        String[] answers = {"b", "a", "c", "b", "c", "a"};
        for (int i = 0; i < spec.questionCount(); i++) {
            ObjectNode q = questions.addObject();
            q.put("number", spec.firstQuestionNumber() + i);
            q.put("type", ExamLetterReader.QUESTION_TYPE);
            ArrayNode options = q.putArray("options");
            for (String key : List.of("a", "b", "c")) options.addObject().put("key", key).put("text", "...");
            q.put("correctAnswer", answers[i]);
            q.put("grammarCategory", "...");
            q.put("grammarFocus", "...");
            q.putObject("explanation").put("de", "...").put("en", "...").put("fa", "...");
        }
        ObjectNode meta = ex.putObject("metadata");
        meta.put("schemaVersion", 1);
        meta.put("source", "AI_IMPORTED");
        meta.putArray("tags");
        if (count == 1) return write(ex);
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", ExamContentSpecs.SCHEMA_VERSION);
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", "DTZ");
        root.put("level", "A2_B1");
        root.put("section", "LESEN");
        root.put("part", "TEIL_5");
        root.putArray("exercises").add(ex);
        return write(root);
    }

    // ------------------------------------------------------------------ DTZ Lesen Teil 4 (one text + three richtig/falsch statements)

    private static final Map<String, String> TRUE_FALSE_TOPIC_TEXT = Map.of(
            "SCHOOL_CHILDCARE", "School and childcare",
            "PUBLIC_SERVICES", "Public services",
            "HOUSING", "Housing and tenants",
            "EDUCATION_COURSES", "Education and courses",
            "WORK_EMPLOYMENT", "Work and employment",
            "HEALTH_APPOINTMENTS", "Health services and appointments",
            "LEISURE_COMMUNITY", "Leisure, community centres and memberships",
            "PUBLIC_TRANSPORT", "Public transport rules",
            "EVERYDAY_RULES", "Everyday rules and services (registration, fees, opening hours)");

    private static final Map<String, String> TRUE_FALSE_STYLE_TEXT = Map.of(
            "INFORMATION_SHEET", "information sheet",
            "FORMAL_NOTICE", "formal notice",
            "INSTITUTIONAL_ANNOUNCEMENT", "institutional announcement",
            "RULES_AND_CONDITIONS", "rules and conditions",
            "PUBLIC_INFORMATION_TEXT", "public information text");

    private static final Map<String, String> TRUE_FALSE_LENGTH_TEXT = Map.of(
            "SHORT", "short (about 180–210 words)",
            "MEDIUM", "medium (about 210–260 words)",
            "LONG", "longer (about 260–300 words)");

    /** One or several exercises per prompt (several come back as one batch file); {@code request.textType()} carries the text style. */
    private PromptResponse buildTrueFalseText(ExamContentSpec spec, PromptRequest request, int existingCount, int firstNumber,
                                              List<String> existingSummaries) {
        String level = directoryToken(request.difficulty(), "A2_B1", DIRECTORY_LEVELS, "difficulty");
        int count = request.count() == null ? 1 : request.count();
        if (count < 1 || count > MAX_COUNT) throw new IllegalArgumentException("count must be between 1 and " + MAX_COUNT);
        List<String> topics = new ArrayList<>();
        for (String t : request.topics() == null ? List.<String>of() : request.topics()) {
            String token = topicToken(t, TRUE_FALSE_TOPICS);
            if (!token.equals("RANDOM") && !topics.contains(token)) topics.add(token);
        }
        String style = directoryToken(request.textType(), "RANDOM", TRUE_FALSE_STYLES, "text style");
        String length = directoryToken(request.textLength(), "MEDIUM", LESEN_TEXT_LENGTHS, "text length");
        String variation = directoryToken(request.variation(), "RANDOM", DIRECTORY_VARIATIONS, "variation");
        List<String> tags = new ArrayList<>();
        for (String tag : request.tags() == null ? List.<String>of() : request.tags()) {
            String clean = tag == null ? "" : tag.strip().replaceAll("[\\r\\n\"]", " ");
            if (!clean.isEmpty() && clean.length() <= 40 && !tags.contains(clean) && tags.size() < 10) tags.add(clean);
        }
        String styleValue = style.equals("RANDOM") ? "INFORMATION_SHEET | FORMAL_NOTICE | INSTITUTIONAL_ANNOUNCEMENT | RULES_AND_CONDITIONS | PUBLIC_INFORMATION_TEXT" : style;
        String example = trueFalseJsonExample(spec, level, style.equals("RANDOM") ? "INFORMATION_SHEET" : style, tags, count);

        Map<String, String> values = new java.util.LinkedHashMap<>();
        values.put("DIFFICULTY", level);
        values.put("COUNT_LINE", count == 1 ? "Generate exactly ONE complete exercise" : "Generate exactly " + count + " complete, clearly different exercises");
        values.put("BATCH_RULE", count == 1 ? ""
                : "Because there are " + count + " exercises, return ONE JSON object that wraps them: schemaVersion, contentType \"EXAM_EXERCISE_BATCH\", exam, level, section, part and an \"exercises\" array with exactly " + count + " exercise objects. Each exercise must use a different scenario, text and wording.\n\n");
        values.put("STRUCTURE_NOTE", count == 1 ? "" : " (the object inside the \"exercises\" array; repeat it " + count + " times)");
        values.put("TOPIC", topics.isEmpty() ? "any suitable everyday topic (your choice)"
                : topics.stream().map(t -> topicText(TRUE_FALSE_TOPIC_TEXT, t)).collect(java.util.stream.Collectors.joining("; ")));
        values.put("TEXT_LENGTH", TRUE_FALSE_LENGTH_TEXT.get(length));
        values.put("TEXT_STYLE", style.equals("RANDOM")
                ? "your choice of INFORMATION_SHEET, FORMAL_NOTICE, INSTITUTIONAL_ANNOUNCEMENT, RULES_AND_CONDITIONS or PUBLIC_INFORMATION_TEXT (use the chosen token as text.type)"
                : TRUE_FALSE_STYLE_TEXT.get(style) + " (text.type " + styleValue + ")");
        values.put("INSTRUCTIONS", spec.defaultInstructions());
        values.put("VARIATION_BLOCK", switch (variation) {
            case "NEW_SCENARIO" -> "Variation: invent a new, original scenario; do not fall back on the most typical textbook setting for this topic.\n";
            case "AVOID_KNOWN_TOPICS" -> existingSummaries.isEmpty()
                    ? "Variation: avoid the most common textbook scenarios for this topic.\n"
                    : "Variation: the library already contains these exercises - choose a clearly different scenario, text and wording:\n"
                    + existingSummaries.stream().map(line -> "- " + line).collect(java.util.stream.Collectors.joining("\n")) + "\n";
            default -> "";
        });
        values.put("LEVEL_RULES", switch (level) {
            case "A2" -> "For A2: use common everyday vocabulary; prefer short sentences; use direct explanations; avoid complicated subordinate clauses.";
            case "B1" -> "For B1: allow more detailed information; use some paraphrasing in the statements; test understanding of rules, conditions and relationships; avoid specialist language that is not needed for the topic.";
            default -> "For A2–B1: use accessible everyday German; include several useful facts and conditions; allow moderate variation in sentence structure; keep the text easy to navigate.";
        });
        values.put("DATES_RULE", "");
        values.put("TAGS_RULE", tags.isEmpty() ? "" : "Put these tags into metadata.tags: " + String.join(", ", tags) + ".\n");
        values.put("JSON_EXAMPLE", example);
        values.put("NOTES_BLOCK", request.notes() == null || request.notes().isBlank() ? ""
                : "\nADDITIONAL INSTRUCTIONS FROM THE EDITOR:\n" + request.notes().strip() + "\n");

        String prompt = loadTemplate(spec.promptTemplate());
        for (Map.Entry<String, String> e : values.entrySet()) {
            prompt = prompt.replace("{{" + e.getKey() + "}}", e.getValue());
        }
        String firstId = spec.externalIdPrefix() + String.format("%03d", firstNumber);
        return new PromptResponse(prompt.strip() + "\n", spec.promptVersion(), ExamContentSpecs.SCHEMA_VERSION, example, existingCount, firstId);
    }

    private String trueFalseJsonExample(ExamContentSpec spec, String level, String textType, List<String> tags, int count) {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("exam", "DTZ");
        ex.put("section", "LESEN");
        ex.put("part", 4);
        ex.put("exerciseType", ExamTrueFalseReader.EXERCISE_TYPE);
        ex.put("level", "A2_B1");
        ex.put("title", "...");
        ex.put("topic", "...");
        ex.put("difficulty", level);
        ex.putObject("instructions").put("de", spec.defaultInstructions());
        ObjectNode text = ex.putObject("text");
        text.put("type", textType);
        text.put("title", "...");
        text.put("body", "...");
        ArrayNode questions = ex.putArray("questions");
        String[] answers = {"RICHTIG", "FALSCH", "RICHTIG"};
        for (int i = 0; i < spec.questionCount(); i++) {
            ObjectNode q = questions.addObject();
            q.put("number", spec.firstQuestionNumber() + i);
            q.put("type", "TRUE_FALSE");
            q.put("statement", "...");
            q.put("correctAnswer", answers[i]);
            q.putObject("explanation").put("de", "...").put("en", "...").put("fa", "...");
        }
        ObjectNode meta = ex.putObject("metadata");
        meta.put("schemaVersion", 1);
        meta.put("source", "AI_IMPORTED");
        ArrayNode tagArray = meta.putArray("tags");
        tags.forEach(tagArray::add);
        if (count == 1) return write(ex);
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", ExamContentSpecs.SCHEMA_VERSION);
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", "DTZ");
        root.put("level", "A2_B1");
        root.put("section", "LESEN");
        root.put("part", "TEIL_4");
        root.putArray("exercises").add(ex);
        return write(root);
    }

    private String textQuestionsJsonExample(ExamContentSpec spec, String level, int count, String mix, List<String> custom, List<String> tags) {
        List<String> types = switch (mix) {
            case "THREE_PRESS" -> List.of("PRESS_TEXT", "PRESS_TEXT", "PRESS_TEXT");
            case "THREE_EMAILS" -> List.of("EMAIL", "EMAIL", "EMAIL");
            case "THREE_NOTICES" -> List.of("FORMAL_NOTICE", "FORMAL_NOTICE", "FORMAL_NOTICE");
            case "CUSTOM" -> custom;
            default -> List.of("PRESS_TEXT", "EMAIL", "FORMAL_NOTICE");
        };
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("exam", "DTZ");
        ex.put("section", "LESEN");
        ex.put("part", 3);
        ex.put("exerciseType", "TEXT_COMPREHENSION_MIXED");
        ex.put("skill", "PRESS_TEXTS_AND_FORMAL_NOTICES");
        ex.put("level", "A2_B1");
        ex.put("title", "...");
        ex.put("topic", "...");
        ex.put("difficulty", level);
        ex.putObject("instructions").put("de", spec.defaultInstructions());
        ArrayNode texts = ex.putArray("texts");
        for (int i = 0; i < spec.textCount(); i++) {
            ObjectNode text = texts.addObject();
            text.put("id", "text_" + (i + 1));
            text.put("number", i + 1);
            text.put("type", types.get(i));
            text.put("title", "...");
            text.putNull("sender");
            text.putNull("date");
            text.put("body", "...");
            ArrayNode questions = text.putArray("questions");
            int base = spec.firstQuestionNumber() + i * 2;
            ObjectNode tf = questions.addObject();
            tf.put("number", base);
            tf.put("type", "TRUE_FALSE");
            tf.put("statement", "...");
            tf.put("correctAnswer", "RICHTIG");
            tf.putObject("explanation").put("de", "...").put("en", "...").put("fa", "...");
            ObjectNode mc = questions.addObject();
            mc.put("number", base + 1);
            mc.put("type", "MULTIPLE_CHOICE");
            mc.put("question", "...");
            ArrayNode options = mc.putArray("options");
            for (String key : spec.optionIds()) options.addObject().put("key", key).put("text", "...");
            mc.put("correctAnswer", "b");
            mc.putObject("explanation").put("de", "...").put("en", "...").put("fa", "...");
        }
        ObjectNode meta = ex.putObject("metadata");
        meta.put("schemaVersion", 1);
        meta.put("source", "AI_IMPORTED");
        ArrayNode tagArray = meta.putArray("tags");
        tags.forEach(tagArray::add);
        if (count == 1) return write(ex);
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", ExamContentSpecs.SCHEMA_VERSION);
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", "DTZ");
        root.put("level", "A2_B1");
        root.put("section", "LESEN");
        root.put("part", "TEIL_3");
        root.putArray("exercises").add(ex);
        return write(root);
    }

    /**
     * A topic chip of the generator: one of the offered tokens, or free text typed by the admin (kept as written, without quotes, braces
     * and line breaks, at most {@value #MAX_CUSTOM_TOPIC} characters). Blank means RANDOM.
     */
    static final int MAX_CUSTOM_TOPIC = 60;

    /** A typed-in topic as it is stored and sent: one line without quotes, braces and backslashes; null when blank. */
    static String cleanTopic(String value) {
        if (value == null) return null;
        String clean = value.strip().replaceAll("[\\r\\n\"{}\\\\]", " ").replaceAll("\\s+", " ").strip();
        if (clean.isEmpty()) return null;
        if (clean.length() > MAX_CUSTOM_TOPIC) throw new IllegalArgumentException("A topic may have at most " + MAX_CUSTOM_TOPIC + " characters.");
        return clean;
    }

    private static String topicToken(String value, List<String> allowed) {
        if (value == null || value.isBlank()) return "RANDOM";
        String upper = value.trim().toUpperCase(Locale.ROOT);
        if (allowed.contains(upper)) return upper;
        String clean = cleanTopic(value);
        return clean == null ? "RANDOM" : clean;
    }

    private static String topicText(Map<String, String> known, String token) {
        return known.getOrDefault(token, token);
    }

    private static String directoryToken(String value, String fallback, List<String> allowed, String label) {
        if (value == null || value.isBlank()) return fallback;
        String normalized = value.trim().toUpperCase(Locale.ROOT).replaceAll("[-– ]", "_");
        if (!allowed.contains(normalized)) throw new IllegalArgumentException("Unknown " + label + ": " + value);
        return normalized;
    }

    private static String directoryLevelRules(String level) {
        return switch (level) {
            case "A2" -> "For A2: prefer short, direct sentences; use common vocabulary; avoid complicated subordinate clauses; avoid unnecessary nominalizations and specialist vocabulary.";
            case "B1" -> "For B1: allow somewhat richer wording and paraphrasing; keep the answer unambiguous and explicitly supported by the source.";
            default -> "For A2–B1: use accessible everyday German; include some paraphrasing; keep situations concise and realistic; do not require advanced inference.";
        };
    }

    private String directoryJsonExample(ExamContentSpec spec, String level, String sourceType, boolean includeExample, int count) {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("exam", "DTZ");
        ex.put("section", "LESEN");
        ex.put("part", 1);
        ex.put("exerciseType", "DIRECTORY_MATCHING");
        ex.put("skill", "KATALOGE_REGISTER_VERZEICHNISSE");
        ex.put("level", "A2_B1");
        ex.put("title", "...");
        ex.put("topic", "...");
        ex.put("difficulty", level);
        ex.putObject("instructions").put("de", spec.defaultInstructions());
        ObjectNode source = ex.putObject("informationSource");
        source.put("type", sourceType.equals("RANDOM") ? "DIRECTORY" : sourceType);
        source.put("title", "...");
        source.put("introduction", "...");
        ArrayNode entries = source.putArray("entries");
        for (int i = 1; i <= 2; i++) {
            ObjectNode entry = entries.addObject();
            entry.put("id", "entry_" + i);
            entry.put("heading", "...");
            entry.putArray("details").add("...").add("...");
        }
        source.put("displayText", "...");
        if (includeExample) {
            ObjectNode example = ex.putObject("example");
            example.put("enabled", true);
            example.put("situation", "...");
            putOptions(example.putArray("options"));
            example.put("correctAnswer", "a");
            putExplanation(example.putObject("explanation"));
        } else {
            ex.putObject("example").put("enabled", false);
        }
        ArrayNode questions = ex.putArray("questions");
        for (int i = 0; i < spec.questionCount(); i++) {
            ObjectNode q = questions.addObject();
            q.put("number", spec.firstQuestionNumber() + i);
            q.put("situation", "...");
            putOptions(q.putArray("options"));
            q.put("correctAnswer", "a");
            q.putArray("sourceEntryIds").add("entry_1");
            putExplanation(q.putObject("explanation"));
        }
        ObjectNode meta = ex.putObject("metadata");
        meta.put("schemaVersion", 1);
        meta.put("source", "AI_IMPORTED");
        meta.putArray("tags");
        if (count == 1) return write(ex);
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", ExamContentSpecs.SCHEMA_VERSION);
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", "DTZ");
        root.put("level", "A2_B1");
        root.put("section", "LESEN");
        root.put("part", "TEIL_1");
        root.putArray("exercises").add(ex);
        return write(root);
    }

    private static void putOptions(ArrayNode options) {
        for (String key : List.of("a", "b", "c")) options.addObject().put("key", key).put("text", "...");
    }

    private static void putExplanation(ObjectNode explanation) {
        explanation.put("de", "...").put("en", "...").put("fa", "...");
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

    // ------------------------------------------------------------------ DTZ Mündliche Prüfung (Teil 1 template, Teil 2 photo, Teil 3 planning)

    /**
     * One prompt per Teil - the three Teile have three different structures, so there is deliberately no generic prompt. Teil 1 is the fixed
     * template (no topic, no count); Teil 2 and Teil 3 take a topic (a suggested category or free text) and an optional number of exercises.
     */
    private PromptResponse buildDtzOral(ExamContentSpec spec, PromptRequest request, int existingCount, int firstNumber, List<String> existingSummaries) {
        int part = spec.part();
        // The generic generator page sends MIXED / EASY / MEDIUM / HARD; the oral exam has one level (A2–B1), so those mean the default.
        String requested = request.difficulty() != null && DIFFICULTIES.contains(request.difficulty().trim().toUpperCase(Locale.ROOT)) ? null : request.difficulty();
        String level = directoryToken(requested, "A2_B1", DIRECTORY_LEVELS, "difficulty");
        int count = part == 1 ? 1 : request.count() == null ? 1 : request.count();
        if (count < 1 || count > MAX_COUNT) throw new IllegalArgumentException("count must be between 1 and " + MAX_COUNT);
        List<String> topics = new ArrayList<>();
        for (String t : request.topics() == null ? List.<String>of() : request.topics()) {
            String topic = oralTopic(t);
            if (topic != null && !topics.contains(topic)) topics.add(topic);
        }
        List<String> suggested = part == 2 ? DtzOralSchema.PHOTO_TOPICS : DtzOralSchema.PLANNING_TOPICS;

        Map<String, String> values = new java.util.LinkedHashMap<>();
        values.put("COUNT_LINE", count == 1 ? "Generate exactly one complete exercise" : "Generate exactly " + count + " complete, clearly different exercises");
        values.put("BATCH_RULE", count == 1 ? ""
                : "Because there are " + count + " exercises, return ONE JSON object that wraps them: schemaVersion, contentType \"EXAM_EXERCISE_BATCH\", exam, level, section, part and an \"exercises\" array with exactly "
                + count + " exercise objects (each with the structure below). Each exercise must use a different topic, scenario and wording.\n\n");
        values.put("DIFFICULTY", level.replace("_", "–"));
        values.put("TOPIC", topics.isEmpty()
                ? "random (choose a suitable everyday topic yourself, for example from: " + String.join(", ", suggested) + ")"
                : topics.size() == 1 ? topics.get(0)
                : "choose from these topics, one per exercise: " + String.join("; ", topics));
        values.put("TOPIC_LIST", String.join(", ", suggested));
        values.put("A2_COUNT", String.valueOf(DtzOralSchema.QUESTIONS_PER_LEVEL));
        values.put("B1_COUNT", String.valueOf(DtzOralSchema.QUESTIONS_PER_LEVEL));
        values.put("NOTES_MIN", String.valueOf(DtzOralSchema.MIN_NOTES));
        values.put("NOTES_MAX", String.valueOf(DtzOralSchema.MAX_NOTES));
        values.put("TOPIC_LABELS", String.join(", ", DtzOralSchema.TEIL1_TOPICS));
        values.put("PARTICIPANT_A_INSTRUCTIONS", DtzOralSchema.PARTICIPANT_A_INSTRUCTIONS);
        values.put("PICTURE_PROMPT_1", DtzOralSchema.PICTURE_PROMPTS.get(0));
        values.put("PICTURE_PROMPT_2", DtzOralSchema.PICTURE_PROMPTS.get(1));
        values.put("PARTICIPANT_B_INSTRUCTIONS", DtzOralSchema.PARTICIPANT_B_INSTRUCTIONS);
        values.put("TASK_INSTRUCTION", DtzOralSchema.TASK_INSTRUCTION);
        values.put("TEIL1_INSTRUCTIONS", DtzOralSchema.TEIL1_INSTRUCTIONS);
        values.put("HIKING_NOTES", String.join(" / ", DtzOralSchema.HIKING_EXAMPLE_NOTES));
        values.put("VARIATION_BLOCK", existingSummaries.isEmpty() || part == 1 ? ""
                : "\nThe library already contains these exercises - choose clearly different topics, scenes and wording:\n"
                + existingSummaries.stream().map(line -> "- " + line).collect(java.util.stream.Collectors.joining("\n")) + "\n");
        String jsonExample = dtzOralJsonExample(part, level, count);
        values.put("JSON_EXAMPLE", jsonExample);
        values.put("NOTES_BLOCK", request.notes() == null || request.notes().isBlank() ? ""
                : "\nADDITIONAL INSTRUCTIONS FROM THE EDITOR:\n" + request.notes().strip() + "\n");

        String prompt = loadTemplate(spec.promptTemplate());
        for (Map.Entry<String, String> e : values.entrySet()) {
            prompt = prompt.replace("{{" + e.getKey() + "}}", e.getValue());
        }
        String firstId = spec.externalIdPrefix() + String.format("%03d", firstNumber);
        return new PromptResponse(prompt.strip() + "\n", spec.promptVersion(), ExamContentSpecs.SCHEMA_VERSION, jsonExample, existingCount, firstId);
    }

    /** A free-text topic of the editor: one line, at most 80 characters, no template markers. Null when empty. */
    private static String oralTopic(String raw) {
        if (raw == null) return null;
        String topic = raw.replaceAll("[\\p{Cntrl}]+", " ").replace("{{", "").replace("}}", "").trim();
        if (topic.isEmpty() || topic.equalsIgnoreCase("RANDOM")) return null;
        if (topic.length() > 80) throw new IllegalArgumentException("A topic may be at most 80 characters.");
        return topic;
    }

    private String dtzOralJsonExample(int part, String level, int count) {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("exam", DtzOralSchema.EXAM);
        ex.put("section", DtzOralSchema.SECTION);
        ex.put("part", part);
        ex.put("exerciseType", DtzOralSchema.taskTypeOf(part));
        ex.put("level", level);
        switch (part) {
            case 1 -> {
                ObjectNode template = DtzOralTemplates.teil1();
                ex.put("title", DtzOralSchema.TEIL1_TITLE);
                ex.put("instructions", DtzOralSchema.TEIL1_INSTRUCTIONS);
                ex.set("topics", template.get("topics"));
                ex.putNull("guidance");
                ex.set("practiceSupport", template.get("practiceSupport"));
            }
            case 2 -> {
                ex.put("title", "...");
                ex.put("topic", "...");
                ObjectNode image = ex.putObject("image");
                image.putNull("imageUrl");
                image.put("imagePrompt", "...");
                image.put("altText", "...");
                ObjectNode a = ex.putObject("participantA");
                a.put("title", DtzOralSchema.PARTICIPANT_A_TITLE);
                a.put("instructions", DtzOralSchema.PARTICIPANT_A_INSTRUCTIONS);
                ArrayNode prompts = a.putArray("questions");
                DtzOralSchema.PICTURE_PROMPTS.forEach(prompts::add);
                ObjectNode b = ex.putObject("participantB");
                b.put("title", DtzOralSchema.PARTICIPANT_B_TITLE);
                b.put("instructions", DtzOralSchema.PARTICIPANT_B_INSTRUCTIONS);
                ArrayNode a2 = b.putArray("questionsA2");
                ArrayNode b1 = b.putArray("questionsB1");
                for (int i = 0; i < DtzOralSchema.QUESTIONS_PER_LEVEL; i++) {
                    a2.add("...");
                    b1.add("...");
                }
                ObjectNode solution = ex.putObject("possibleSolution");
                solution.put("description", "...");
                solution.put("experienceA2", "...");
                solution.put("experienceB1", "...");
            }
            default -> {
                ex.put("title", "...");
                ex.put("topic", "...");
                ex.put("situation", "...");
                ex.put("taskInstruction", DtzOralSchema.TASK_INSTRUCTION);
                ArrayNode notes = ex.putArray("planningNotes");
                for (int i = 1; i <= DtzOralSchema.MIN_NOTES; i++) notes.addObject().put("number", i).put("label", "...");
                ObjectNode support = ex.putObject("learnerSupport");
                support.putArray("examplePhrases").add("...");
                ArrayNode dialogue = ex.putObject("possibleSolution").putArray("dialogue");
                for (int i = 0; i < 4; i++) dialogue.addObject().put("speaker", i % 2 == 0 ? "A" : "B").put("text", "...");
            }
        }
        ObjectNode meta = ex.putObject("metadata");
        meta.put("schemaVersion", 1);
        meta.put("source", "AI_IMPORTED");
        meta.putArray("tags");
        if (count == 1) return write(ex);
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", ExamContentSpecs.SCHEMA_VERSION);
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", DtzOralSchema.EXAM);
        root.put("level", "A2_B1");
        root.put("section", DtzOralSchema.SECTION);
        root.put("part", "TEIL_" + part);
        root.putArray("exercises").add(ex);
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
