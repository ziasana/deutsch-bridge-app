package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.Issue;
import com.deutschbridge.backend.model.dto.ExamContentDtos.PromptRequest;
import com.deutschbridge.backend.model.dto.ExamContentDtos.PromptResponse;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.enums.ExamContentStatus;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** TELC B1 Sprachbausteine Teil 1: one text with gaps [21]..[30], three options per gap. */
class ExamContentGapTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final List<String> KEY = List.of("b", "a", "c", "b", "a", "c", "a", "b", "c", "a");
    private static final List<String> CATEGORIES = List.of("KONJUNKTION", "ARTIKEL", "VERBFORM", "ADJEKTIVENDUNG", "PRAEPOSITION",
            "VERBFORM", "RELATIVPRONOMEN", "POSSESSIVARTIKEL", "PERSONALPRONOMEN", "SATZSTRUKTUR");

    private final ExamContentValidator validator = new ExamContentValidator();
    private final ExamContentSpec spec = ExamContentSpecs.find(ExamType.TELC, LearningLevel.B1, ExamSection.SPRACHBAUSTEINE, 1).orElseThrow();

    private static String text() {
        StringBuilder b = new StringBuilder("Liebe Karin,\n\n");
        for (int n = 21; n <= 30; n++) {
            b.append("Satz mit vielen Wörtern und einer Lücke [").append(n).append("] mitten im Text, damit er lang genug wird. ");
            b.append("Noch ein zweiter Satz für mehr Länge hier im Brief und ein dritter dazu.\n\n");
        }
        return b.append("Viele Grüße").toString();
    }

    private static ObjectNode exercise(String externalId) {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("externalId", externalId);
        ex.put("title", "Sprachbausteine Teil 1 – Praktikum");
        ex.putObject("instructions").put("de", "Lesen Sie den Text und schließen Sie die Lücken 21–30.");
        ex.put("textType", "EMAIL");
        ex.put("topic", "Praktikum und Beruf");
        ex.put("text", text());
        ArrayNode questions = ex.putArray("questions");
        for (int i = 0; i < 10; i++) {
            ObjectNode q = questions.addObject();
            q.put("number", 21 + i);
            ArrayNode options = q.putArray("options");
            for (String key : List.of("a", "b", "c")) options.addObject().put("key", key).put("text", "Option " + key + (21 + i));
            q.put("correctAnswer", KEY.get(i));
            q.put("category", CATEGORIES.get(i));
            q.put("grammarFocus", "focus_" + i);
            q.putObject("explanation").put("de", "Erklärung " + i).put("en", "Explanation " + i).put("fa", "توضیح " + i);
        }
        ex.putObject("metadata").put("difficulty", "MEDIUM").putArray("topics").add("WORK");
        return ex;
    }

    private static ObjectNode batch(ObjectNode... exercises) {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", "1.0");
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", "TELC");
        root.put("level", "B1");
        root.put("section", "SPRACHBAUSTEINE");
        root.put("part", "TEIL_1");
        ArrayNode array = root.putArray("exercises");
        for (ObjectNode e : exercises) array.add(e);
        return root;
    }

    private static List<String> codes(ExamContentValidator.FileResult r, String severity) {
        return r.exerciseIssues().get(0).stream().filter(i -> severity.equals(i.severity())).map(Issue::code).toList();
    }

    @Test
    void validExerciseResolvesTheGapSpec() {
        var result = validator.validate(batch(exercise("B1-SB1-001")));
        assertTrue(result.fileIssues().isEmpty());
        assertTrue(codes(result, "ERROR").isEmpty(), codes(result, "ERROR").toString());
        ParsedExercise parsed = result.exercises().get(0);
        assertTrue(parsed.spec().isGapText());
        assertEquals(10, parsed.questions().size());
        assertEquals("B1-SB1-", spec.externalIdPrefix());
        assertEquals("Erklärung 0", parsed.questions().get(0).explanations().get("de"));
        assertEquals("EMAIL", parsed.metadata().get("textType"));
        assertEquals("Lesen Sie den Text und schließen Sie die Lücken 21–30.", parsed.instructions());
    }

    @Test
    void gapMarkersMustMatchTheQuestions() {
        ObjectNode ex = exercise("B1-SB1-001");
        ex.put("text", text().replace("[23]", "___").replace("[25]", "[24]").replace("[30]", "[31]"));
        var codes = codes(validator.validate(batch(ex)), "ERROR");
        assertTrue(codes.contains("GAP_MARKER_MISSING"), codes.toString());
        assertTrue(codes.contains("GAP_MARKER_DUPLICATE"), codes.toString());
        assertTrue(codes.contains("GAP_MARKER_UNEXPECTED"), codes.toString());
    }

    @Test
    void structuralErrorsAreReported() {
        ObjectNode ex = exercise("B1-SB1-001");
        ((ArrayNode) ex.get("questions")).remove(9);
        ((ArrayNode) ex.get("questions").get(0).get("options")).remove(2);
        ((ObjectNode) ex.get("questions").get(1)).put("correctAnswer", "d");
        var codes = codes(validator.validate(batch(ex)), "ERROR");
        assertTrue(codes.contains("QUESTION_COUNT"));
        assertTrue(codes.contains("OPTION_COUNT"));
        assertTrue(codes.contains("CORRECT_OPTION_UNKNOWN"));
    }

    @Test
    void qualityHintsAreWarningsOnly() {
        ObjectNode ex = exercise("B1-SB1-001");
        for (var q : ex.get("questions")) {
            ((ObjectNode) q).put("category", "ARTIKEL");
            ((ObjectNode) q).put("correctAnswer", "a");
        }
        ((ObjectNode) ex.get("questions").get(0)).put("category", "KAUSALITAET");
        var result = validator.validate(batch(ex));
        assertTrue(codes(result, "ERROR").isEmpty());
        var warnings = codes(result, "WARNING");
        assertTrue(warnings.contains("CATEGORY_DOMINATES"), warnings.toString());
        assertTrue(warnings.contains("CATEGORY_VARIETY"), warnings.toString());
        assertTrue(warnings.contains("CATEGORY_UNKNOWN"), warnings.toString());
        assertTrue(warnings.contains("ANSWER_POSITIONS_SAME"), warnings.toString());
    }

    @Test
    void skewedAnswerPositionsAreWarned() {
        ObjectNode ex = exercise("B1-SB1-001");
        for (int i = 0; i < 8; i++) ((ObjectNode) ex.get("questions").get(i)).put("correctAnswer", "b");
        assertTrue(codes(validator.validate(batch(ex)), "WARNING").contains("ANSWER_POSITIONS_SKEWED"));
    }

    @Test
    void entityStoresGapsAsMultipleChoiceWithGapBadgesAndExportsBack() {
        ParsedExercise parsed = validator.validate(batch(exercise("B1-SB1-001"))).exercises().get(0);
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.TELC, "1.0", "1.0", "hash", "user");

        assertEquals(ExamSection.SPRACHBAUSTEINE, entity.getSection());
        assertEquals(ExamTaskType.MULTIPLE_CHOICE, entity.getTaskType());
        assertEquals(1, entity.getPartNumber());
        assertEquals(ExamContentStatus.DRAFT, entity.getStatus());
        assertTrue(entity.getPassages().get(0).getContent().contains("<span data-exam-gap=\"21\" class=\"exam-gap-marker\">21</span>"));
        assertFalse(entity.getPassages().get(0).getContent().contains("[21]"));
        var first = entity.getQuestions().get(0);
        assertEquals("Lücke 21", first.getPrompt());
        assertEquals(21, first.getGapNumber());
        assertEquals(21, first.getQuestionNumber());
        assertEquals("Option b21", first.getCorrectAnswer());
        assertEquals("Erklärung 0", first.getExplanation());
        assertNull(ExamContentService.publishProblem(entity));

        assertTrue(ExamContentMapper.toPlainText(entity.getPassages().get(0).getContent()).contains("[21]"));

        ObjectNode exported = ExamContentMapper.toExportNode(MAPPER, entity);
        assertNotNull(exported);
        assertTrue(exported.get("text").asText().contains("[30]"));
        assertEquals("EMAIL", exported.get("textType").asText());
        assertEquals("b", exported.get("questions").get(0).get("correctOptionId").asText());
        assertEquals("KONJUNKTION", exported.get("questions").get(0).get("category").asText());
        assertEquals("Explanation 0", exported.get("questions").get(0).get("explanation").get("en").asText());
        assertFalse(exported.get("metadata").has("gapQuestions"));

        var again = validator.validate(batch(exported));
        assertTrue(codes(again, "ERROR").isEmpty(), codes(again, "ERROR").toString());
    }

    @Test
    void duplicateDetectionRecognisesTheSameTextAcrossFileAndStoredForm() {
        var first = validator.validate(batch(exercise("B1-SB1-001"))).exercises().get(0);
        String hash = ExamContentFingerprint.hashTexts(first.textContents());
        var twin = validator.validate(batch(exercise("B1-SB1-002"))).exercises().get(0);
        var matches = new ExamDuplicateDetector().detect(twin, ExamType.TELC, hash,
                List.of(ExamDuplicateDetector.Candidate.of(first, ExamType.TELC, hash)));
        assertEquals("BATCH_EXACT", matches.get(0).kind());

        ExamExercise stored = ExamContentMapper.toEntity(first, ExamType.TELC, "1.0", "1.0", hash, "u");
        var again = new ExamDuplicateDetector().detect(twin, ExamType.TELC, hash, List.of(ExamDuplicateDetector.Candidate.of(stored)));
        assertEquals("EXACT", again.get(0).kind());
    }

    @Test
    void promptListsCategoriesAndItsExampleIsValid() throws Exception {
        PromptResponse r = new ExamContentPromptBuilder().build(spec,
                new PromptRequest("TELC", "B1", "SPRACHBAUSTEINE", "TEIL_1", 4, "MIXED", List.of("WORK"), null, null, "EMAIL",
                        List.of("KONJUNKTION", "ARTIKEL", "PRAEPOSITION", "VERBFORM", "RELATIVPRONOMEN", "SATZSTRUKTUR")), 0, 1);
        assertFalse(r.prompt().contains("{{"), "unresolved placeholder");
        assertTrue(r.prompt().contains("B1-SB1-001"));
        assertTrue(r.prompt().contains("Text type: all exercises are of the type EMAIL"));
        assertTrue(r.prompt().contains("test ONLY these categories"));
        assertTrue(r.prompt().contains("[21]"));
        assertTrue(r.prompt().contains("Return ONLY valid JSON"));

        var root = MAPPER.readTree(r.jsonExample());
        assertEquals("SPRACHBAUSTEINE", root.get("section").asText());
        assertEquals(10, root.get("exercises").get(0).get("questions").size());
        assertEquals("a", root.get("exercises").get(0).get("questions").get(0).get("options").get(0).get("key").asText());
        assertTrue(ExamImportParser.parse(r.jsonExample()).ok());

        assertThrows(IllegalArgumentException.class, () -> new ExamContentPromptBuilder().build(spec,
                new PromptRequest("TELC", "B1", "SPRACHBAUSTEINE", "TEIL_1", 1, "MIXED", List.of(), null, null, null, List.of("ARTIKEL", "KASUS")), 0, 1));
    }
}
