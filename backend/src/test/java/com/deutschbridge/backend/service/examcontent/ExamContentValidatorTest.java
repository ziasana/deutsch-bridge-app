package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.Issue;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.deutschbridge.backend.service.examcontent.ExamContentTestData.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamContentValidatorTest {

    private final ExamContentValidator validator = new ExamContentValidator();

    private static List<String> errorCodes(ExamContentValidator.FileResult result, int index) {
        return result.exerciseIssues().get(index).stream()
                .filter(i -> ExamContentValidator.ERROR.equals(i.severity())).map(Issue::code).toList();
    }

    private static List<String> warningCodes(ExamContentValidator.FileResult result, int index) {
        return result.exerciseIssues().get(index).stream()
                .filter(i -> ExamContentValidator.WARNING.equals(i.severity())).map(Issue::code).toList();
    }

    @Test
    @DisplayName("a well-formed batch has no errors and resolves the TELC B1 Lesen Teil 1 spec")
    void validBatch() {
        var result = validator.validate(batch(exercise("B1-L1-001", 1), exercise("B1-L1-002", 2)));
        assertTrue(result.fileIssues().isEmpty());
        assertEquals(2, result.exercises().size());
        assertTrue(errorCodes(result, 0).isEmpty(), errorCodes(result, 0).toString());
        assertTrue(errorCodes(result, 1).isEmpty());
        assertNotNull(result.exercises().get(0).spec());
    }

    @Test
    @DisplayName("a single EXAM_EXERCISE file is read from the root")
    void singleExercise() {
        ObjectNode root = exercise("B1-L1-001", 1);
        root.put("schemaVersion", "1.0").put("contentType", "EXAM_EXERCISE").put("exam", "TELC")
                .put("level", "B1").put("section", "LESEN").put("part", "TEIL_1");
        var result = validator.validate(root);
        assertEquals(1, result.exercises().size());
        assertTrue(errorCodes(result, 0).isEmpty());
    }

    @Test
    void unsupportedSchemaVersionAndContentType() {
        ObjectNode root = batch(exercise("B1-L1-001", 1));
        root.put("schemaVersion", "9.9");
        assertEquals("SCHEMA_VERSION_UNSUPPORTED", validator.validate(root).fileIssues().get(0).code());

        ObjectNode bad = batch(exercise("B1-L1-001", 1));
        bad.put("contentType", "NOPE");
        assertEquals("CONTENT_TYPE_INVALID", validator.validate(bad).fileIssues().get(0).code());
    }

    @Test
    void elevenHeadings() {
        ObjectNode ex = exercise("B1-L1-001", 1);
        ((ArrayNode) ex.get("headings")).addObject().put("id", "k").put("text", "Elfte Ueberschrift");
        var codes = errorCodes(validator.validate(batch(ex)), 0);
        assertTrue(codes.contains("HEADING_COUNT"));
        assertTrue(codes.contains("HEADING_IDS"));
    }

    @Test
    void nineHeadings() {
        ObjectNode ex = exercise("B1-L1-001", 1);
        ((ArrayNode) ex.get("headings")).remove(9);
        var codes = errorCodes(validator.validate(batch(ex)), 0);
        assertTrue(codes.contains("HEADING_COUNT"));
        assertTrue(codes.contains("HEADING_IDS"));
    }

    @Test
    void fourAndSixTexts() {
        ObjectNode four = exercise("B1-L1-001", 1);
        ((ArrayNode) four.get("texts")).remove(4);
        assertTrue(errorCodes(validator.validate(batch(four)), 0).contains("TEXT_COUNT"));

        ObjectNode six = exercise("B1-L1-002", 2);
        ((ArrayNode) six.get("texts")).addObject().put("id", "text_6").put("content", text(99)).put("correctHeadingId", "b");
        assertTrue(errorCodes(validator.validate(batch(six)), 0).contains("TEXT_COUNT"));
    }

    @Test
    void duplicateAnswer() {
        ObjectNode ex = exercise("B1-L1-001", 1);
        ((ObjectNode) ex.get("texts").get(1)).put("correctHeadingId", "e");
        assertTrue(errorCodes(validator.validate(batch(ex)), 0).contains("CORRECT_HEADING_REUSED"));
    }

    @Test
    void invalidAnswerReference() {
        ObjectNode ex = exercise("B1-L1-001", 1);
        ((ObjectNode) ex.get("texts").get(0)).put("correctHeadingId", "z");
        assertTrue(errorCodes(validator.validate(batch(ex)), 0).contains("CORRECT_HEADING_UNKNOWN"));
    }

    @Test
    void missingAnswerEmptyHeadingAndEmptyText() {
        ObjectNode ex = exercise("B1-L1-001", 1);
        ((ObjectNode) ex.get("texts").get(0)).remove("correctHeadingId");
        ((ObjectNode) ex.get("headings").get(0)).put("text", "  ");
        ((ObjectNode) ex.get("texts").get(1)).put("content", "");
        var codes = errorCodes(validator.validate(batch(ex)), 0);
        assertTrue(codes.contains("CORRECT_HEADING_MISSING"));
        assertTrue(codes.contains("HEADING_TEXT_EMPTY"));
        assertTrue(codes.contains("TEXT_EMPTY"));
    }

    @Test
    void invalidIds() {
        ObjectNode ex = exercise("B1-L1-001", 1);
        ((ObjectNode) ex.get("headings").get(0)).put("id", "x");
        ((ObjectNode) ex.get("texts").get(0)).put("id", "text_9");
        var codes = errorCodes(validator.validate(batch(ex)), 0);
        assertTrue(codes.contains("HEADING_IDS"));
        assertTrue(codes.contains("TEXT_IDS"));
    }

    @Test
    void emptyInstructionsAndTitle() {
        ObjectNode ex = exercise("B1-L1-001", 1);
        ex.put("instructions", "");
        ex.remove("title");
        var codes = errorCodes(validator.validate(batch(ex)), 0);
        assertTrue(codes.contains("INSTRUCTIONS_MISSING"));
        assertTrue(codes.contains("TITLE_MISSING"));
    }

    @Test
    void textLengthIsOnlyAWarning() {
        ObjectNode ex = exercise("B1-L1-001", 1);
        ((ObjectNode) ex.get("texts").get(0)).put("content", "Viel zu kurz.");
        var result = validator.validate(batch(ex));
        assertTrue(errorCodes(result, 0).isEmpty());
        assertTrue(warningCodes(result, 0).contains("TEXT_LENGTH"));
    }

    @Test
    void textFieldAliasIsAccepted() {
        ObjectNode ex = exercise("B1-L1-001", 1);
        ObjectNode first = (ObjectNode) ex.get("texts").get(0);
        String content = first.get("content").asText();
        first.remove("content");
        first.put("text", content);
        assertTrue(errorCodes(validator.validate(batch(ex)), 0).isEmpty());
    }

    @Test
    void duplicateExternalIdInFile() {
        var result = validator.validate(batch(exercise("B1-L1-001", 1), exercise("B1-L1-001", 2)));
        assertTrue(errorCodes(result, 1).contains("EXTERNAL_ID_DUPLICATE_IN_FILE"));
    }

    @Test
    void duplicateHeadingTextIsAnError_andSimilarHeadingsAWarning() {
        ObjectNode ex = exercise("B1-L1-001", 1);
        String first = ex.get("headings").get(0).get("text").asText();
        ((ObjectNode) ex.get("headings").get(1)).put("text", first.toUpperCase());
        assertTrue(errorCodes(validator.validate(batch(ex)), 0).contains("HEADING_TEXT_DUPLICATE"));

        ObjectNode similar = exercise("B1-L1-002", 2);
        ((ObjectNode) similar.get("headings").get(0)).put("text", "Gemeinsam Kleidung tauschen am Samstag");
        ((ObjectNode) similar.get("headings").get(1)).put("text", "Gemeinsam Kleidung tauschen am Sonntag");
        assertTrue(warningCodes(validator.validate(batch(similar)), 0).contains("HEADING_SIMILAR"));
    }

    @Test
    void predictableAnswerSequenceWarns() {
        ObjectNode ex = exercise("B1-L1-001", 1);
        List<String> seq = List.of("a", "b", "c", "d", "e");
        for (int i = 0; i < 5; i++) ((ObjectNode) ex.get("texts").get(i)).put("correctHeadingId", seq.get(i));
        assertTrue(warningCodes(validator.validate(batch(ex)), 0).contains("ANSWER_SEQUENCE_PREDICTABLE"));
    }

    @Test
    void otherExamsAreRecognisedButHaveNoSpecYet() {
        ObjectNode root = batch(exercise("TESTDAF-B2-L1-001", 1));
        root.put("exam", "DAFTEST");
        root.put("level", "B2");
        var result = validator.validate(root);
        assertTrue(errorCodes(result, 0).contains("SPEC_UNSUPPORTED"));
        assertNull(result.exercises().get(0).spec());

        root.put("exam", "KLINGON");
        assertTrue(errorCodes(validator.validate(root), 0).contains("EXAM_INVALID"));
    }

    @Test
    void batchLimitAndEmptyBatch() {
        ObjectNode empty = batch();
        assertEquals("EXERCISES_MISSING", validator.validate(empty).fileIssues().get(0).code());
        ObjectNode[] many = new ObjectNode[ExamContentValidator.MAX_EXERCISES_PER_FILE + 1];
        for (int i = 0; i < many.length; i++) many[i] = exercise("B1-L1-" + i, i);
        assertEquals("TOO_MANY_EXERCISES", validator.validate(batch(many)).fileIssues().get(0).code());
    }
}
