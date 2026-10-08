package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.Issue;
import com.deutschbridge.backend.model.dto.ExamContentDtos.PromptRequest;
import com.deutschbridge.backend.model.dto.ExamContentDtos.PromptResponse;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.enums.ExamContentStatus;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** TELC B1 Lesen Teil 2: one reading text, five multiple-choice questions. */
class ExamContentReadingTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final List<String> TYPES = List.of("EXPLICIT_INFORMATION", "PARAPHRASE", "DETAIL_COMPREHENSION", "MAIN_IDEA", "LOGICAL_UNDERSTANDING");
    private static final List<String> KEY = List.of("b", "c", "a", "b", "c");

    private final ExamContentValidator validator = new ExamContentValidator();
    private final ExamContentSpec spec = ExamContentSpecs.find(ExamType.TELC, com.deutschbridge.backend.model.enums.LearningLevel.B1,
            com.deutschbridge.backend.model.enums.ExamSection.LESEVERSTEHEN, 2).orElseThrow();

    private static String longText(int words) {
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < words; i++) b.append("wort").append(i % 97).append(i % 2 == 0 ? " " : "x ");
        return b.toString().trim() + ".";
    }

    private static ObjectNode exercise(String externalId) {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("externalId", externalId);
        ex.put("title", "Ein Tauschmarkt im Stadtteil");
        ex.put("instructions", "Lesen Sie den Text und die Aufgaben 6 bis 10. Wählen Sie bei jeder Aufgabe die richtige Lösung.");
        ex.putObject("text").put("content", longText(400));
        ArrayNode questions = ex.putArray("questions");
        for (int i = 0; i < 5; i++) {
            ObjectNode q = questions.addObject();
            q.put("id", "question_" + (i + 1));
            q.put("number", 6 + i);
            q.put("question", "Frage Nummer " + (i + 1) + "?");
            ArrayNode options = q.putArray("options");
            for (String id : List.of("a", "b", "c")) {
                options.addObject().put("id", id).put("text", "Antwort " + id + " zu Frage " + (i + 1) + " mit " + "x".repeat(i + id.charAt(0) - 'a'));
            }
            q.put("correctOptionId", KEY.get(i));
            q.put("questionType", TYPES.get(i));
        }
        ex.putObject("metadata").put("difficulty", "DIFFICULT").putArray("topics").add("SOCIETY");
        return ex;
    }

    private static ObjectNode batch(ObjectNode... exercises) {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", "1.0");
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", "TELC");
        root.put("level", "B1");
        root.put("section", "LESEN");
        root.put("part", "TEIL_2");
        ArrayNode array = root.putArray("exercises");
        for (ObjectNode e : exercises) array.add(e);
        return root;
    }

    private static List<String> errors(ExamContentValidator.FileResult r) {
        return r.exerciseIssues().get(0).stream().filter(i -> "ERROR".equals(i.severity())).map(Issue::code).toList();
    }

    private static List<String> warnings(ExamContentValidator.FileResult r) {
        return r.exerciseIssues().get(0).stream().filter(i -> "WARNING".equals(i.severity())).map(Issue::code).toList();
    }

    @Test
    void validExerciseResolvesTheMultipleChoiceSpec() {
        var result = validator.validate(batch(exercise("B1-L2-001")));
        assertTrue(result.fileIssues().isEmpty());
        assertTrue(errors(result).isEmpty(), errors(result).toString());
        ParsedExercise parsed = result.exercises().get(0);
        assertTrue(parsed.spec().isMultipleChoice());
        assertEquals(5, parsed.questions().size());
        assertNotNull(parsed.readingText());
        assertEquals("HARD", parsed.metadata().get("difficulty"), "DIFFICULT is accepted and stored as HARD");
        assertEquals("B1-L2-", spec.externalIdPrefix());
    }

    @Test
    void plainStringTextIsAccepted() {
        ObjectNode ex = exercise("B1-L2-001");
        ex.put("text", longText(400));
        var result = validator.validate(batch(ex));
        assertTrue(errors(result).isEmpty(), errors(result).toString());
    }

    @Test
    void structuralErrorsAreReported() {
        ObjectNode ex = exercise("B1-L2-001");
        ex.remove("text");
        ((ArrayNode) ex.get("questions")).remove(4);
        ObjectNode q = (ObjectNode) ex.get("questions").get(0);
        ((ArrayNode) q.get("options")).remove(2);
        ((ObjectNode) ex.get("questions").get(1)).put("correctOptionId", "z");
        var codes = errors(validator.validate(batch(ex)));
        assertTrue(codes.contains("READING_TEXT_MISSING"), codes.toString());
        assertTrue(codes.contains("QUESTION_COUNT"), codes.toString());
        assertTrue(codes.contains("OPTION_COUNT"), codes.toString());
        assertTrue(codes.contains("CORRECT_OPTION_UNKNOWN"), codes.toString());
    }

    @Test
    void duplicateQuestionsAndOptionsAreErrors() {
        ObjectNode ex = exercise("B1-L2-001");
        ((ObjectNode) ex.get("questions").get(1)).put("question", ex.get("questions").get(0).get("question").asText());
        ((ObjectNode) ex.get("questions").get(2).get("options").get(1)).put("text", ex.get("questions").get(2).get("options").get(0).get("text").asText());
        var codes = errors(validator.validate(batch(ex)));
        assertTrue(codes.contains("QUESTION_TEXT_DUPLICATE"));
        assertTrue(codes.contains("OPTION_TEXT_DUPLICATE"));
    }

    @Test
    void shortTextAndBadQuestionTypeAreOnlyWarnings() {
        ObjectNode ex = exercise("B1-L2-001");
        ((ObjectNode) ex.get("text")).put("content", longText(60));
        ((ObjectNode) ex.get("questions").get(0)).put("questionType", "TRICKY");
        var result = validator.validate(batch(ex));
        assertTrue(errors(result).isEmpty());
        assertTrue(warnings(result).contains("TEXT_LENGTH"));
        assertTrue(warnings(result).contains("QUESTION_TYPE_UNKNOWN"));
    }

    @Test
    void sameAnswerPositionEverywhereIsWarned() {
        ObjectNode ex = exercise("B1-L2-001");
        for (var q : ex.get("questions")) ((ObjectNode) q).put("correctOptionId", "a");
        assertTrue(warnings(validator.validate(batch(ex))).contains("ANSWER_POSITIONS_SAME"));
    }

    @Test
    void importedEntityIsAMultipleChoiceExerciseAndExportsBackToTheSameShape() {
        var result = validator.validate(batch(exercise("B1-L2-001")));
        ParsedExercise parsed = result.exercises().get(0);
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.TELC, "1.0", "1.0", "hash", "user");

        assertEquals(ExamTaskType.MULTIPLE_CHOICE, entity.getTaskType());
        assertEquals(2, entity.getPartNumber());
        assertEquals(ExamContentStatus.DRAFT, entity.getStatus());
        assertEquals(1, entity.getPassages().size());
        assertEquals(5, entity.getQuestions().size());
        assertEquals(6, entity.getQuestions().get(0).getQuestionNumber());
        var first = entity.getQuestions().get(0);
        assertEquals(3, first.getOptions().size());
        assertEquals(first.getOptions().get(1), first.getCorrectAnswer(), "correct answer 'b' is stored as that option's text");
        assertNull(entity.getAnswerOptions());

        ObjectNode exported = ExamContentMapper.toExportNode(MAPPER, entity);
        assertNotNull(exported);
        assertEquals("B1-L2-001", exported.get("externalId").asText());
        assertEquals(5, exported.get("questions").size());
        assertEquals("b", exported.get("questions").get(0).get("correctOptionId").asText());
        assertEquals("PARAPHRASE", exported.get("questions").get(1).get("questionType").asText());
        assertFalse(exported.get("metadata").has("questionTypes"));

        // The export must be importable again without errors.
        var again = validator.validate(batch(exported));
        assertTrue(errors(again).isEmpty(), errors(again).toString());
    }

    @Test
    void fingerprintAndDuplicateDetectionUseTheReadingText() {
        var parsed = validator.validate(batch(exercise("B1-L2-001"))).exercises().get(0);
        assertEquals(List.of(parsed.readingText()), parsed.textContents());
        String hash = ExamContentFingerprint.hashTexts(parsed.textContents());
        var twin = validator.validate(batch(exercise("B1-L2-002"))).exercises().get(0);
        var matches = new ExamDuplicateDetector().detect(twin, ExamType.TELC, hash,
                List.of(ExamDuplicateDetector.Candidate.of(parsed, ExamType.TELC, hash)));
        assertEquals("BATCH_EXACT", matches.get(0).kind());
    }

    @Test
    void promptIsBuiltFromTheSpecAndItsExampleIsValid() throws Exception {
        PromptResponse r = new ExamContentPromptBuilder().build(spec,
                new PromptRequest("TELC", "B1", "LESEN", "TEIL_2", 10, "MIXED", List.of("WORK", "FAMILY"), null), 0, 1);
        assertFalse(r.prompt().contains("{{"), "unresolved placeholder");
        assertTrue(r.prompt().contains("Generate exactly 10 exercise sets"));
        assertTrue(r.prompt().contains("B1-L2-001"));
        assertTrue(r.prompt().contains("Exactly 5 multiple-choice questions"));
        assertTrue(r.prompt().contains("numbered 6 to 10"));
        assertTrue(r.prompt().contains("350-550 words"));
        assertTrue(r.prompt().contains("Return ONLY valid JSON"));

        var root = MAPPER.readTree(r.jsonExample());
        assertEquals("TEIL_2", root.get("part").asText());
        assertEquals(5, root.get("exercises").get(0).get("questions").size());
        assertEquals(3, root.get("exercises").get(0).get("questions").get(0).get("options").size());
        assertTrue(ExamImportParser.parse(r.jsonExample()).ok());
    }
}
