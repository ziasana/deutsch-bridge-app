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
import com.deutschbridge.backend.util.ExamExerciseMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** DTZ A2-B1 Lesen Teil 1: one information source, five multiple-choice situations. */
class ExamContentDirectoryTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final List<String> KEY = List.of("a", "c", "b", "a", "c");

    private final ExamContentValidator validator = new ExamContentValidator();
    private final ExamContentSpec spec = ExamContentSpecs.find(ExamType.DTZ, LearningLevel.B1, ExamSection.LESEVERSTEHEN, 1).orElseThrow();

    /** The bare shape the generation prompt asks the AI for: one object, no schemaVersion / contentType wrapper. */
    private static ObjectNode exercise() {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("exam", "DTZ");
        ex.put("section", "LESEN");
        ex.put("part", 1);
        ex.put("exerciseType", "DIRECTORY_MATCHING");
        ex.put("skill", "KATALOGE_REGISTER_VERZEICHNISSE");
        ex.put("level", "A2_B1");
        ex.put("title", "Im Rathaus");
        ex.put("topic", "Behörden und Dienstleistungen");
        ex.put("difficulty", "A2_B1");
        ex.putObject("instructions").put("de", "Sie sind im Rathaus und suchen Informationen. In welches Stockwerk gehen Sie?");

        ObjectNode source = ex.putObject("informationSource");
        source.put("type", "DIRECTORY");
        source.put("title", "Rathaus – Zentralwegweiser");
        source.put("introduction", "Hier finden Sie die Ämter und ihre Aufgaben.");
        ArrayNode entries = source.putArray("entries");
        StringBuilder display = new StringBuilder("Rathaus – Zentralwegweiser\nHier finden Sie die Ämter und ihre Aufgaben.\n");
        for (int i = 1; i <= 7; i++) {
            ObjectNode entry = entries.addObject();
            entry.put("id", "entry_" + i);
            entry.put("heading", i + ". OG – Amt Nummer " + i);
            entry.putArray("details").add("Aufgabe " + i + " im Bürgerservice").add("Beratung zu Thema " + i);
            display.append("\n").append(i).append(". OG – Amt Nummer ").append(i);
        }
        source.put("displayText", display.toString());

        ObjectNode example = ex.putObject("example");
        example.put("enabled", true);
        example.put("situation", "Sie möchten sich über Hilfe für eine Ausbildung informieren.");
        putOptions(example, "1. OG", "3. OG", "anderes Stockwerk");
        example.put("correctAnswer", "a");
        example.putObject("explanation").put("de", "Das Jugendamt hilft dabei.").put("en", "The youth office helps.").put("fa", "اداره کمک می‌کند.");

        ArrayNode questions = ex.putArray("questions");
        for (int i = 0; i < 5; i++) {
            ObjectNode q = questions.addObject();
            q.put("number", 21 + i);
            q.put("situation", "Situation Nummer " + (i + 1) + " mit ganz eigenen Worten und Zahlen " + (i * 17 + 3) + ".");
            putOptions(q, i + 1 + ". OG Kasse", i + 2 + ". Etage Amt", i + 3 + ". Keller Raum");
            q.put("correctAnswer", KEY.get(i));
            q.putArray("sourceEntryIds").add("entry_" + (i + 1));
            q.putObject("explanation").put("de", "Entry " + (i + 1) + " passt.").put("en", "Entry " + (i + 1) + " fits.").put("fa", "ورودی " + (i + 1));
        }
        ObjectNode meta = ex.putObject("metadata");
        meta.put("schemaVersion", 1);
        meta.put("source", "AI_IMPORTED");
        meta.putArray("tags").add("rathaus");
        return ex;
    }

    private static void putOptions(ObjectNode parent, String a, String b, String c) {
        ArrayNode options = parent.putArray("options");
        options.addObject().put("key", "a").put("text", a);
        options.addObject().put("key", "b").put("text", b);
        options.addObject().put("key", "c").put("text", c);
    }

    private static List<String> errors(ExamContentValidator.FileResult r) {
        return r.exerciseIssues().get(0).stream().filter(i -> "ERROR".equals(i.severity())).map(Issue::code).toList();
    }

    private static List<String> warnings(ExamContentValidator.FileResult r) {
        return r.exerciseIssues().get(0).stream().filter(i -> "WARNING".equals(i.severity())).map(Issue::code).toList();
    }

    @Test
    void bareExerciseResolvesTheDirectorySpec() {
        var result = validator.validate(exercise());
        assertTrue(result.fileIssues().isEmpty(), result.fileIssues().toString());
        assertTrue(errors(result).isEmpty(), errors(result).toString());
        ParsedExercise parsed = result.exercises().get(0);
        assertTrue(parsed.spec().isDirectoryMatching());
        assertEquals(5, parsed.questions().size());
        assertEquals(7, parsed.directory().entries().size());
        assertNotNull(parsed.directory().example());
        assertEquals("DTZ-B1-L1-", spec.externalIdPrefix());
    }

    @Test
    void levelA2OnlyAndBatchEnvelopeAreAccepted() {
        ObjectNode ex = exercise();
        ex.put("level", "A2");
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", "1.0");
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.putArray("exercises").add(ex);
        var result = validator.validate(root);
        assertTrue(errors(result).isEmpty(), errors(result).toString());
    }

    @Test
    void wrongQuestionCountNumbersAndOptionsAreErrors() {
        ObjectNode ex = exercise();
        ((ArrayNode) ex.get("questions")).remove(4);
        ((ObjectNode) ex.get("questions").get(0)).put("number", 30);
        ((ArrayNode) ex.get("questions").get(1).get("options")).remove(2);
        ((ObjectNode) ex.get("questions").get(2).get("options").get(0)).put("key", "z");
        ((ObjectNode) ex.get("questions").get(3)).put("correctAnswer", "d");
        var codes = errors(validator.validate(ex));
        assertTrue(codes.contains("QUESTION_COUNT"), codes.toString());
        assertTrue(codes.contains("OPTION_COUNT"), codes.toString());
        assertTrue(codes.contains("OPTION_IDS"), codes.toString());
        assertTrue(codes.contains("CORRECT_OPTION_UNKNOWN"), codes.toString());
    }

    @Test
    void questionNumbersMustBeTwentyOneToTwentyFive() {
        ObjectNode ex = exercise();
        for (int i = 0; i < 5; i++) ((ObjectNode) ex.get("questions").get(i)).put("number", 31 + i);
        assertTrue(errors(validator.validate(ex)).contains("QUESTION_NUMBERS"));
        ObjectNode dup = exercise();
        ((ObjectNode) dup.get("questions").get(1)).put("number", 21);
        assertTrue(errors(validator.validate(dup)).contains("QUESTION_NUMBER_DUPLICATE"));
    }

    @Test
    void exampleIsNotCountedAsAScoredQuestion() {
        ObjectNode ex = exercise();
        ObjectNode asQuestion = ((ArrayNode) ex.get("questions")).addObject();
        asQuestion.setAll((ObjectNode) ex.get("example").deepCopy());
        assertTrue(errors(validator.validate(ex)).contains("QUESTION_COUNT"));
    }

    @Test
    void sourceStructureIsChecked() {
        ObjectNode ex = exercise();
        ObjectNode source = (ObjectNode) ex.get("informationSource");
        ((ObjectNode) source.get("entries").get(1)).put("id", "entry_1");
        ((ObjectNode) source.get("entries").get(2)).put("heading", " ");
        source.put("type", "POSTER");
        var codes = errors(validator.validate(ex));
        assertTrue(codes.contains("ENTRY_ID_DUPLICATE"), codes.toString());
        assertTrue(codes.contains("ENTRY_HEADING_EMPTY"), codes.toString());
        assertTrue(codes.contains("SOURCE_TYPE_INVALID"), codes.toString());

        ObjectNode none = exercise();
        none.remove("informationSource");
        assertTrue(errors(validator.validate(none)).contains("SOURCE_MISSING"));
    }

    @Test
    void sourceEntryIdsMustReferenceExistingEntries() {
        ObjectNode ex = exercise();
        ((ArrayNode) ex.get("questions").get(0).get("sourceEntryIds")).add("entry_99");
        assertTrue(errors(validator.validate(ex)).contains("SOURCE_ENTRY_UNKNOWN"));

        ObjectNode missing = exercise();
        ((ObjectNode) missing.get("questions").get(0)).remove("sourceEntryIds");
        var result = validator.validate(missing);
        assertTrue(errors(result).isEmpty(), "missing sourceEntryIds is only a warning");
        assertTrue(warnings(result).contains("SOURCE_ENTRY_MISSING"));
    }

    @Test
    void exampleConfigurationIsValidated() {
        ObjectNode disabled = exercise();
        disabled.putObject("example").put("enabled", false);
        var ok = validator.validate(disabled);
        assertTrue(errors(ok).isEmpty());
        assertNull(ok.exercises().get(0).directory().example());

        ObjectNode broken = exercise();
        ((ObjectNode) broken.get("example")).put("correctAnswer", "x");
        ((ObjectNode) broken.get("example")).remove("situation");
        var codes = errors(validator.validate(broken));
        assertTrue(codes.contains("EXAMPLE_ANSWER"), codes.toString());
        assertTrue(codes.contains("EXAMPLE_SITUATION_EMPTY"), codes.toString());

        ObjectNode noFlag = exercise();
        ((ObjectNode) noFlag.get("example")).remove("enabled");
        assertTrue(errors(validator.validate(noFlag)).contains("EXAMPLE_INVALID"));
    }

    @Test
    void wrongExerciseTypeAndMarkupAreErrors() {
        ObjectNode ex = exercise();
        ex.put("exerciseType", "SITUATION_MATCHING");
        ((ObjectNode) ex.get("questions").get(0)).put("situation", "Sie suchen <script>alert(1)</script> Hilfe.");
        var codes = errors(validator.validate(ex));
        assertTrue(codes.contains("EXERCISE_TYPE_INVALID"), codes.toString());
        assertTrue(codes.contains("HTML_CONTENT"), codes.toString());
    }

    @Test
    void semanticDoubtsAreOnlyWarnings() {
        ObjectNode ex = exercise();
        ObjectNode source = (ObjectNode) ex.get("informationSource");
        source.put("displayText", "Rathaus – Zentralwegweiser\nEtwas ganz anderes");
        for (int i = 0; i < 5; i++) ((ObjectNode) ex.get("questions").get(i)).put("correctAnswer", "a");
        ((ObjectNode) ex.get("questions").get(1)).put("situation", ex.get("questions").get(0).get("situation").asText());
        ((ObjectNode) ex.get("questions").get(2).get("explanation")).remove("fa");
        var result = validator.validate(ex);
        assertTrue(errors(result).isEmpty(), errors(result).toString());
        var warns = warnings(result);
        assertTrue(warns.contains("DISPLAY_TEXT_MISMATCH"), warns.toString());
        assertTrue(warns.contains("ANSWER_POSITIONS_SAME"), warns.toString());
        assertTrue(warns.contains("QUESTION_SIMILAR"), warns.toString());
        assertTrue(warns.contains("EXPLANATION_TRANSLATION_MISSING"), warns.toString());
    }

    @Test
    void importedEntityStoresTheSourceAsPassageAndTheSituationsAsMultipleChoice() {
        ParsedExercise parsed = validator.validate(exercise()).exercises().get(0);
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.DTZ, "1.0", "1.0", "hash", "user");

        assertEquals(ExamTaskType.DIRECTORY_MATCHING, entity.getTaskType());
        assertEquals(ExamType.DTZ, entity.getExamType());
        assertEquals(LearningLevel.B1, entity.getLevel());
        assertEquals(1, entity.getPartNumber());
        assertEquals(ExamContentStatus.DRAFT, entity.getStatus(), "imported content is never published automatically");
        assertFalse(entity.isPublished());
        assertEquals(2, entity.getPassages().size());
        assertEquals("Rathaus – Zentralwegweiser", entity.getPassages().get(0).getLabel());
        assertTrue(entity.getPassages().get(0).getContent().contains("<strong>1. OG &ndash; Amt Nummer 1</strong><br>Aufgabe 1 im B&uuml;rgerservice"));
        assertEquals(ExamContentMapper.EXAMPLE_LABEL, entity.getPassages().get(1).getLabel());
        assertEquals(5, entity.getQuestions().size());
        var first = entity.getQuestions().get(0);
        assertEquals(21, first.getQuestionNumber());
        assertEquals(ExamTaskType.MULTIPLE_CHOICE, first.getTaskType());
        assertEquals(0, first.getSectionIndex());
        assertEquals(first.getOptions().get(0), first.getCorrectAnswer());
        assertEquals("Entry 1 passt.", first.getExplanation());
        assertEquals("Behörden und Dienstleistungen", entity.getMetadata().get("topic"));
        assertNull(ExamContentService.publishProblem(entity));
    }

    @Test
    void learnerResponseNeverContainsTheAnswerKey() {
        ParsedExercise parsed = validator.validate(exercise()).exercises().get(0);
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.DTZ, "1.0", "1.0", "hash", "user");
        entity.prePersist();
        var publicQuestions = ExamExerciseMapper.mapToPublicResponse(entity).questions();
        assertEquals(5, publicQuestions.size());
        String json = assertDoesNotThrow(() -> MAPPER.writeValueAsString(ExamExerciseMapper.mapToPublicResponse(entity)));
        assertFalse(json.contains("correctAnswer"));
        assertFalse(json.contains("Entry 1 passt."), "explanations are only revealed after submitting");
        assertFalse(json.contains("sourceEntryIds"));
        assertFalse(json.contains("entry_1"));
    }

    @Test
    void publishRequiresFiveQuestionsWithThreeOptions() {
        ParsedExercise parsed = validator.validate(exercise()).exercises().get(0);
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.DTZ, "1.0", "1.0", "hash", "user");
        entity.getQuestions().remove(0);
        assertNotNull(ExamContentService.publishProblem(entity));
    }

    @Test
    void previewCarriesTheAnswerKeyDetailsForTheAdmin() {
        ParsedExercise parsed = validator.validate(exercise()).exercises().get(0);
        var preview = ExamContentMapper.toPreview(parsed);
        assertNotNull(preview.directory());
        assertEquals(5, preview.questions().size());
        assertEquals("a", preview.questions().get(0).correctOptionId());
        assertEquals(List.of("entry_1"), preview.directory().questionDetails().get(0).sourceEntryIds());
        assertEquals("Entry 1 passt.", preview.directory().questionDetails().get(0).explanation().get("de"));
        assertEquals("a", preview.directory().example().correctOptionId());
    }

    @Test
    void exportIsImportableAgain() {
        ParsedExercise parsed = validator.validate(exercise()).exercises().get(0);
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.DTZ, "1.0", "1.0", "hash", "user");
        ObjectNode exported = ExamContentMapper.toExportNode(MAPPER, entity);
        assertNotNull(exported);
        assertEquals("DIRECTORY_MATCHING", exported.get("exerciseType").asText());
        assertEquals("b", exported.get("questions").get(2).get("correctAnswer").asText());
        assertEquals("entry_3", exported.get("questions").get(2).get("sourceEntryIds").get(0).asText());
        assertEquals("Entry 3 fits.", exported.get("questions").get(2).get("explanation").get("en").asText());
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", "1.0");
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", "DTZ");
        root.put("level", "B1");
        root.put("section", "LESEN");
        root.put("part", "TEIL_1");
        root.putArray("exercises").add(exported);
        var again = validator.validate(root);
        assertTrue(errors(again).isEmpty(), errors(again).toString());
    }

    @Test
    void duplicateDetectionUsesTheSourceText() {
        var first = validator.validate(exercise()).exercises().get(0);
        String hash = ExamContentFingerprint.hashTexts(first.textContents());
        var twin = validator.validate(exercise()).exercises().get(0);
        var matches = new ExamDuplicateDetector().detect(twin, ExamType.DTZ, hash,
                List.of(ExamDuplicateDetector.Candidate.of(first, ExamType.DTZ, hash)));
        assertFalse(matches.isEmpty());
    }

    @Test
    void promptReflectsTheSelectedSettingsAndItsExampleIsValid() throws Exception {
        PromptRequest request = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_1", 1, "A2", List.of("LIBRARY"), null, null, null, null, null, null,
                null, null, null, "CATALOGUE", true, "NEW_SCENARIO");
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request, 0, 1);
        assertFalse(r.prompt().contains("{{"), "unresolved placeholder");
        assertTrue(r.prompt().contains("Difficulty: A2"));
        assertTrue(r.prompt().contains("Library"));
        assertTrue(r.prompt().contains("Information-source type: CATALOGUE"));
        assertTrue(r.prompt().contains("include one unscored example"));
        assertTrue(r.prompt().contains("Return only the final JSON object."));
        assertTrue(r.prompt().contains("For A2:"));
        assertTrue(r.prompt().contains("invent a new, original scenario"));

        var example = MAPPER.readTree(r.jsonExample());
        assertEquals("DIRECTORY_MATCHING", example.get("exerciseType").asText());
        assertEquals(5, example.get("questions").size());
        assertEquals(21, example.get("questions").get(0).get("number").asInt());
        assertEquals(3, example.get("questions").get(0).get("options").size());
        assertTrue(example.get("example").get("enabled").asBoolean());
    }

    @Test
    void promptWithoutExampleAsksForDisabledExampleAndAvoidsKnownTopics() throws Exception {
        PromptRequest request = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_1", 1, null, null, null, null, null, null, null, null,
                null, null, null, null, false, "AVOID_KNOWN_TOPICS");
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request, 2, 3, List.of("Im Rathaus - Behörden"));
        assertTrue(r.prompt().contains("do not include an example"));
        assertTrue(r.prompt().contains("\"example\": {\"enabled\": false}"));
        assertTrue(r.prompt().contains("Im Rathaus - Behörden"));
        assertFalse(MAPPER.readTree(r.jsonExample()).get("example").get("enabled").asBoolean());
    }

    @Test
    void severalExercisesAndTopicsAskForABatchFileThatTheValidatorUnderstands() throws Exception {
        PromptRequest request = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_1", 3, "A2_B1", List.of("LIBRARY", "HOSPITAL"), null, null, null, null, null,
                null, null, null, null, null, true, null);
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request, 0, 1);
        assertFalse(r.prompt().contains("{{"));
        assertTrue(r.prompt().contains("Generate exactly 3 complete"));
        assertTrue(r.prompt().contains("EXAM_EXERCISE_BATCH"));
        assertTrue(r.prompt().contains("Library"));
        assertTrue(r.prompt().contains("Hospital"));
        var root = MAPPER.readTree(r.jsonExample());
        assertEquals("EXAM_EXERCISE_BATCH", root.get("contentType").asText());
        assertEquals("DIRECTORY_MATCHING", root.get("exercises").get(0).get("exerciseType").asText());

        ObjectNode batch = MAPPER.createObjectNode();
        batch.put("schemaVersion", "1.0");
        batch.put("contentType", "EXAM_EXERCISE_BATCH");
        batch.put("exam", "DTZ");
        batch.put("level", "A2_B1");
        batch.put("section", "LESEN");
        batch.put("part", "TEIL_1");
        batch.putArray("exercises").add(exercise());
        assertTrue(errors(validator.validate(batch)).isEmpty());
    }

    @Test
    void unknownPromptSettingsAreRejected() {
        PromptRequest bad = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_1", 1, "A2", List.of("MOON"), null);
        assertThrows(IllegalArgumentException.class, () -> new ExamContentPromptBuilder().build(spec, bad, 0, 1));
    }
}
