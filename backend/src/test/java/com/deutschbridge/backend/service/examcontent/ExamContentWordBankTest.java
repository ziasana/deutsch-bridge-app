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

/** TELC B1 Sprachbausteine Teil 2: gaps [31]..[40] filled from a 15-word bank a..o, each word once. */
class ExamContentWordBankTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final List<String> WORDS = List.of("AUF", "BIS", "DA", "DAMIT", "DESHALB", "EUCH", "FÜR", "IN", "NACH", "OB", "UM", "UNS", "VOM", "WANN", "WENN");
    /** Answer key per gap 31..40 (a..o), deliberately not ascending. */
    private static final List<String> KEY = List.of("g", "l", "k", "f", "j", "b", "n", "i", "e", "d");

    private final ExamContentValidator validator = new ExamContentValidator();
    private final ExamContentSpec spec = ExamContentSpecs.find(ExamType.TELC, LearningLevel.B1, ExamSection.SPRACHBAUSTEINE, 2).orElseThrow();

    private static String text() {
        StringBuilder b = new StringBuilder("Sehr geehrter Herr Janosch,\n\n");
        for (int n = 31; n <= 40; n++) {
            b.append("Satz mit vielen Wörtern und einer Lücke [").append(n).append("] mitten im Text, damit er lang genug wird, und noch etwas mehr.\n\n");
        }
        return b.append("Mit freundlichen Grüßen").toString();
    }

    private static ObjectNode exercise(String externalId, boolean withContext) {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("externalId", externalId);
        ex.put("title", "Sprachbausteine Teil 2 – Hotel");
        ex.putObject("instructions").put("de", "Jedes Wort passt nur einmal.");
        ex.put("contextType", withContext ? "ADVERTISEMENT_EMAIL" : "EMAIL");
        ex.put("topic", "Urlaub und Unterkunft");
        if (withContext) {
            ex.putObject("context").put("type", "advertisement").put("title", "Hotel-Pension Janosch")
                    .put("text", "Ruhige Lage, Wanderwege, Tennis & Freizeitprogramm für Kinder.");
        }
        ex.put("text", text());
        ArrayNode bank = ex.putArray("wordBank");
        for (int i = 0; i < WORDS.size(); i++) bank.addObject().put("key", String.valueOf((char) ('a' + i))).put("word", WORDS.get(i));
        ArrayNode questions = ex.putArray("questions");
        for (int i = 0; i < 10; i++) {
            ObjectNode q = questions.addObject();
            q.put("number", 31 + i);
            q.put("correctAnswer", KEY.get(i));
            q.put("correctWord", WORDS.get(KEY.get(i).charAt(0) - 'a'));
            q.put("grammarCategory", i % 2 == 0 ? "PRÄPOSITION" : "KONJUNKTION");
            q.put("grammarFocus", "focus_" + i);
            q.putObject("explanation").put("de", "Erklärung " + i).put("en", "Explanation " + i).put("fa", "توضیح " + i);
        }
        ex.putObject("metadata").put("difficulty", "MEDIUM").putArray("topics").add("TRAVEL");
        return ex;
    }

    private static ObjectNode batch(ObjectNode... exercises) {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", "1.0");
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", "TELC");
        root.put("level", "B1");
        root.put("section", "SPRACHBAUSTEINE");
        root.put("part", "TEIL_2");
        ArrayNode array = root.putArray("exercises");
        for (ObjectNode e : exercises) array.add(e);
        return root;
    }

    private static List<String> codes(ExamContentValidator.FileResult r, String severity) {
        return r.exerciseIssues().get(0).stream().filter(i -> severity.equals(i.severity())).map(Issue::code).toList();
    }

    @Test
    void validExerciseResolvesTheWordBankSpec() {
        var result = validator.validate(batch(exercise("B1-SB2-001", true)));
        assertTrue(result.fileIssues().isEmpty());
        assertTrue(codes(result, "ERROR").isEmpty(), codes(result, "ERROR").toString());
        assertTrue(codes(result, "WARNING").isEmpty(), codes(result, "WARNING").toString());
        ParsedExercise parsed = result.exercises().get(0);
        assertTrue(parsed.spec().isWordBank());
        assertEquals(15, parsed.wordBank().size());
        assertEquals(10, parsed.questions().size());
        assertEquals(5, spec.unusedWordCount());
        assertEquals("B1-SB2-", spec.externalIdPrefix());
        assertEquals("ADVERTISEMENT", parsed.context().type());
    }

    @Test
    void contextIsOptional() {
        var result = validator.validate(batch(exercise("B1-SB2-001", false)));
        assertTrue(codes(result, "ERROR").isEmpty(), codes(result, "ERROR").toString());
        assertNull(result.exercises().get(0).context());
    }

    @Test
    void aWordUsedForTwoGapsIsAHardError() {
        ObjectNode ex = exercise("B1-SB2-001", false);
        ((ObjectNode) ex.get("questions").get(1)).put("correctAnswer", "g").put("correctWord", "FÜR");
        var result = validator.validate(batch(ex));
        assertTrue(codes(result, "ERROR").contains("WORD_REUSED"), codes(result, "ERROR").toString());
        String message = result.exerciseIssues().get(0).stream().filter(i -> i.code().equals("WORD_REUSED")).findFirst().orElseThrow().message();
        assertTrue(message.contains("31") && message.contains("32") && message.contains("FÜR"), message);
    }

    @Test
    void wordBankStructureIsChecked() {
        ObjectNode ex = exercise("B1-SB2-001", false);
        ((ArrayNode) ex.get("wordBank")).remove(14);
        ((ObjectNode) ex.get("wordBank").get(1)).put("word", "AUF");
        ((ObjectNode) ex.get("questions").get(0)).put("correctWord", "NACH");
        ((ObjectNode) ex.get("questions").get(2)).put("correctAnswer", "z");
        var codes = codes(validator.validate(batch(ex)), "ERROR");
        assertTrue(codes.contains("WORD_BANK_COUNT"), codes.toString());
        assertTrue(codes.contains("WORD_DUPLICATE"), codes.toString());
        assertTrue(codes.contains("CORRECT_WORD_MISMATCH"), codes.toString());
        assertTrue(codes.contains("CORRECT_OPTION_UNKNOWN"), codes.toString());
    }

    @Test
    void gapMarkersAreChecked() {
        ObjectNode ex = exercise("B1-SB2-001", false);
        ex.put("text", text().replace("[33]", "___").replace("[35]", "[34]"));
        var codes = codes(validator.validate(batch(ex)), "ERROR");
        assertTrue(codes.contains("GAP_MARKER_MISSING"));
        assertTrue(codes.contains("GAP_MARKER_DUPLICATE"));
    }

    @Test
    void emptyContextTextIsAnError() {
        ObjectNode ex = exercise("B1-SB2-001", true);
        ((ObjectNode) ex.get("context")).put("text", " ");
        assertTrue(codes(validator.validate(batch(ex)), "ERROR").contains("CONTEXT_TEXT_EMPTY"));
    }

    @Test
    void qualityHintsAreWarningsOnly() {
        ObjectNode ex = exercise("B1-SB2-001", false);
        ((ObjectNode) ex.get("wordBank").get(5)).put("word", "euch");
        ((ObjectNode) ex.get("wordBank").get(2)).put("word", "DARUM");
        ((ObjectNode) ex.get("wordBank").get(12)).put("word", "ZUERST");
        var result = validator.validate(batch(ex));
        assertTrue(codes(result, "ERROR").isEmpty(), codes(result, "ERROR").toString());
        var warnings = codes(result, "WARNING");
        assertTrue(warnings.contains("WORD_NOT_UPPERCASE"), warnings.toString());
        assertTrue(warnings.contains("WORD_BANK_SYNONYMS"), warnings.toString());
        assertTrue(warnings.contains("WORD_BANK_ORDER"), warnings.toString());
        assertEquals("EUCH", result.exercises().get(0).wordBank().get(5).text(), "stored in capitals");
    }

    @Test
    void ascendingAnswerKeysAreWarned() {
        ObjectNode ex = exercise("B1-SB2-001", false);
        for (int i = 0; i < 10; i++) {
            ((ObjectNode) ex.get("questions").get(i)).put("correctAnswer", String.valueOf((char) ('a' + i)))
                    .put("correctWord", WORDS.get(i));
        }
        assertTrue(codes(validator.validate(batch(ex)), "WARNING").contains("ANSWER_SEQUENCE_PREDICTABLE"));
    }

    @Test
    void entityStoresTheWordBankClozeModelAndExportsBack() {
        ParsedExercise parsed = validator.validate(batch(exercise("B1-SB2-001", true))).exercises().get(0);
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.TELC, "1.0", "1.0", "hash", "user");

        assertEquals(ExamSection.SPRACHBAUSTEINE, entity.getSection());
        assertEquals(ExamTaskType.WORD_BANK_CLOZE, entity.getTaskType());
        assertEquals(2, entity.getPartNumber());
        assertEquals(ExamContentStatus.DRAFT, entity.getStatus());
        assertEquals(2, entity.getPassages().size());
        assertTrue(entity.getPassages().get(0).getContent().contains("<strong>Hotel-Pension Janosch</strong>"));
        assertTrue(entity.getPassages().get(1).getContent().contains("<span data-exam-gap=\"31\" class=\"exam-gap-marker\">31</span>"));
        assertEquals(WORDS, entity.getAnswerOptions());
        assertEquals("a", entity.getAnswerOptionLabels().get(0));
        assertEquals(10, entity.getQuestions().size());
        var first = entity.getQuestions().get(0);
        assertEquals(ExamTaskType.WORD_BANK_CLOZE, first.getTaskType());
        assertEquals(31, first.getGapNumber());
        assertEquals("FÜR", first.getCorrectAnswer());
        assertEquals("Erklärung 0", first.getExplanation());
        assertNull(ExamContentService.publishProblem(entity));

        ObjectNode exported = ExamContentMapper.toExportNode(MAPPER, entity);
        assertNotNull(exported);
        assertEquals("Hotel-Pension Janosch", exported.get("context").get("title").asText());
        assertEquals("ADVERTISEMENT_EMAIL", exported.get("contextType").asText());
        assertEquals(15, exported.get("wordBank").size());
        assertEquals("g", exported.get("questions").get(0).get("correctAnswer").asText());
        assertEquals("FÜR", exported.get("questions").get(0).get("correctWord").asText());
        assertEquals("Explanation 0", exported.get("questions").get(0).get("explanation").get("en").asText());
        assertTrue(exported.get("text").asText().contains("[40]"));
        assertFalse(exported.get("metadata").has("gapQuestions"));
        var again = validator.validate(batch(exported));
        assertTrue(codes(again, "ERROR").isEmpty(), codes(again, "ERROR").toString());
    }

    @Test
    void publishIsBlockedWhenAWordIsUsedTwice() {
        ParsedExercise parsed = validator.validate(batch(exercise("B1-SB2-001", false))).exercises().get(0);
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.TELC, "1.0", "1.0", "hash", "user");
        entity.getQuestions().get(1).setCorrectAnswer(entity.getQuestions().get(0).getCorrectAnswer());
        assertNotNull(ExamContentService.publishProblem(entity));
    }

    @Test
    void duplicateDetectionUsesContextAndText() {
        var first = validator.validate(batch(exercise("B1-SB2-001", true))).exercises().get(0);
        String hash = ExamContentFingerprint.hashTexts(first.textContents());
        assertEquals(2, first.textContents().size());
        var twin = validator.validate(batch(exercise("B1-SB2-002", true))).exercises().get(0);
        var matches = new ExamDuplicateDetector().detect(twin, ExamType.TELC, hash,
                List.of(ExamDuplicateDetector.Candidate.of(first, ExamType.TELC, hash)));
        assertEquals("BATCH_EXACT", matches.get(0).kind());
    }

    @Test
    void promptDescribesTheWordBankAndItsExampleIsValid() throws Exception {
        PromptResponse r = new ExamContentPromptBuilder().build(spec,
                new PromptRequest("TELC", "B1", "SPRACHBAUSTEINE", "TEIL_2", 3, "MIXED", List.of("TRAVEL"), null, null, null, null,
                        "WITH_ADVERTISEMENT", List.of("PRAEPOSITIONEN", "KONJUNKTIONEN", "PRONOMEN")), 0, 1);
        assertFalse(r.prompt().contains("{{"), "unresolved placeholder");
        assertTrue(r.prompt().contains("B1-SB2-001"));
        assertTrue(r.prompt().contains("every exercise starts with an advertisement"));
        assertTrue(r.prompt().contains("PRAEPOSITIONEN, KONJUNKTIONEN, PRONOMEN"));
        assertTrue(r.prompt().contains("exactly 15 words") || r.prompt().contains("exactly 15 different words"));
        assertTrue(r.prompt().contains("Return ONLY valid JSON"));

        var root = MAPPER.readTree(r.jsonExample());
        assertEquals("TEIL_2", root.get("part").asText());
        var ex = root.get("exercises").get(0);
        assertEquals(15, ex.get("wordBank").size());
        assertEquals(10, ex.get("questions").size());
        assertEquals(31, ex.get("questions").get(0).get("number").asInt());
        assertTrue(ExamImportParser.parse(r.jsonExample()).ok());

        PromptResponse none = new ExamContentPromptBuilder().build(spec,
                new PromptRequest("TELC", "B1", "SPRACHBAUSTEINE", "TEIL_2", 1, "MIXED", List.of(), null, null, null, null, "WITHOUT_ADVERTISEMENT", null), 0, 1);
        assertTrue(none.prompt().contains("do NOT include any context material"));
        assertThrows(IllegalArgumentException.class, () -> new ExamContentPromptBuilder().build(spec,
                new PromptRequest("TELC", "B1", "SPRACHBAUSTEINE", "TEIL_2", 1, "MIXED", List.of(), null, null, null, null, "SOMETIMES", null), 0, 1));
    }
}
