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
 * Reads and validates one exercise of the DTZ A2–B1 Mündliche Prüfung. The three Teile have three different structures and three methods:
 * <ul>
 *   <li>Teil 1 - the fixed self-introduction template: exactly the six required topics in the configured order, plus optional practice
 *       support that is kept apart from the examination content;</li>
 *   <li>Teil 2 - one photo (an uploaded image, or an image prompt for a picture that is still to be made), the two picture-description
 *       prompts of participant A and four A2 and four B1 experience questions of participant B;</li>
 *   <li>Teil 3 - one shared planning situation, the fixed instruction and four to six planning notes.</li>
 * </ul>
 *
 * Structure is deterministic and reported as errors (they block the import). Whether a photo supports its questions, whether an A2 question is
 * too abstract or whether the notes really call for a joint decision cannot be established by a program: those checks only produce warnings for
 * patterns that often point at a problem, so they support the administrator's review and do not prove that a task is a good exam task.
 *
 * The result is a map with whitelisted keys only (plain German strings, lists and maps) in the import shape; it is stored as
 * {@code metadata.dtzOral} and is what the editor, the preview and the learner view read.
 */
final class ExamDtzOralReader {

    /** Error codes per check group, for the validation summary shown to the admin. */
    static final Set<String> HEADER_CODES = Set.of("EXERCISE_TYPE_INVALID", "TOPIC_MISSING", "TOPIC_TOO_LONG", "LEVEL_UNKNOWN");
    static final Set<String> TEIL1_CODES = Set.of("TEIL1_TOPICS_MISSING", "TEIL1_TOPIC_COUNT", "TEIL1_TOPIC_NOT_OBJECT", "TEIL1_TOPIC_LABEL", "TEIL1_TOPIC_NUMBER",
            "TEIL1_TOPIC_CONTENT", "PRACTICE_INVALID", "PRACTICE_TOPIC_INVALID", "PRACTICE_TOO_LONG");
    static final Set<String> PHOTO_CODES = Set.of("IMAGE_PROMPT_TOO_LONG");
    static final Set<String> PARTICIPANT_CODES = Set.of("PARTICIPANT_A_MISSING", "PARTICIPANT_B_MISSING", "PARTICIPANT_A_INSTRUCTION", "PARTICIPANT_B_INSTRUCTION",
            "PICTURE_PROMPTS_INVALID", "SOLUTION_INVALID");
    static final Set<String> QUESTION_CODES = Set.of("QUESTIONS_A2_INVALID", "QUESTIONS_B1_INVALID", "QUESTION_EMPTY", "QUESTION_TOO_LONG", "QUESTION_DUPLICATE");
    static final Set<String> PLANNING_CODES = Set.of("SITUATION_MISSING", "SITUATION_TOO_LONG", "TASK_INSTRUCTION_INVALID", "NOTES_MISSING", "NOTES_COUNT",
            "NOTE_NOT_OBJECT", "NOTE_EMPTY", "NOTE_TOO_LONG", "NOTE_NUMBER", "NOTE_DUPLICATE", "DIALOGUE_NOT_ALLOWED", "SUPPORT_INVALID");
    static final Set<String> CONTENT_CODES = Set.of("HTML_CONTENT", "PLACEHOLDER_CONTENT", "FIELD_TYPE");

    static final Pattern IMAGE_URL = Pattern.compile("^/uploads/exam-passages/[A-Za-z0-9._-]{1,120}\\.(webp|jpe?g|png)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern MARKUP = Pattern.compile("<\\s*/?\\s*[a-zA-Z!]|javascript:", Pattern.CASE_INSENSITIVE);
    private static final Pattern PLACEHOLDER = Pattern.compile("^\\s*(\\.{3}|…|TODO|TBD|N/?A|platzhalter|placeholder|lorem ipsum.*|xxx+)\\s*$", Pattern.CASE_INSENSITIVE);

    static final int MAX_TITLE = 200;
    static final int MAX_TOPIC = 200;
    static final int MAX_QUESTION = 300;
    static final int MAX_SITUATION = 700;
    static final int MAX_NOTE = 80;
    static final int MAX_PROMPT = 3000;
    static final int MAX_TEXT = 600;
    static final int MAX_SOLUTION = 1500;
    static final int MIN_SOLUTION_TURNS = 4;
    static final int MAX_SOLUTION_TURNS = 20;
    static final int MAX_TURN = 300;
    static final List<String> SOLUTION_KEYS = List.of("description", "experienceA2", "experienceB1");

    /** Words that make an A2 question abstract: opinions on society, comparisons, pros and cons are B1 material. */
    private static final List<String> ABSTRACT_TERMS = List.of("gesellschaft", "zukunft", "einfluss", "bedeutung", "entwicklung", "vor- und nachteile", "vorteile",
            "nachteile", "unterscheidet", "unterschied", "meinung", "politik", "wirtschaft", "problem der", "verantwortung", "auswirkung", "tendenz", "kritisch");
    /** Questions that need knowledge beyond the photo or a learner's own life. */
    private static final List<String> SPECIALIST_TERMS = List.of("statistik", "gesetz", "studie", "politiker", "wirtschaftlich", "wissenschaftlich", "paragraph",
            "regierung", "steuer", "börse", "inflation", "bruttosozialprodukt");
    /** Planning notes that fit nearly every plan, so they are never reported as unrelated to the situation. */
    private static final Set<String> GENERIC_NOTES = Set.of("wann", "wo", "wohin", "wer", "was", "wie", "wie viel", "wie viele", "wie lange", "wer kommt", "wer soll kommen",
            "wer organisiert was", "essen und trinken", "essen", "trinken", "kosten", "wie viel kostet es", "treffpunkt", "uhrzeit", "einladung", "geschenk", "programm",
            "was mitnehmen", "wie fahren", "wie hinkommen", "bei schlechtem wetter", "was bei schlechtem wetter", "musik", "wer bringt was mit", "dauer");
    private static final Pattern JOINT_SIGNAL = Pattern.compile("\\b(gemeinsam|zusammen|beide|beiden|organisieren|planen|vorbereiten|ihr und|sie und|mit ihrem|mit ihrer|mit ihren)\\b",
            Pattern.CASE_INSENSITIVE);

    private final String p;
    private final List<Issue> issues;
    private final List<String> strings = new ArrayList<>();
    private final List<String> notesLabels = new ArrayList<>();

    ExamDtzOralReader(String pathPrefix, List<Issue> issues) {
        this.p = pathPrefix;
        this.issues = issues;
    }

    /** The validated content: {@code data} is the import-shaped tree, {@code topic} / {@code level} the fields the admin list shows. */
    record Result(ParsedExercise.DtzOral oral) {
    }

    Result read(ExamContentSpec spec, JsonNode node) {
        int part = spec.part();
        String expected = DtzOralSchema.taskTypeOf(part);
        String exerciseType = text(node, "exerciseType");
        if (exerciseType == null || !exerciseType.toUpperCase(Locale.ROOT).equals(expected)) {
            issues.add(error("EXERCISE_TYPE_INVALID", p + "exerciseType", "exerciseType must be " + expected + " for " + spec.label() + " (found: " + exerciseType + ")."));
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("part", part);
        data.put("exerciseType", expected);
        String level = readLevel(node);
        data.put("languageLevel", level);
        switch (part) {
            case 1 -> readTeil1(node, data);
            case 2 -> readTeil2(node, data);
            default -> readTeil3(node, data);
        }
        checkContent();
        return new Result(new ParsedExercise.DtzOral(part, level, data));
    }

    // ------------------------------------------------------------------ header

    private String readLevel(JsonNode node) {
        String difficulty = firstNonNull(text(node, "difficulty"), text(node, "level"));
        if (difficulty == null) return "A2_B1";
        String normalized = difficulty.toUpperCase(Locale.ROOT).replaceAll("[-– ]", "_");
        if (!DtzOralSchema.LEVELS.contains(normalized)) {
            issues.add(warning("LEVEL_UNKNOWN", p + "level", "Unknown difficulty '" + difficulty + "' (use A2, A2_B1 or B1); A2_B1 is used."));
            return "A2_B1";
        }
        return normalized;
    }

    private String readTopic(JsonNode node, Map<String, Object> data) {
        String topic = singleLine(node, "topic", MAX_TOPIC, "TOPIC_TOO_LONG");
        if (topic == null) {
            issues.add(error("TOPIC_MISSING", p + "topic", "topic must not be empty."));
        }
        data.put("topic", topic);
        return topic;
    }

    // ------------------------------------------------------------------ Teil 1: the fixed template

    private void readTeil1(JsonNode node, Map<String, Object> data) {
        String instructions = readInstructionText(node);
        data.put("instructions", instructions == null ? DtzOralSchema.TEIL1_INSTRUCTIONS : instructions);
        data.put("guidance", optional(node, "guidance", MAX_TEXT));
        data.put("explanation", readExplanation(node.get("explanation"), p + "explanation"));

        List<Map<String, Object>> topics = new ArrayList<>();
        JsonNode array = node.get("topics");
        if (array == null || !array.isArray()) {
            issues.add(error("TEIL1_TOPICS_MISSING", p + "topics", "topics must be an array with exactly the six fixed topics: " + String.join(", ", DtzOralSchema.TEIL1_TOPICS) + "."));
        } else {
            if (array.size() != DtzOralSchema.TEIL1_TOPICS.size()) {
                issues.add(error("TEIL1_TOPIC_COUNT", p + "topics", "Exactly " + DtzOralSchema.TEIL1_TOPICS.size() + " topics are required (found " + array.size() + "). "
                        + "The topics are fixed: " + String.join(", ", DtzOralSchema.TEIL1_TOPICS) + "."));
            }
            for (int i = 0; i < array.size(); i++) {
                JsonNode t = array.get(i);
                String path = p + "topics[" + i + "]";
                if (t == null || !t.isObject()) {
                    issues.add(error("TEIL1_TOPIC_NOT_OBJECT", path, "Each topic must be an object with number and label."));
                    continue;
                }
                // The fixed list holds the examination topics only - sample answers or biographies belong to the practice support.
                Iterator<String> names = t.fieldNames();
                while (names.hasNext()) {
                    String name = names.next();
                    if (!name.equals("number") && !name.equals("label")) {
                        issues.add(error("TEIL1_TOPIC_CONTENT", path + "." + name, "A fixed topic holds only 'number' and 'label'. Put sample sentences or questions into practiceSupport."));
                    }
                }
                String label = text(t, "label");
                int expectedNumber = i + 1;
                JsonNode number = t.get("number");
                if (number == null || !number.isIntegralNumber() || number.asInt() != expectedNumber) {
                    issues.add(error("TEIL1_TOPIC_NUMBER", path + ".number", "The topics are numbered 1 to 6 in order; this one must be number " + expectedNumber + "."));
                }
                if (i < DtzOralSchema.TEIL1_TOPICS.size() && !DtzOralSchema.TEIL1_TOPICS.get(i).equals(label)) {
                    issues.add(error("TEIL1_TOPIC_LABEL", path + ".label", "Topic " + expectedNumber + " must be \"" + DtzOralSchema.TEIL1_TOPICS.get(i) + "\" (found: " + label + ")."));
                }
            }
        }
        // Whatever the file says, the stored list is the fixed one.
        for (int i = 0; i < DtzOralSchema.TEIL1_TOPICS.size(); i++) {
            Map<String, Object> topic = new LinkedHashMap<>();
            topic.put("number", i + 1);
            topic.put("label", DtzOralSchema.TEIL1_TOPICS.get(i));
            topics.add(topic);
        }
        data.put("topics", topics);
        data.put("practiceSupport", readPracticeSupport(node.get("practiceSupport")));
    }

    private List<Map<String, Object>> readPracticeSupport(JsonNode array) {
        List<Map<String, Object>> support = new ArrayList<>();
        if (array == null || array.isNull()) return support;
        if (!array.isArray()) {
            issues.add(error("PRACTICE_INVALID", p + "practiceSupport", "practiceSupport must be an array (or omitted)."));
            return support;
        }
        Set<Integer> seen = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode s = array.get(i);
            String path = p + "practiceSupport[" + i + "]";
            if (s == null || !s.isObject()) {
                issues.add(error("PRACTICE_INVALID", path, "Each practice entry must be an object with topicNumber."));
                continue;
            }
            JsonNode n = s.get("topicNumber");
            if (n == null || !n.isIntegralNumber() || n.asInt() < 1 || n.asInt() > DtzOralSchema.TEIL1_TOPICS.size()) {
                issues.add(error("PRACTICE_TOPIC_INVALID", path + ".topicNumber", "topicNumber must be a whole number from 1 to " + DtzOralSchema.TEIL1_TOPICS.size() + "."));
                continue;
            }
            if (!seen.add(n.asInt())) {
                issues.add(error("PRACTICE_TOPIC_INVALID", path + ".topicNumber", "Topic " + n.asInt() + " has more than one practice entry."));
                continue;
            }
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("topicNumber", n.asInt());
            entry.put("question", practiceText(s, "question", path));
            entry.put("sentenceStarter", practiceText(s, "sentenceStarter", path));
            entry.put("vocabulary", stringList(s, "vocabulary", path, 0, 12, 60, "PRACTICE_TOO_LONG", false));
            entry.put("explanation", readExplanation(s.get("explanation"), path + ".explanation"));
            support.add(entry);
        }
        support.sort(java.util.Comparator.comparingInt(e -> (Integer) e.get("topicNumber")));
        return support;
    }

    private String practiceText(JsonNode s, String field, String path) {
        String value = text(s, field);
        if (value != null) {
            if (value.length() > MAX_QUESTION) issues.add(error("PRACTICE_TOO_LONG", path + "." + field, field + " is longer than " + MAX_QUESTION + " characters."));
            strings.add(value);
        }
        return value;
    }

    // ------------------------------------------------------------------ Teil 2: photo + experience

    private void readTeil2(JsonNode node, Map<String, Object> data) {
        String topic = readTopic(node, data);
        Map<String, Object> image = readImage(node.get("image"));
        data.put("image", image);

        JsonNode a = node.get("participantA");
        Map<String, Object> participantA = new LinkedHashMap<>();
        participantA.put("title", DtzOralSchema.PARTICIPANT_A_TITLE);
        participantA.put("instructions", DtzOralSchema.PARTICIPANT_A_INSTRUCTIONS);
        participantA.put("questions", new ArrayList<>(DtzOralSchema.PICTURE_PROMPTS));
        if (a == null || !a.isObject()) {
            issues.add(error("PARTICIPANT_A_MISSING", p + "participantA", "participantA (Bildbeschreibung: instructions and the two picture-description prompts) is required."));
        } else {
            if (!sameText(text(a, "instructions"), DtzOralSchema.PARTICIPANT_A_INSTRUCTIONS)) {
                issues.add(error("PARTICIPANT_A_INSTRUCTION", p + "participantA.instructions", "The instruction of participant A must be exactly: \"" + DtzOralSchema.PARTICIPANT_A_INSTRUCTIONS + "\""));
            }
            List<String> prompts = stringList(a, "questions", p + "participantA", 0, 10, MAX_QUESTION, "QUESTION_TOO_LONG", false);
            if (prompts.size() != DtzOralSchema.PICTURE_PROMPTS.size() || !samePrompts(prompts, DtzOralSchema.PICTURE_PROMPTS)) {
                issues.add(error("PICTURE_PROMPTS_INVALID", p + "participantA.questions", "participantA.questions must be exactly the two picture-description prompts: \""
                        + String.join("\" and \"", DtzOralSchema.PICTURE_PROMPTS) + "\" (found " + prompts.size() + ")."));
            }
        }
        data.put("participantA", participantA);

        JsonNode b = node.get("participantB");
        Map<String, Object> participantB = new LinkedHashMap<>();
        participantB.put("title", DtzOralSchema.PARTICIPANT_B_TITLE);
        participantB.put("instructions", DtzOralSchema.PARTICIPANT_B_INSTRUCTIONS);
        List<String> a2 = List.of();
        List<String> b1 = List.of();
        if (b == null || !b.isObject()) {
            issues.add(error("PARTICIPANT_B_MISSING", p + "participantB", "participantB (Eigene Erfahrungen: instructions, questionsA2 and questionsB1) is required."));
        } else {
            if (!sameText(text(b, "instructions"), DtzOralSchema.PARTICIPANT_B_INSTRUCTIONS)) {
                issues.add(error("PARTICIPANT_B_INSTRUCTION", p + "participantB.instructions", "The instruction of participant B must be exactly: \"" + DtzOralSchema.PARTICIPANT_B_INSTRUCTIONS + "\""));
            }
            a2 = readQuestionSet(b, "questionsA2", "QUESTIONS_A2_INVALID", "A2");
            b1 = readQuestionSet(b, "questionsB1", "QUESTIONS_B1_INVALID", "B1");
        }
        participantB.put("questionsA2", a2);
        participantB.put("questionsB1", b1);
        data.put("participantB", participantB);
        data.put("possibleSolution", readPossibleSolution(node.get("possibleSolution")));

        warnPhoto(image, topic, a2, b1);
    }

    /**
     * "Beispielantwort": one possible answer for the picture description (participant A) and one each for the A2 and B1 experience questions
     * (participant B). Optional; it is shown to learners on request and is never the only correct answer.
     */
    private Map<String, Object> readPossibleSolution(JsonNode node) {
        Map<String, Object> solution = new LinkedHashMap<>();
        for (String key : SOLUTION_KEYS) solution.put(key, null);
        if (node == null || node.isNull()) {
            issues.add(warning("SOLUTION_MISSING", p + "possibleSolution", "No possible solution (mögliche Lösung) is given; learners will see no sample answer."));
            return solution;
        }
        if (!node.isObject()) {
            issues.add(error("SOLUTION_INVALID", p + "possibleSolution", "possibleSolution must be an object with description, experienceA2 and experienceB1."));
            return solution;
        }
        boolean any = false;
        for (String key : SOLUTION_KEYS) {
            JsonNode value = node.get(key);
            if (value != null && !value.isNull() && !value.isTextual()) {
                issues.add(error("SOLUTION_INVALID", p + "possibleSolution." + key, key + " must be a text."));
                continue;
            }
            String text = text(node, key);
            if (text == null) continue;
            if (text.length() > MAX_SOLUTION) issues.add(error("SOLUTION_INVALID", p + "possibleSolution." + key, key + " is longer than " + MAX_SOLUTION + " characters."));
            strings.add(text);
            solution.put(key, text);
            any = true;
        }
        if (!any) issues.add(warning("SOLUTION_MISSING", p + "possibleSolution", "The Beispielantwort is empty."));
        return solution;
    }

    /**
     * The photo is attached after the import: a file without any image data, or with an unusable link, is still importable (as a draft).
     * Only a real uploaded image (/uploads/exam-passages/...) is kept; anything else is dropped with a warning. Publishing needs the upload.
     */
    private Map<String, Object> readImage(JsonNode node) {
        Map<String, Object> image = new LinkedHashMap<>();
        image.put("imageUrl", null);
        image.put("imagePrompt", null);
        image.put("altText", null);
        if (node == null || node.isNull()) {
            issues.add(warning("IMAGE_DATA_MISSING", p + "image", "No image data is given. Add an imagePrompt later if you want one; the photo itself is uploaded before publishing."));
            return image;
        }
        if (!node.isObject()) {
            issues.add(warning("IMAGE_DATA_IGNORED", p + "image", "image must be an object with imageUrl, imagePrompt and altText; it is ignored."));
            return image;
        }
        String url = text(node, "imageUrl");
        if (url != null) {
            if (!IMAGE_URL.matcher(url).matches() || url.toLowerCase(Locale.ROOT).contains("placeholder")) {
                issues.add(warning("IMAGE_URL_IGNORED", p + "image.imageUrl", "imageUrl is not an uploaded exam image (/uploads/exam-passages/...) and is ignored. "
                        + "Links to other sites and placeholders are never used: upload the real image before publishing."));
            } else {
                image.put("imageUrl", url);
            }
        }
        String prompt = text(node, "imagePrompt");
        if (prompt != null) {
            if (prompt.length() > MAX_PROMPT) issues.add(error("IMAGE_PROMPT_TOO_LONG", p + "image.imagePrompt", "imagePrompt is longer than " + MAX_PROMPT + " characters."));
            strings.add(prompt);
            image.put("imagePrompt", prompt);
        }
        String alt = text(node, "altText");
        if (alt != null) {
            if (alt.length() > MAX_TEXT) issues.add(error("IMAGE_PROMPT_TOO_LONG", p + "image.altText", "altText is longer than " + MAX_TEXT + " characters."));
            strings.add(alt);
            image.put("altText", alt);
        }
        return image;
    }

    private List<String> readQuestionSet(JsonNode b, String field, String code, String level) {
        String path = p + "participantB." + field;
        JsonNode array = b.get(field);
        if (array == null || !array.isArray()) {
            issues.add(error(code, path, field + " must be an array of exactly " + DtzOralSchema.QUESTIONS_PER_LEVEL + " " + level + " follow-up questions."));
            return List.of();
        }
        if (array.size() != DtzOralSchema.QUESTIONS_PER_LEVEL) {
            issues.add(error(code, path, "Exactly " + DtzOralSchema.QUESTIONS_PER_LEVEL + " " + level + " questions are required (found " + array.size() + ")."));
        }
        List<String> questions = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode q = array.get(i);
            String qPath = path + "[" + i + "]";
            String question = q != null && q.isTextual() && !q.asText().isBlank() ? q.asText().trim() : null;
            if (question == null) {
                issues.add(error("QUESTION_EMPTY", qPath, level + " question " + (i + 1) + " is empty."));
                continue;
            }
            if (question.length() > MAX_QUESTION) issues.add(error("QUESTION_TOO_LONG", qPath, "A question may be at most " + MAX_QUESTION + " characters."));
            if (!PLACEHOLDER.matcher(question).matches() && !seen.add(TextSimilarity.normalize(question))) {
                issues.add(error("QUESTION_DUPLICATE", qPath, level + " question " + (i + 1) + " repeats another " + level + " question."));
                continue;
            }
            strings.add(question);
            questions.add(question);
        }
        return questions;
    }

    /** Advisory checks: they never block an import. */
    private void warnPhoto(Map<String, Object> image, String topic, List<String> a2, List<String> b1) {
        String prompt = (String) image.get("imagePrompt");
        String alt = (String) image.get("altText");
        if (image.get("imageUrl") == null) {
            issues.add(warning("IMAGE_PENDING", p + "image.imageUrl", "No image is attached yet. Upload or generate the picture, preview it and attach it before publishing."));
        }
        if (prompt != null) {
            String lower = prompt.toLowerCase(Locale.ROOT);
            if (TextSimilarity.wordCount(prompt) < 12) {
                issues.add(warning("PHOTO_PROMPT_THIN", p + "image.imagePrompt", "The image prompt is very short; a photo for a description task needs visible people, actions, objects and surroundings."));
            }
            if (!(lower.contains("no readable text") || lower.contains("no text") || lower.contains("kein text") || lower.contains("ohne text") || lower.contains("without text"))) {
                issues.add(warning("PHOTO_PROMPT_TEXT_RISK", p + "image.imagePrompt", "The image prompt does not say that no readable text may appear in the picture; text in the image makes the description task unfair."));
            }
            if (!(lower.contains("logo") || lower.contains("watermark") || lower.contains("wasserzeichen"))) {
                issues.add(warning("PHOTO_PROMPT_LOGO_RISK", p + "image.imagePrompt", "The image prompt does not exclude logos and watermarks."));
            }
        }
        List<String> all = new ArrayList<>(a2);
        all.addAll(b1);
        String topicStems = stems(topic + " " + (prompt == null ? "" : prompt) + " " + (alt == null ? "" : alt));
        long related = all.stream().filter(q -> shareStem(stems(q), topicStems)).count();
        if (!all.isEmpty() && related < Math.min(3, all.size())) {
            issues.add(warning("QUESTIONS_OFF_TOPIC", p + "participantB", "Only " + related + " of " + all.size() + " questions seem to relate to the topic \"" + topic + "\" and the photo; check that the questions fit the picture."));
        }
        for (int i = 0; i < a2.size(); i++) {
            String lower = a2.get(i).toLowerCase(Locale.ROOT);
            if (ABSTRACT_TERMS.stream().anyMatch(lower::contains)) {
                issues.add(warning("A2_TOO_ABSTRACT", p + "participantB.questionsA2[" + i + "]", "This A2 question looks abstract (opinion, comparison or pros and cons); A2 questions should ask for concrete personal experiences."));
            }
        }
        for (int i = 0; i < all.size(); i++) {
            String lower = all.get(i).toLowerCase(Locale.ROOT);
            if (SPECIALIST_TERMS.stream().anyMatch(lower::contains)) {
                String field = i < a2.size() ? "questionsA2[" + i + "]" : "questionsB1[" + (i - a2.size()) + "]";
                issues.add(warning("QUESTION_NEEDS_KNOWLEDGE", p + "participantB." + field, "This question may need specialist knowledge beyond the photo and the learner's own experience."));
            }
        }
        for (int i = 0; i < b1.size(); i++) {
            for (String q : a2) {
                if (TextSimilarity.similarity(b1.get(i), q) >= 0.75) {
                    issues.add(warning("B1_DUPLICATES_A2", p + "participantB.questionsB1[" + i + "]", "This B1 question is almost the same as an A2 question (\"" + q + "\"). B1 questions should ask for reasons, comparisons or opinions."));
                    break;
                }
            }
        }
    }

    // ------------------------------------------------------------------ Teil 3: joint planning

    private void readTeil3(JsonNode node, Map<String, Object> data) {
        String topic = readTopic(node, data);
        if (node.has("dialogue") || node.has("exampleDialogue") || node.has("dialog")) {
            issues.add(error("DIALOGUE_NOT_ALLOWED", p + "dialogue", "The task must not contain a dialogue. Optional example phrases go into learnerSupport.examplePhrases."));
        }
        String situation = text(node, "situation");
        if (situation == null) {
            issues.add(error("SITUATION_MISSING", p + "situation", "situation must not be empty."));
        } else {
            if (situation.length() > MAX_SITUATION) issues.add(error("SITUATION_TOO_LONG", p + "situation", "situation may be at most " + MAX_SITUATION + " characters."));
            strings.add(situation);
        }
        data.put("situation", situation);
        if (!sameText(text(node, "taskInstruction"), DtzOralSchema.TASK_INSTRUCTION)) {
            issues.add(error("TASK_INSTRUCTION_INVALID", p + "taskInstruction", "taskInstruction must be exactly: \"" + DtzOralSchema.TASK_INSTRUCTION + "\""));
        }
        data.put("taskInstruction", DtzOralSchema.TASK_INSTRUCTION);

        List<Map<String, Object>> notes = readNotes(node);
        data.put("planningNotes", notes);

        Map<String, Object> support = new LinkedHashMap<>();
        JsonNode s = node.get("learnerSupport");
        if (s != null && !s.isNull() && !s.isObject()) {
            issues.add(error("SUPPORT_INVALID", p + "learnerSupport", "learnerSupport must be an object with examplePhrases."));
        } else if (s != null && s.isObject()) {
            support.put("examplePhrases", stringList(s, "examplePhrases", p + "learnerSupport", 0, 12, 160, "SUPPORT_INVALID", false));
        }
        data.put("learnerSupport", support);
        data.put("possibleSolution", readPlanningSolution(node.get("possibleSolution"), notes.size()));

        warnPlanning(topic, situation, notes);
    }

    /**
     * "Beispielantwort" of Teil 3: one possible planning conversation between A and B. It is learner help shown on request, kept apart from the
     * task (the task itself never contains a dialogue) and never the only correct plan.
     */
    private Map<String, Object> readPlanningSolution(JsonNode node, int noteCount) {
        Map<String, Object> solution = new LinkedHashMap<>();
        List<Map<String, Object>> dialogue = new ArrayList<>();
        solution.put("dialogue", dialogue);
        if (node == null || node.isNull()) {
            issues.add(warning("SOLUTION_MISSING", p + "possibleSolution", "No possible solution (mögliche Lösung) is given; learners will see no sample conversation."));
            return solution;
        }
        JsonNode array = node.isObject() ? node.get("dialogue") : null;
        if (array == null || !array.isArray()) {
            issues.add(error("SOLUTION_INVALID", p + "possibleSolution", "possibleSolution must be an object with a dialogue array of turns {speaker, text}."));
            return solution;
        }
        if (array.size() < MIN_SOLUTION_TURNS || array.size() > MAX_SOLUTION_TURNS) {
            issues.add(error("SOLUTION_INVALID", p + "possibleSolution.dialogue", "The sample conversation needs " + MIN_SOLUTION_TURNS + " to " + MAX_SOLUTION_TURNS + " turns (found " + array.size() + ")."));
        }
        for (int i = 0; i < array.size() && i < MAX_SOLUTION_TURNS; i++) {
            JsonNode turn = array.get(i);
            String path = p + "possibleSolution.dialogue[" + i + "]";
            String speaker = turn != null && turn.isObject() ? text(turn, "speaker") : null;
            String text = turn != null && turn.isObject() ? text(turn, "text") : null;
            if (speaker == null || !(speaker.equalsIgnoreCase("A") || speaker.equalsIgnoreCase("B"))) {
                issues.add(error("SOLUTION_INVALID", path + ".speaker", "speaker must be A or B."));
                continue;
            }
            if (text == null) {
                issues.add(error("SOLUTION_INVALID", path + ".text", "Turn " + (i + 1) + " has no text."));
                continue;
            }
            if (text.length() > MAX_TURN) issues.add(error("SOLUTION_INVALID", path + ".text", "A turn may be at most " + MAX_TURN + " characters."));
            strings.add(text);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("speaker", speaker.toUpperCase(Locale.ROOT));
            entry.put("text", text);
            dialogue.add(entry);
        }
        if (dialogue.stream().map(d -> d.get("speaker")).distinct().count() < 2 && !dialogue.isEmpty()) {
            issues.add(warning("SOLUTION_ONE_SPEAKER", p + "possibleSolution.dialogue", "Only one speaker takes part; a joint plan needs both A and B."));
        }
        if (noteCount > 0 && !dialogue.isEmpty()) {
            String all = TextSimilarity.normalize(dialogue.stream().map(d -> (String) d.get("text")).collect(java.util.stream.Collectors.joining(" ")));
            long covered = notesLabels.stream().filter(label -> shareStem(stems(label), all)).count();
            if (covered < Math.min(2, notesLabels.size())) {
                issues.add(warning("SOLUTION_IGNORES_NOTES", p + "possibleSolution.dialogue", "The sample conversation hardly touches the planning notes; check that it shows a plan for them."));
            }
        }
        return solution;
    }

    private List<Map<String, Object>> readNotes(JsonNode node) {
        List<Map<String, Object>> notes = new ArrayList<>();
        JsonNode array = node.get("planningNotes");
        if (array == null || !array.isArray()) {
            issues.add(error("NOTES_MISSING", p + "planningNotes", "planningNotes must be an array of " + DtzOralSchema.MIN_NOTES + " to " + DtzOralSchema.MAX_NOTES + " short notes."));
            return notes;
        }
        if (array.size() < DtzOralSchema.MIN_NOTES || array.size() > DtzOralSchema.MAX_NOTES) {
            issues.add(error("NOTES_COUNT", p + "planningNotes", "Between " + DtzOralSchema.MIN_NOTES + " and " + DtzOralSchema.MAX_NOTES + " planning notes are required (found " + array.size() + ")."));
        }
        Set<String> seen = new LinkedHashSet<>();
        for (int i = 0; i < array.size(); i++) {
            JsonNode n = array.get(i);
            String path = p + "planningNotes[" + i + "]";
            String label;
            if (n != null && n.isTextual()) {
                label = n.asText().isBlank() ? null : n.asText().trim();
            } else if (n != null && n.isObject()) {
                JsonNode number = n.get("number");
                if (number != null && !number.isNull() && (!number.isIntegralNumber() || number.asInt() != i + 1)) {
                    issues.add(error("NOTE_NUMBER", path + ".number", "The planning notes are numbered 1, 2, 3 ... in order; this one must be number " + (i + 1) + "."));
                }
                label = text(n, "label");
            } else {
                issues.add(error("NOTE_NOT_OBJECT", path, "Each planning note must be an object with number and label."));
                continue;
            }
            if (label == null) {
                issues.add(error("NOTE_EMPTY", path + ".label", "Planning note " + (i + 1) + " is empty."));
                continue;
            }
            if (label.length() > MAX_NOTE) issues.add(error("NOTE_TOO_LONG", path + ".label", "A planning note may be at most " + MAX_NOTE + " characters; notes are short keywords."));
            if (!PLACEHOLDER.matcher(label).matches() && !seen.add(TextSimilarity.normalize(label))) {
                issues.add(error("NOTE_DUPLICATE", path + ".label", "Planning note \"" + label + "\" is used more than once."));
                continue;
            }
            strings.add(label);
            Map<String, Object> note = new LinkedHashMap<>();
            note.put("number", notes.size() + 1);
            note.put("label", label);
            notes.add(note);
            notesLabels.add(label);
        }
        return notes;
    }

    private void warnPlanning(String topic, String situation, List<Map<String, Object>> notes) {
        List<String> labels = notes.stream().map(n -> (String) n.get("label")).toList();
        if (situation != null && !JOINT_SIGNAL.matcher(situation).find()) {
            issues.add(warning("SITUATION_NOT_JOINT", p + "situation", "The situation does not say that the two participants plan or organise something together (e.g. \"Sie beide organisieren ...\")."));
        }
        if (labels.size() == DtzOralSchema.HIKING_EXAMPLE_NOTES.size()
                && labels.stream().map(TextSimilarity::normalize).toList().equals(DtzOralSchema.HIKING_EXAMPLE_NOTES.stream().map(TextSimilarity::normalize).toList())) {
            issues.add(warning("HIKING_EXAMPLE_COPIED", p + "planningNotes", "These are exactly the planning notes of the hiking example. Choose notes that fit this situation."));
        }
        long open = labels.stream().filter(l -> l.endsWith("?")).count();
        if (!labels.isEmpty() && open < Math.max(2, labels.size() / 2)) {
            issues.add(warning("NOTES_NOT_OPEN", p + "planningNotes", "Most notes should be open questions (\"Wohin?\", \"Wer kommt?\") so that the participants have decisions to make together."));
        }
        String context = stems((topic == null ? "" : topic) + " " + (situation == null ? "" : situation));
        for (int i = 0; i < labels.size(); i++) {
            String label = labels.get(i);
            String key = TextSimilarity.normalize(label);
            if (GENERIC_NOTES.contains(key)) continue;
            String noteStems = stems(label);
            if (!noteStems.isBlank() && !shareStem(noteStems, context)) {
                issues.add(warning("NOTE_UNRELATED", p + "planningNotes[" + i + "]", "The note \"" + label + "\" does not seem to fit the situation; check that it supports the joint plan."));
            }
        }
    }

    // ------------------------------------------------------------------ helpers

    private String readInstructionText(JsonNode node) {
        String instructions = text(node, "instructions");
        if (instructions == null && node.get("instructions") != null && node.get("instructions").isObject()) instructions = text(node.get("instructions"), "de");
        if (instructions != null) {
            if (instructions.length() > MAX_TEXT) issues.add(error("PRACTICE_TOO_LONG", p + "instructions", "instructions are too long."));
            strings.add(instructions);
        }
        return instructions;
    }

    /** Optional multilingual explanation ({de, en, fa}); the only place where non-German text is allowed. */
    private Map<String, Object> readExplanation(JsonNode node, String path) {
        Map<String, Object> out = new LinkedHashMap<>();
        if (node == null || node.isNull()) return out;
        if (!node.isObject()) {
            issues.add(error("FIELD_TYPE", path, "explanation must be an object with the languages de, en or fa."));
            return out;
        }
        for (String lang : List.of("de", "en", "fa")) {
            String value = text(node, lang);
            if (value == null) continue;
            if (value.length() > MAX_TEXT) issues.add(error("FIELD_TYPE", path + "." + lang, "The explanation is longer than " + MAX_TEXT + " characters."));
            if (MARKUP.matcher(value).find()) issues.add(error("HTML_CONTENT", path + "." + lang, "The explanation must be plain text without HTML."));
            out.put(lang, value);
        }
        return out;
    }

    private String optional(JsonNode node, String field, int max) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) return null;
        if (!value.isTextual()) {
            issues.add(error("FIELD_TYPE", p + field, field + " must be a text."));
            return null;
        }
        String s = text(node, field);
        if (s != null) {
            if (s.length() > max) issues.add(error("PRACTICE_TOO_LONG", p + field, field + " is longer than " + max + " characters."));
            strings.add(s);
        }
        return s;
    }

    private String singleLine(JsonNode node, String field, int max, String tooLongCode) {
        JsonNode value = node.get(field);
        if (value != null && !value.isNull() && !value.isTextual()) {
            issues.add(error("FIELD_TYPE", p + field, field + " must be a text."));
            return null;
        }
        String s = text(node, field);
        if (s != null) {
            if (s.length() > max) issues.add(error(tooLongCode, p + field, field + " may be at most " + max + " characters."));
            strings.add(s);
        }
        return s;
    }

    private List<String> stringList(JsonNode node, String field, String path, int min, int max, int maxLength, String tooLongCode, boolean required) {
        List<String> out = new ArrayList<>();
        JsonNode array = node.get(field);
        if (array == null || array.isNull()) {
            if (required) issues.add(error(tooLongCode, path + "." + field, field + " is required."));
            return out;
        }
        if (!array.isArray()) {
            issues.add(error(tooLongCode, path + "." + field, field + " must be an array of texts."));
            return out;
        }
        if (array.size() > max) issues.add(error(tooLongCode, path + "." + field, field + " may have at most " + max + " entries."));
        for (int i = 0; i < array.size() && out.size() < max; i++) {
            JsonNode v = array.get(i);
            if (v == null || !v.isTextual() || v.asText().isBlank()) {
                issues.add(error(tooLongCode, path + "." + field + "[" + i + "]", "Entry " + (i + 1) + " of " + field + " is empty."));
                continue;
            }
            String s = v.asText().trim();
            if (s.length() > maxLength) issues.add(error(tooLongCode, path + "." + field + "[" + i + "]", "Entry " + (i + 1) + " of " + field + " is longer than " + maxLength + " characters."));
            strings.add(s);
            out.add(s);
        }
        return out;
    }

    private void checkContent() {
        for (String s : strings) {
            if (s == null) continue;
            if (MARKUP.matcher(s).find()) {
                issues.add(error("HTML_CONTENT", p.isEmpty() ? "$" : p.substring(0, p.length() - 1), "Plain text only: HTML or script content is not allowed (\"" + abbreviate(s) + "\")."));
                return;
            }
        }
        for (String s : strings) {
            if (s != null && PLACEHOLDER.matcher(s).matches()) {
                issues.add(error("PLACEHOLDER_CONTENT", p.isEmpty() ? "$" : p.substring(0, p.length() - 1), "Placeholder text (\"" + abbreviate(s) + "\") must be replaced with real content."));
                return;
            }
        }
    }

    private static String abbreviate(String s) {
        return s.length() > 40 ? s.substring(0, 40) + "…" : s;
    }

    private static boolean sameText(String a, String b) {
        return a != null && a.replaceAll("\\s+", " ").trim().equals(b.replaceAll("\\s+", " ").trim());
    }

    private static boolean samePrompts(List<String> found, List<String> expected) {
        if (found.size() != expected.size()) return false;
        for (int i = 0; i < expected.size(); i++) {
            if (!sameText(found.get(i), expected.get(i))) return false;
        }
        return true;
    }

    /** Normalised text (lower-case, umlauts folded) used for the rough topic match. */
    private static String stems(String text) {
        return TextSimilarity.normalize(text);
    }

    /**
     * True when a word start (first five letters of a word of at least four letters) of one text appears in the other. A word start inside a
     * compound counts too ("kaufe" in "einkaufen"), so German compounds do not hide a match.
     */
    private static boolean shareStem(String a, String b) {
        return startsIn(a, b) || startsIn(b, a);
    }

    private static boolean startsIn(String words, String haystack) {
        for (String word : words.split(" ")) {
            if (word.length() >= 4 && haystack.contains(word.substring(0, Math.min(5, word.length())))) return true;
        }
        return false;
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
