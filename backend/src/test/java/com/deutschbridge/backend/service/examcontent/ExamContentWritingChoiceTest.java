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

/** DTZ Schreiben: two alternative tasks (A and B), four content points each, 30 minutes. */
class ExamContentWritingChoiceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private final ExamContentValidator validator = new ExamContentValidator();
    private final ExamContentSpec spec = ExamContentSpecs.find(ExamType.DTZ, LearningLevel.B1, ExamSection.SCHRIFTLICHER_AUSDRUCK, 1).orElseThrow();

    private static ObjectNode task(String label, String title, String topic, String type, String situation, String name, String role,
                                   String instruction, String... points) {
        ObjectNode t = MAPPER.createObjectNode();
        t.put("taskLabel", label);
        t.put("title", title);
        t.put("topic", topic);
        t.put("communicationType", type);
        t.put("situation", situation);
        if (name != null) t.putObject("recipient").put("name", name).put("role", role);
        else t.putNull("recipient");
        t.put("writingInstruction", instruction);
        ArrayNode arr = t.putArray("points");
        for (int i = 0; i < points.length; i++) arr.addObject().put("number", i + 1).put("text", points[i]);
        return t;
    }

    private static ObjectNode taskA() {
        return task("A", "Fragen zu einem Schwimmkurs", "Kurse und Bildung", "FORMAL_EMAIL",
                "Sie möchten mit Ihrem Sohn an einem Schwimmkurs teilnehmen und haben noch einige Fragen zum Angebot.",
                "Frau Becker", "Mitarbeiterin der Schwimmschule",
                "Schreiben Sie eine E-Mail an Frau Becker von der Schwimmschule.",
                "Warum Ihr Sohn schwimmen lernen soll", "Welche Erfahrungen Ihr Sohn schon hat", "Termine und Dauer des Kurses", "Kosten für den Kurs");
    }

    private static ObjectNode taskB() {
        return task("B", "Einladung zur Einweihungsfeier", "Einladungen und Feste", "INFORMAL_EMAIL",
                "Sie sind in eine neue Wohnung gezogen und möchten Ihre Freundin Lena zu einer kleinen Feier einladen.",
                "Lena", "Freundin",
                "Schreiben Sie eine E-Mail an Ihre Freundin Lena.",
                "Warum Sie feiern", "Wann und wo die Feier ist", "Was Lena mitbringen kann", "Wie Lena zu Ihnen kommt");
    }

    private static ObjectNode exercise() {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("exam", "DTZ");
        ex.put("section", "SCHREIBEN");
        ex.put("level", "A2_B1");
        ex.put("exerciseType", "WRITING_TASK_CHOICE");
        ex.put("title", "Schriftliche Kommunikation im Alltag");
        ex.put("durationMinutes", 30);
        ex.putObject("instructions").put("de", ExamContentSpecs.WRITING_CHOICE_INSTRUCTIONS);
        ex.putArray("tasks").add(taskA()).add(taskB());
        ex.putObject("metadata").put("schemaVersion", 1).put("source", "AI_IMPORTED").putArray("tags");
        return ex;
    }

    private ExamContentValidator.FileResult validate(ObjectNode ex) {
        return validator.validate(ex);
    }

    private List<String> errors(ObjectNode ex) {
        return validate(ex).exerciseIssues().get(0).stream().filter(i -> "ERROR".equals(i.severity())).map(i -> i.code()).toList();
    }

    private List<String> warnings(ObjectNode ex) {
        return validate(ex).exerciseIssues().get(0).stream().filter(i -> "WARNING".equals(i.severity())).map(i -> i.code()).toList();
    }

    private static ArrayNode tasks(ObjectNode ex) {
        return (ArrayNode) ex.get("tasks");
    }

    @Test
    void validExerciseIsAcceptedWithoutErrors() {
        ExamContentValidator.FileResult result = validate(exercise());
        assertEquals(List.of(), errors(exercise()));
        ParsedExercise parsed = result.exercises().get(0);
        assertTrue(parsed.spec().isWritingChoice());
        assertEquals(30, parsed.writingChoice().durationMinutes());
        assertEquals(List.of("A", "B"), parsed.writingChoice().tasks().stream().map(ParsedExercise.WritingChoiceTask::label).toList());
        assertEquals(4, parsed.writingChoice().tasks().get(0).points().size());
        assertEquals(4, parsed.writingChoice().tasks().get(1).points().size());
        assertEquals("Frau Becker", parsed.writingChoice().tasks().get(0).recipientName());
    }

    @Test
    void partIsOptionalAndTaskOrderIsNormalised() {
        ObjectNode ex = exercise();
        ArrayNode reversed = MAPPER.createArrayNode().add(taskB()).add(taskA());
        ex.set("tasks", reversed);
        assertEquals(List.of(), errors(ex));
        assertEquals("A", validate(ex).exercises().get(0).writingChoice().tasks().get(0).label());
    }

    @Test
    void invalidJsonIsRejectedByTheParser() {
        assertFalse(ExamImportParser.parse("{ not json").ok());
    }

    @Test
    void missingTaskIsRejected() {
        ObjectNode ex = exercise();
        tasks(ex).remove(1);
        assertTrue(errors(ex).contains("TASK_COUNT"));
    }

    @Test
    void missingTasksArrayIsRejected() {
        ObjectNode ex = exercise();
        ex.remove("tasks");
        assertTrue(errors(ex).contains("TASKS_MISSING"));
    }

    @Test
    void threeTasksAreRejected() {
        ObjectNode ex = exercise();
        tasks(ex).add(taskA());
        assertTrue(errors(ex).contains("TASK_COUNT"));
    }

    @Test
    void duplicateTaskLabelsAreRejected() {
        ObjectNode ex = exercise();
        ((ObjectNode) tasks(ex).get(1)).put("taskLabel", "A");
        assertTrue(errors(ex).contains("TASK_LABEL_DUPLICATE"));
    }

    @Test
    void invalidTaskLabelIsRejected() {
        ObjectNode ex = exercise();
        ((ObjectNode) tasks(ex).get(1)).put("taskLabel", "C");
        assertTrue(errors(ex).contains("TASK_LABEL_INVALID"));
    }

    @Test
    void threePointsAreRejected() {
        ObjectNode ex = exercise();
        ((ArrayNode) tasks(ex).get(0).get("points")).remove(3);
        assertTrue(errors(ex).contains("POINT_COUNT"));
    }

    @Test
    void fivePointsAreRejected() {
        ObjectNode ex = exercise();
        ((ArrayNode) tasks(ex).get(1).get("points")).addObject().put("number", 5).put("text", "Noch ein Punkt");
        List<String> errors = errors(ex);
        assertTrue(errors.contains("POINT_COUNT"));
        assertTrue(errors.contains("POINT_NUMBER_INVALID"));
    }

    @Test
    void duplicatePointNumbersAreRejected() {
        ObjectNode ex = exercise();
        ((ObjectNode) tasks(ex).get(0).get("points").get(1)).put("number", 1);
        assertTrue(errors(ex).contains("POINT_NUMBER_DUPLICATE"));
    }

    @Test
    void pointNumberOutsideOneToFourIsRejected() {
        ObjectNode ex = exercise();
        ((ObjectNode) tasks(ex).get(0).get("points").get(3)).put("number", 7);
        assertTrue(errors(ex).contains("POINT_NUMBER_INVALID"));
    }

    @Test
    void durationOtherThanThirtyIsRejected() {
        ObjectNode ex = exercise();
        ex.put("durationMinutes", 45);
        assertTrue(errors(ex).contains("WRITING_DURATION"));
        ex.remove("durationMinutes");
        assertTrue(errors(ex).contains("WRITING_DURATION"));
    }

    @Test
    void missingSituationAndInstructionAreRejected() {
        ObjectNode ex = exercise();
        ((ObjectNode) tasks(ex).get(0)).remove("situation");
        ((ObjectNode) tasks(ex).get(1)).remove("writingInstruction");
        List<String> errors = errors(ex);
        assertTrue(errors.contains("SITUATION_MISSING"));
        assertTrue(errors.contains("INSTRUCTION_MISSING"));
    }

    @Test
    void wrongFieldTypesAreRejected() {
        ObjectNode ex = exercise();
        ((ObjectNode) tasks(ex).get(0)).put("situation", 42);
        ((ObjectNode) tasks(ex).get(1)).put("recipient", "Lena");
        List<String> errors = errors(ex);
        assertTrue(errors.contains("FIELD_TYPE"));
        assertTrue(errors.contains("RECIPIENT_NOT_OBJECT"));
    }

    @Test
    void missingMetadataIsRejected() {
        ObjectNode ex = exercise();
        ex.remove("metadata");
        assertTrue(errors(ex).contains("METADATA_REQUIRED"));
    }

    @Test
    void wrongExerciseTypeAndMarkupAreRejected() {
        ObjectNode ex = exercise();
        ex.put("exerciseType", "LETTER_GAP_FILL");
        ((ObjectNode) tasks(ex).get(0)).put("situation", "<script>alert(1)</script> Sie schreiben an die Schule und haben eine Frage.");
        List<String> errors = errors(ex);
        assertTrue(errors.contains("EXERCISE_TYPE_INVALID"));
        assertTrue(errors.contains("HTML_CONTENT"));
    }

    @Test
    void unknownCommunicationTypeIsRejected() {
        ObjectNode ex = exercise();
        ((ObjectNode) tasks(ex).get(0)).put("communicationType", "TELEGRAM");
        assertTrue(errors(ex).contains("COMMUNICATION_TYPE_INVALID"));
    }

    @Test
    void absentRecipientIsAllowedForInformalTasks() {
        ObjectNode ex = exercise();
        ((ObjectNode) tasks(ex).get(1)).putNull("recipient");
        assertEquals(List.of(), errors(ex));
    }

    @Test
    void differingInstructionIsOnlyAWarning() {
        ObjectNode ex = exercise();
        ex.putObject("instructions").put("de", "Schreiben Sie etwas.");
        assertEquals(List.of(), errors(ex));
        assertTrue(warnings(ex).contains("INSTRUCTIONS_DIFFER"));
    }

    @Test
    void semanticWarningsAreAdvisoryNotErrors() {
        ObjectNode ex = exercise();
        ObjectNode a = (ObjectNode) tasks(ex).get(0);
        a.put("situation", "Kurs.");
        a.put("communicationType", "FORMAL_EMAIL");
        a.putObject("recipient").put("name", "Lena").put("role", "Freundin");
        ((ObjectNode) a.get("points").get(1)).put("text", "Termine und Dauer des Kurses");
        ((ObjectNode) a.get("points").get(2)).put("text", "Dauer und Termine des Kurses");
        List<String> warnings = warnings(ex);
        assertEquals(List.of(), errors(ex));
        assertTrue(warnings.contains("SITUATION_UNCLEAR"));
        assertTrue(warnings.contains("STYLE_MISMATCH"));
        assertTrue(warnings.contains("POINT_OVERLAP"));
    }

    @Test
    void unbalancedTasksAndSpecialistTopicsProduceWarnings() {
        ObjectNode ex = exercise();
        ObjectNode b = (ObjectNode) tasks(ex).get(1);
        b.put("situation", String.join(" ", java.util.Collections.nCopies(30, "Sie planen eine große Feier mit vielen Gästen und wollen alles gut vorbereiten.")).substring(0, 1100)
                + " Außerdem geht es um eine Steuererklärung.");
        List<String> warnings = warnings(ex);
        assertTrue(warnings.contains("TASKS_UNBALANCED"));
        assertTrue(warnings.contains("SPECIALIST_KNOWLEDGE"));
        assertEquals(List.of(), errors(ex).stream().filter(c -> !c.equals("FIELD_TOO_LONG")).toList());
    }

    @Test
    void importedExerciseIsStoredAsDraftWithBothTasks() {
        ParsedExercise parsed = validate(exercise()).exercises().get(0);
        ExamExercise e = ExamContentMapper.toEntity(parsed, ExamType.DTZ, "1.0", "1.0", "hash", "admin");
        assertEquals(ExamContentStatus.DRAFT, e.getStatus());
        assertFalse(e.isPublished());
        assertEquals(ExamTaskType.WRITING_TASK_CHOICE, e.getTaskType());
        assertEquals(ExamSection.SCHRIFTLICHER_AUSDRUCK, e.getSection());
        assertEquals(2, e.getPassages().size());
        assertEquals("Aufgabe A", e.getPassages().get(0).getLabel());
        assertEquals("Aufgabe B", e.getPassages().get(1).getLabel());
        assertTrue(e.getPassages().get(0).getContent().contains("Termine und Dauer des Kurses"));
        assertNull(e.getModelSolution());
        assertEquals("Kurse und Bildung / Einladungen und Feste", e.getMetadata().get("topic"));
        assertEquals("FORMAL_EMAIL, INFORMAL_EMAIL", e.getMetadata().get("sourceType"));
        assertEquals(ExamContentSpecs.WRITING_CHOICE_INSTRUCTIONS, e.getTeilDescription());
        assertNull(ExamContentService.writingChoiceProblem(e));
    }

    @Test
    void publishRefusesAnExerciseWhosePointsWereBroken() {
        ParsedExercise parsed = validate(exercise()).exercises().get(0);
        ExamExercise e = ExamContentMapper.toEntity(parsed, ExamType.DTZ, "1.0", "1.0", "hash", "admin");
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> choice = (java.util.Map<String, Object>) e.getMetadata().get("writingChoice");
        @SuppressWarnings("unchecked")
        java.util.List<java.util.Map<String, Object>> tasks = (java.util.List<java.util.Map<String, Object>>) choice.get("tasks");
        @SuppressWarnings("unchecked")
        java.util.List<Object> points = (java.util.List<Object>) tasks.get(1).get("points");
        points.remove(3);
        assertEquals("Aufgabe B needs exactly four content points.", ExamContentService.publishProblem(e));
    }

    @Test
    void previewShowsBothTasks() {
        ParsedExercise parsed = validate(exercise()).exercises().get(0);
        ExercisePreview preview = ExamContentMapper.toPreview(parsed);
        assertNotNull(preview.writingChoice());
        assertEquals(30, preview.writingChoice().durationMinutes());
        assertEquals(2, preview.writingChoice().tasks().size());
        assertEquals(4, preview.writingChoice().tasks().get(1).points().size());
    }

    @Test
    void exportRoundTripsThroughTheImportFormat() {
        ParsedExercise parsed = validate(exercise()).exercises().get(0);
        ExamExercise e = ExamContentMapper.toEntity(parsed, ExamType.DTZ, "1.0", "1.0", "hash", "admin");
        ObjectNode exported = ExamContentMapper.toExportNode(MAPPER, e);
        assertNotNull(exported);
        assertEquals(2, exported.get("tasks").size());
        assertEquals(30, exported.get("durationMinutes").asInt());
        assertEquals(List.of(), validate(exported).exerciseIssues().get(0).stream().filter(i -> "ERROR".equals(i.severity())).map(i -> i.code()).toList());
    }

    @Test
    void duplicateTextsComeFromBothTasks() {
        ParsedExercise parsed = validate(exercise()).exercises().get(0);
        assertEquals(2, parsed.textContents().size());
        assertTrue(parsed.textContents().get(0).contains("Schwimmkurs"));
    }

    // ------------------------------------------------------------------ prompt

    private PromptRequest request(String difficulty, String topic, String purpose, String format, String pair) {
        return new PromptRequest("DTZ", "A2_B1", "SCHREIBEN", "TEIL_1", 1, difficulty, topic == null ? List.of() : List.of(topic), null,
                null, purpose, null, null, null, null, null, format, null, null, null, null, null, null, null, null, null, pair);
    }

    @Test
    void promptContainsTheMandatoryStructureAndTheCurrentSettings() {
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request("B1", "HOUSING_NEIGHBOURS", "COMPLAINT", "FORMAL", "DIFFERENT_PURPOSES"), 0, 1);
        String prompt = r.prompt();
        assertTrue(prompt.contains("Difficulty: B1"));
        assertTrue(prompt.contains("Preferred topic: Housing and neighbours"));
        assertTrue(prompt.contains("Preferred communication purpose: complaint"));
        assertTrue(prompt.contains("formal email or letter"));
        assertTrue(prompt.contains("two different communication purposes"));
        assertTrue(prompt.contains(ExamContentSpecs.WRITING_CHOICE_INSTRUCTIONS));
        assertTrue(prompt.contains("exactly four content points for Aufgabe A"));
        assertTrue(prompt.contains("\"exerciseType\" : \"WRITING_TASK_CHOICE\""));
        assertTrue(prompt.contains("\"durationMinutes\" : 30"));
        assertFalse(prompt.contains("{{"), "no unresolved placeholder");
    }

    @Test
    void promptChangesWhenTheSettingsChange() {
        ExamContentPromptBuilder builder = new ExamContentPromptBuilder();
        String one = builder.build(spec, request("A2", "TRAVEL_ACCOMMODATION", "APPLICATION", "INFORMAL_EMAIL", "FORMAL_AND_INFORMAL"), 0, 1).prompt();
        String two = builder.build(spec, request("B1", null, null, null, null), 0, 1).prompt();
        assertNotEquals(one, two);
        assertTrue(one.contains("Travel and accommodation"));
        assertTrue(two.contains("random (your choice of everyday topics)"));
    }

    @Test
    void promptIsStillAcceptedByTheImporterWhenFilledWithValidContent() {
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request("A2_B1", null, null, null, null), 0, 1);
        assertDoesNotThrow(() -> MAPPER.readTree(r.jsonExample()));
        // The example has placeholders ("..."), which the importer must refuse rather than store.
        ObjectNode example = (ObjectNode) assertDoesNotThrow(() -> MAPPER.readTree(r.jsonExample()));
        assertTrue(errors(example).contains("PLACEHOLDER_CONTENT"));
    }

    @Test
    void unknownSettingIsRejected() {
        assertThrows(IllegalArgumentException.class, () ->
                new ExamContentPromptBuilder().build(spec, request("B1", null, "NONSENSE", null, null), 0, 1));
    }

    @Test
    void severalSetsProduceABatchPrompt() {
        PromptRequest r = new PromptRequest("DTZ", "A2_B1", "SCHREIBEN", "TEIL_1", 3, "B1", List.of(), null,
                null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
        PromptResponse res = new ExamContentPromptBuilder().build(spec, r, 0, 1);
        assertTrue(res.prompt().contains("exactly 3 complete, clearly different writing exercises"));
        assertTrue(res.prompt().contains("EXAM_EXERCISE_BATCH"));
        assertTrue(res.jsonExample().contains("\"exercises\""));
        assertFalse(res.prompt().contains("{{"));
    }

    @Test
    void severalTopicsAreAllOffered() {
        PromptRequest r = new PromptRequest("DTZ", "A2_B1", "SCHREIBEN", "TEIL_1", 1, "B1", List.of("HOUSING_NEIGHBOURS", "Umzug in eine neue Stadt"), null,
                null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
        String prompt = new ExamContentPromptBuilder().build(spec, r, 0, 1).prompt();
        assertTrue(prompt.contains("Housing and neighbours; Umzug in eine neue Stadt"));
    }
}
