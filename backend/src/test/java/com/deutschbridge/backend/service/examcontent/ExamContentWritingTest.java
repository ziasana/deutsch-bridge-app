package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamContentDtos.ExercisePreview;
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

/** TELC B1 Schriftlicher Ausdruck: one incoming email, exactly four content points, no model answer required. */
class ExamContentWritingTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final List<String> POINTS = List.of(
            "welche Ausflüge Sie mit Marianne machen wollen",
            "was die beste Jahreszeit für die Reise ist",
            "welche Kleidung sie mitnehmen soll",
            "wie sie sich am besten auf die Reise vorbereiten kann");

    private final ExamContentValidator validator = new ExamContentValidator();
    private final ExamContentSpec spec = ExamContentSpecs.find(ExamType.TELC, LearningLevel.B1, ExamSection.SCHRIFTLICHER_AUSDRUCK, 1).orElseThrow();

    /** About 120 words of plain informal German. */
    private static String body() {
        StringBuilder b = new StringBuilder("danke für deine nette Einladung! Ich komme dich sehr gerne besuchen, um dein Land kennenzulernen.\n\n");
        for (int i = 0; i < 6; i++) {
            b.append("Ich weiß noch nicht, wann die beste Zeit für die Reise wäre und was ich vorher alles vorbereiten sollte. ");
        }
        return b.append("\n\nBitte schreib mir bald, damit ich mich gut vorbereiten kann.").toString().trim();
    }

    private static ObjectNode exercise(String externalId) {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("externalId", externalId);
        ex.put("title", "Schriftlicher Ausdruck – Reise und Besuch");
        ex.putObject("instructions").put("de", "Antworten Sie auf die E-Mail. Schreiben Sie etwas zu allen vier Punkten:");
        ex.put("taskType", "EMAIL_RESPONSE");
        ex.put("scenarioType", "STANDARD_EMAIL");
        ex.put("topic", "Reise und Besuch");
        ex.put("communicationType", "INFORMAL_EMAIL");
        ex.put("relationship", "FRIEND");
        ObjectNode task = ex.putObject("task");
        task.put("situation", "Sie haben von einer Freundin folgende E-Mail erhalten:");
        task.putObject("incomingMessage").put("greeting", "Liebe Anna,").put("body", body()).put("closing", "Viele Grüße").put("sender", "Marianne");
        ArrayNode points = ex.putArray("points");
        for (int i = 0; i < POINTS.size(); i++) points.addObject().put("number", i + 1).put("text", POINTS.get(i));
        ex.putObject("writingGuidance").put("de", ExamContentSpecs.WRITING_GUIDANCE);
        ex.putObject("metadata").put("difficulty", "MEDIUM").put("source", "AI_IMPORTED").putArray("tags").add("reise");
        return ex;
    }

    private static ObjectNode batch(ObjectNode... exercises) {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", "1.0");
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", "TELC");
        root.put("level", "B1");
        root.put("section", "SCHREIBEN");
        root.put("part", "TEIL_1");
        ArrayNode array = root.putArray("exercises");
        for (ObjectNode e : exercises) array.add(e);
        return root;
    }

    private static List<String> codes(ExamContentValidator.FileResult r, String severity) {
        return r.exerciseIssues().get(0).stream().filter(i -> severity.equals(i.severity())).map(i -> i.code()).toList();
    }

    private List<String> errors(ObjectNode ex) {
        return codes(validator.validate(batch(ex)), "ERROR");
    }

    private List<String> warnings(ObjectNode ex) {
        return codes(validator.validate(batch(ex)), "WARNING");
    }

    @Test
    void shouldAcceptValidWritingTask() {
        var result = validator.validate(batch(exercise("B1-S1-001")));
        assertTrue(result.fileIssues().isEmpty());
        assertTrue(codes(result, "ERROR").isEmpty(), codes(result, "ERROR").toString());
        assertTrue(codes(result, "WARNING").isEmpty(), codes(result, "WARNING").toString());
        ParsedExercise parsed = result.exercises().get(0);
        assertTrue(parsed.spec().isWriting());
        assertEquals("B1-S1-", spec.externalIdPrefix());
        assertEquals(4, parsed.writing().points().size());
        assertEquals("Marianne", parsed.writing().sender());
        assertEquals("STANDARD_EMAIL", parsed.writing().scenarioType());
    }

    @Test
    void shouldRejectThreeAndFivePoints() {
        ObjectNode three = exercise("B1-S1-001");
        ((ArrayNode) three.get("points")).remove(3);
        assertTrue(errors(three).contains("POINT_COUNT"));

        ObjectNode five = exercise("B1-S1-001");
        ((ArrayNode) five.get("points")).addObject().put("number", 5).put("text", "noch etwas ganz anderes");
        var codes = errors(five);
        assertTrue(codes.contains("POINT_COUNT"), codes.toString());
        assertTrue(codes.contains("POINT_NUMBER_INVALID"), codes.toString());
    }

    @Test
    void shouldRejectDuplicatePointNumbersAndEmptyPoints() {
        ObjectNode ex = exercise("B1-S1-001");
        ((ObjectNode) ex.get("points").get(2)).put("number", 2);
        ((ObjectNode) ex.get("points").get(3)).put("text", " ");
        var codes = errors(ex);
        assertTrue(codes.contains("POINT_NUMBER_DUPLICATE"), codes.toString());
        assertTrue(codes.contains("POINT_TEXT_EMPTY"), codes.toString());
    }

    @Test
    void shouldRejectMissingIncomingMessage() {
        ObjectNode ex = exercise("B1-S1-001");
        ((ObjectNode) ex.get("task")).remove("incomingMessage");
        assertTrue(errors(ex).contains("EMAIL_MISSING"));
    }

    @Test
    void shouldRejectEachMissingEmailPart() {
        for (String part : List.of("greeting", "body", "closing", "sender")) {
            ObjectNode ex = exercise("B1-S1-001");
            ((ObjectNode) ex.get("task").get("incomingMessage")).remove(part);
            assertTrue(errors(ex).contains("EMAIL_" + part.toUpperCase() + "_MISSING"), part);
        }
    }

    @Test
    void shouldDetectInvalidRelationshipCommunicationCombination() {
        ObjectNode friendFormal = exercise("B1-S1-001");
        friendFormal.put("communicationType", "FORMAL_EMAIL");
        assertTrue(errors(friendFormal).contains("STYLE_MISMATCH"));

        ObjectNode organizationInformal = exercise("B1-S1-001");
        organizationInformal.put("relationship", "ORGANIZATION");
        assertTrue(errors(organizationInformal).contains("STYLE_MISMATCH"));

        ObjectNode colleagueInformal = exercise("B1-S1-001");
        colleagueInformal.put("relationship", "COLLEAGUE");
        assertTrue(errors(colleagueInformal).isEmpty());
        assertTrue(warnings(colleagueInformal).contains("STYLE_UNUSUAL"));

        ObjectNode ok = exercise("B1-S1-001");
        ok.put("relationship", "ORGANIZATION").put("communicationType", "FORMAL_EMAIL");
        ((ObjectNode) ok.get("task").get("incomingMessage")).put("greeting", "Sehr geehrte Frau Weber,");
        assertTrue(errors(ok).isEmpty());
    }

    @Test
    void shouldRejectUnknownEnumValuesAndRandomScenario() {
        ObjectNode ex = exercise("B1-S1-001");
        ex.put("scenarioType", "RANDOM").put("taskType", "ESSAY").put("relationship", "NEIGHBOUR").put("communicationType", "CHAT");
        var codes = errors(ex);
        assertTrue(codes.containsAll(List.of("SCENARIO_TYPE_INVALID", "TASK_TYPE_INVALID", "RELATIONSHIP_INVALID", "COMMUNICATION_TYPE_INVALID")), codes.toString());
    }

    @Test
    void shouldRejectMissingRequiredFields() {
        ObjectNode ex = exercise("B1-S1-001");
        ex.remove("topic");
        ex.remove("points");
        ((ObjectNode) ex.get("task")).remove("situation");
        var codes = errors(ex);
        assertTrue(codes.containsAll(List.of("TOPIC_MISSING", "POINTS_MISSING", "SITUATION_MISSING")), codes.toString());
    }

    @Test
    void shouldRejectHtmlAndScript() {
        ObjectNode ex = exercise("B1-S1-001");
        ((ObjectNode) ex.get("points").get(0)).put("text", "was <script>alert(1)</script> ich mitbringen soll");
        assertTrue(errors(ex).contains("HTML_CONTENT"));
    }

    @Test
    void qualityProblemsAreWarningsNotErrors() {
        ObjectNode ex = exercise("B1-S1-001");
        ((ObjectNode) ex.get("task").get("incomingMessage")).put("body", "Ich komme dich bald besuchen. Wann passt es dir? Was soll ich mitbringen?");
        ((ObjectNode) ex.get("points").get(0)).put("text", "Wann?");
        ((ObjectNode) ex.get("points").get(2)).put("text", POINTS.get(1) + " bitte");
        ((ObjectNode) ex.get("task").get("incomingMessage")).put("greeting", "Sehr geehrte Damen und Herren,");
        var result = validator.validate(batch(ex));
        assertTrue(codes(result, "ERROR").isEmpty(), codes(result, "ERROR").toString());
        var warnings = codes(result, "WARNING");
        assertTrue(warnings.contains("EMAIL_LENGTH"), warnings.toString());
        assertTrue(warnings.contains("POINT_TOO_SHORT"), warnings.toString());
        assertTrue(warnings.contains("POINT_OVERLAP"), warnings.toString());
        assertTrue(warnings.contains("GREETING_STYLE"), warnings.toString());
    }

    @Test
    void pronounStyleMismatchIsWarned() {
        ObjectNode ex = exercise("B1-S1-001");
        ((ObjectNode) ex.get("task").get("incomingMessage")).put("body", body() + " Ich freue mich, Ihnen bald zu schreiben.");
        assertTrue(warnings(ex).contains("PRONOUN_STYLE"));
    }

    @Test
    void entityStoresTheWritingTaskModelAndExportsBack() {
        ParsedExercise parsed = validator.validate(batch(exercise("B1-S1-001"))).exercises().get(0);
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.TELC, "1.0", "1.0", "hash", "user");

        assertEquals(ExamSection.SCHRIFTLICHER_AUSDRUCK, entity.getSection());
        assertEquals(ExamTaskType.WRITING_TASK, entity.getTaskType());
        assertEquals(1, entity.getPartNumber());
        assertEquals(ExamContentStatus.DRAFT, entity.getStatus());
        assertFalse(entity.isPublished(), "imported content never auto-publishes");
        assertEquals(POINTS, entity.getLeitpunkte());
        assertTrue(entity.isRequiresPlanning());
        assertTrue(entity.getQuestions().isEmpty());
        assertEquals(1, entity.getPassages().size());
        String html = entity.getPassages().get(0).getContent();
        assertTrue(html.contains("<blockquote>") && html.contains("Liebe Anna,") && html.contains("Marianne"), html);
        assertTrue(html.contains("<li>" + POINTS.get(2) + "</li>"), html);
        assertEquals("FRIEND", entity.getMetadata().get("relationship"));
        assertEquals("AI_IMPORTED", entity.getMetadata().get("source"));
        assertNull(entity.getModelSolution());
        assertNull(ExamContentService.publishProblem(entity));

        ObjectNode exported = ExamContentMapper.toExportNode(MAPPER, entity);
        assertNotNull(exported);
        assertEquals("Marianne", exported.get("task").get("incomingMessage").get("sender").asText());
        assertEquals(4, exported.get("points").size());
        assertEquals("STANDARD_EMAIL", exported.get("scenarioType").asText());
        var again = validator.validate(batch(exported));
        assertTrue(codes(again, "ERROR").isEmpty(), codes(again, "ERROR").toString());
    }

    @Test
    void escapesPlainTextWhenBuildingTheLearnerHtml() {
        ObjectNode ex = exercise("B1-S1-001");
        ((ObjectNode) ex.get("task").get("incomingMessage")).put("sender", "Tom & Anna");
        ParsedExercise parsed = validator.validate(batch(ex)).exercises().get(0);
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.TELC, "1.0", "1.0", "hash", "user");
        assertTrue(entity.getPassages().get(0).getContent().contains("Tom &amp; Anna"));
    }

    @Test
    void optionalModelAnswerBecomesTheModelSolution() {
        ObjectNode ex = exercise("B1-S1-001");
        ex.putObject("modelAnswer").put("subject", "Besuch").put("body", "Liebe Marianne,\n\nich freue mich.");
        ParsedExercise parsed = validator.validate(batch(ex)).exercises().get(0);
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.TELC, "1.0", "1.0", "hash", "user");
        assertTrue(entity.getModelSolution().contains("Betreff: Besuch"));
    }

    @Test
    void publishIsBlockedWhenAPointWasRemovedAfterImport() {
        ParsedExercise parsed = validator.validate(batch(exercise("B1-S1-001"))).exercises().get(0);
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.TELC, "1.0", "1.0", "hash", "user");
        entity.setLeitpunkte(POINTS.subList(0, 3));
        assertNotNull(ExamContentService.publishProblem(entity));
    }

    @Test
    void previewShowsTheTaskAsTheLearnerSeesIt() {
        ParsedExercise parsed = validator.validate(batch(exercise("B1-S1-001"))).exercises().get(0);
        ExercisePreview preview = ExamContentMapper.toPreview(parsed);
        assertEquals(4, preview.writing().points().size());
        assertEquals("Liebe Anna,", preview.writing().greeting());
    }

    @Test
    void duplicateDetectionComparesTheWholeTask() {
        var first = validator.validate(batch(exercise("B1-S1-001"))).exercises().get(0);
        String hash = ExamContentFingerprint.hashTexts(first.textContents());
        var twin = validator.validate(batch(exercise("B1-S1-002"))).exercises().get(0);
        var matches = new ExamDuplicateDetector().detect(twin, ExamType.TELC, hash,
                List.of(ExamDuplicateDetector.Candidate.of(first, ExamType.TELC, hash)));
        assertEquals("BATCH_EXACT", matches.get(0).kind());

        ExamExercise stored = ExamContentMapper.toEntity(first, ExamType.TELC, "1.0", "1.0", hash, "user");
        assertEquals(ExamContentFingerprint.hashTexts(twin.textContents()), hash);
        assertEquals(ExamContentMapper.toPlainText(stored.getPassages().get(0).getContent()), first.textContents().get(0));
    }

    @Test
    void promptCarriesTheConfigurationAndItsExampleIsValid() throws Exception {
        PromptRequest request = new PromptRequest("TELC", "B1", "SCHREIBEN", "TEIL_1", 3, "MIXED", List.of("TRAVEL"), null, null, null, null,
                null, null, "ALTERNATIVE_EMAIL", "COURSE_COLLEAGUE", "INFORMAL_EMAIL");
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request, 0, 1, List.of("Reise und Besuch - Reise (STANDARD_EMAIL)"));
        assertFalse(r.prompt().contains("{{"), "unresolved placeholder");
        assertTrue(r.prompt().contains("B1-S1-001"));
        assertTrue(r.prompt().contains("Scenario type: ALTERNATIVE_EMAIL"));
        assertTrue(r.prompt().contains("Relationship: COURSE_COLLEAGUE"));
        assertTrue(r.prompt().contains("Communication type: INFORMAL_EMAIL"));
        assertTrue(r.prompt().contains("Reise und Besuch - Reise (STANDARD_EMAIL)"));
        assertTrue(r.prompt().contains("Antworten Sie auf die E-Mail. Schreiben Sie etwas zu allen vier Punkten:"));
        assertTrue(r.prompt().contains(ExamContentSpecs.WRITING_GUIDANCE));
        assertTrue(r.prompt().contains("Return ONLY valid JSON"));

        var ex = MAPPER.readTree(r.jsonExample()).get("exercises").get(0);
        assertEquals(4, ex.get("points").size());
        assertEquals("EMAIL_RESPONSE", ex.get("taskType").asText());
        assertTrue(ExamImportParser.parse(r.jsonExample()).ok());
    }

    @Test
    void promptRejectsInconsistentOrUnknownChoices() {
        var builder = new ExamContentPromptBuilder();
        assertThrows(IllegalArgumentException.class, () -> builder.build(spec,
                new PromptRequest("TELC", "B1", "SCHREIBEN", "TEIL_1", 1, "MIXED", List.of(), null, null, null, null, null, null,
                        "STANDARD_EMAIL", "FRIEND", "FORMAL_EMAIL"), 0, 1));
        assertThrows(IllegalArgumentException.class, () -> builder.build(spec,
                new PromptRequest("TELC", "B1", "SCHREIBEN", "TEIL_1", 1, "MIXED", List.of(), null, null, null, null, null, null,
                        "SOMETHING", null, null), 0, 1));
        PromptResponse random = builder.build(spec, new PromptRequest("TELC", "B1", "SCHREIBEN", "TEIL_1", 1, "MIXED", List.of(), null), 0, 1);
        assertTrue(random.prompt().contains("Scenario type: RANDOM"));
        assertFalse(random.prompt().contains("EXISTING TASKS"));
    }
}
