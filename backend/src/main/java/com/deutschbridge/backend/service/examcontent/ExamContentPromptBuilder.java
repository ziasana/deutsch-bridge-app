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

/**
 * Builds the copy-paste prompt an admin gives to any AI (Claude, ChatGPT, Gemini ...). The prompt is a
 * versioned content specification: the template file carries the rules, this class only fills in the
 * counts, difficulty/topic mix and the JSON structure for the chosen {@link ExamContentSpec}.
 */
public class ExamContentPromptBuilder {

    public static final List<String> TOPICS = List.of(
            "EVERYDAY_LIFE", "WORK", "HOUSING", "HEALTH", "LEISURE", "TRAVEL", "EDUCATION", "ENVIRONMENT", "GARDEN_NATURE", "SOCIETY",
            "FAMILY", "TECHNOLOGY", "MEDIA", "FOOD", "TRAFFIC", "CONSUMPTION", "CLUBS", "GENERATIONS", "CITY_LIFE");
    public static final List<String> DIFFICULTIES = List.of("MIXED", "EASY", "MEDIUM", "HARD");
    public static final int MAX_COUNT = 50;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public PromptResponse build(ExamContentSpec spec, PromptRequest request, int existingCount, int firstNumber) {
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
        values.put("OPTION_COUNT", String.valueOf(spec.optionCount()));
        values.put("OPTION_IDS", String.join(", ", spec.optionIds()));
        values.put("FIRST_QUESTION_NUMBER", String.valueOf(spec.firstQuestionNumber()));
        values.put("LAST_QUESTION_NUMBER", String.valueOf(spec.lastQuestionNumber()));
        values.put("REQUEST_BLOCK", requestBlock(spec, count, difficulty, topics, firstId));
        values.put("JSON_EXAMPLE", example);
        values.put("NOTES_BLOCK", request.notes() == null || request.notes().isBlank() ? ""
                : "\nADDITIONAL INSTRUCTIONS FROM THE EDITOR:\n" + request.notes().strip());

        String prompt = loadTemplate(spec.promptTemplate());
        for (Map.Entry<String, String> e : values.entrySet()) {
            prompt = prompt.replace("{{" + e.getKey() + "}}", e.getValue());
        }
        return new PromptResponse(prompt.strip() + "\n", spec.promptVersion(), ExamContentSpecs.SCHEMA_VERSION, example, existingCount, firstId);
    }

    private String requestBlock(ExamContentSpec spec, int count, String difficulty, List<String> topics, String firstId) {
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
            b.append(spec.isMultipleChoice()
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
        b.append("\nThe top-level fields exam, level, section and part describe the whole file: ")
                .append(spec.examType().name()).append(", ").append(spec.level().getValue()).append(", ")
                .append(ExamContentTokens.sectionToken(spec.section())).append(", ").append(ExamContentTokens.partToken(spec.part())).append(".");
        return b.toString();
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
