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

/** DTZ A2-B1 Lesen Teil 4: one information text and three richtig/falsch statements numbered 37-39. */
class ExamContentTrueFalseTextTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final ExamContentValidator validator = new ExamContentValidator();
    private final ExamContentSpec spec = ExamContentSpecs.find(ExamType.DTZ, LearningLevel.B1, ExamSection.LESEVERSTEHEN, 4).orElseThrow();

    private static final String BODY = "Die Mittagsbetreuung an der Grundschule am Park ist von Montag bis Freitag von 11.30 bis 15.00 Uhr geöffnet. "
            + "Die Kinder essen gemeinsam zu Mittag und machen danach Hausaufgaben. Das Mittagessen kostet 3,50 Euro pro Tag. "
            + "Familien mit mehreren Kindern zahlen für das zweite Kind nur die Hälfte. "
            + "Die Anmeldung ist nur zu Beginn des Schuljahres möglich. Bitte geben Sie das Formular im Sekretariat ab. "
            + "Wenn Ihr Kind krank ist, rufen Sie bitte bis 8.00 Uhr im Sekretariat an. Die Betreuung ist in den Ferien geschlossen.";
    private static final List<String> STATEMENTS = List.of(
            "Die Mittagsbetreuung ist auch am Wochenende geöffnet.",
            "Für das zweite Kind bezahlt man weniger.",
            "Man kann sich im Laufe des Schuljahres anmelden.");
    private static final List<String> KEY = List.of("FALSCH", "RICHTIG", "FALSCH");

    private static ExamContentSpec spec4() {
        return ExamContentSpecs.find(ExamType.DTZ, LearningLevel.B1, ExamSection.LESEVERSTEHEN, 4).orElseThrow();
    }

    private static ObjectNode exercise() {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("exam", "DTZ");
        ex.put("section", "LESEN");
        ex.put("part", 4);
        ex.put("exerciseType", "TEXT_TRUE_FALSE");
        ex.put("level", "A2_B1");
        ex.put("title", "Mittagsbetreuung an der Grundschule");
        ex.put("topic", "Schule und Kinderbetreuung");
        ex.put("difficulty", "A2_B1");
        ex.putObject("instructions").put("de", spec4().defaultInstructions());
        ObjectNode text = ex.putObject("text");
        text.put("type", "INFORMATION_SHEET");
        text.put("title", "Informationen für Eltern");
        text.put("body", BODY);
        ArrayNode questions = ex.putArray("questions");
        for (int i = 0; i < 3; i++) {
            ObjectNode q = questions.addObject();
            q.put("number", 37 + i);
            q.put("type", "TRUE_FALSE");
            q.put("statement", STATEMENTS.get(i));
            q.put("correctAnswer", KEY.get(i));
            q.putObject("explanation").put("de", "Erklärung " + (i + 1)).put("en", "Explanation " + (i + 1)).put("fa", "توضیح " + (i + 1));
        }
        ObjectNode meta = ex.putObject("metadata");
        meta.put("schemaVersion", 1);
        meta.put("source", "AI_IMPORTED");
        meta.putArray("tags");
        return ex;
    }

    private static List<String> errors(ExamContentValidator.FileResult r) {
        return r.exerciseIssues().get(0).stream().filter(i -> "ERROR".equals(i.severity())).map(Issue::code).toList();
    }

    private static List<String> warnings(ExamContentValidator.FileResult r) {
        return r.exerciseIssues().get(0).stream().filter(i -> "WARNING".equals(i.severity())).map(Issue::code).toList();
    }

    private List<String> errorsOf(ObjectNode ex) {
        return errors(validator.validate(ex));
    }

    private ExamExercise entity() {
        ParsedExercise parsed = validator.validate(exercise()).exercises().get(0);
        return ExamContentMapper.toEntity(parsed, ExamType.DTZ, "1.0", "1.0", "hash", "user");
    }

    // ------------------------------------------------------------------ structure

    @Test
    void validExerciseIsAcceptedAndResolvesTheTeil4Spec() {
        var result = validator.validate(exercise());
        assertTrue(result.fileIssues().isEmpty(), result.fileIssues().toString());
        assertTrue(errors(result).isEmpty(), errors(result).toString());
        ParsedExercise parsed = result.exercises().get(0);
        assertTrue(parsed.spec().isTrueFalseText());
        assertEquals(1, parsed.textSet().texts().size());
        assertEquals(3, parsed.questions().size());
        assertEquals(List.of(37, 38, 39), parsed.questions().stream().map(ParsedExercise.Question::number).toList());
        assertTrue(warnings(result).contains("SEMANTIC_REVIEW_NEEDED"), "semantic correctness is never certified automatically");
    }

    @Test
    void textShapedAsAOneElementTextsArrayIsAlsoAccepted() {
        ObjectNode ex = exercise();
        ArrayNode texts = ex.putArray("texts");
        texts.add(ex.remove("text"));
        assertEquals(List.of(), errorsOf(ex));
    }

    @Test
    void missingTextIsRejected() {
        ObjectNode ex = exercise();
        ex.remove("text");
        assertTrue(errorsOf(ex).contains("TEXT_MISSING"));
    }

    @Test
    void emptyTextTitleOrBodyIsRejected() {
        ObjectNode noBody = exercise();
        ((ObjectNode) noBody.get("text")).put("body", "   ");
        assertTrue(errorsOf(noBody).contains("TEXT_BODY_MISSING"));
        ObjectNode noTitle = exercise();
        ((ObjectNode) noTitle.get("text")).remove("title");
        assertTrue(errorsOf(noTitle).contains("TEXT_TITLE_MISSING"));
    }

    @Test
    void moreThanOneTextIsRejected() {
        ObjectNode ex = exercise();
        ArrayNode texts = ex.putArray("texts");
        texts.add(ex.get("text").deepCopy());
        assertTrue(errorsOf(ex).contains("TEXT_COUNT"), "text and texts together");
        ex.remove("text");
        texts.add(texts.get(0).deepCopy());
        assertTrue(errorsOf(ex).contains("TEXT_COUNT"), "two texts");
    }

    @Test
    void textIsNotAnObjectIsRejected() {
        ObjectNode ex = exercise();
        ex.put("text", "Ein einfacher Text.");
        assertTrue(errorsOf(ex).contains("TEXT_NOT_OBJECT"));
    }

    @Test
    void wrongQuestionCountIsRejected() {
        ObjectNode two = exercise();
        ((ArrayNode) two.get("questions")).remove(2);
        assertTrue(errorsOf(two).contains("QUESTION_COUNT"));
        ObjectNode four = exercise();
        ((ArrayNode) four.get("questions")).add(((ArrayNode) four.get("questions")).get(0).deepCopy());
        assertTrue(errorsOf(four).contains("QUESTION_COUNT"));
        ObjectNode none = exercise();
        none.remove("questions");
        assertTrue(errorsOf(none).contains("QUESTIONS_MISSING"));
    }

    @Test
    void questionNumbersMustBeThirtySevenToThirtyNineInOrder() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("questions").get(0)).put("number", 31);
        assertTrue(errorsOf(ex).contains("QUESTION_NUMBERS"));
        ObjectNode swapped = exercise();
        ((ObjectNode) swapped.get("questions").get(1)).put("number", 39);
        ((ObjectNode) swapped.get("questions").get(2)).put("number", 38);
        assertTrue(errorsOf(swapped).contains("QUESTION_NUMBERS"));
        ObjectNode missing = exercise();
        ((ObjectNode) missing.get("questions").get(1)).remove("number");
        assertTrue(errorsOf(missing).contains("QUESTION_NUMBER_MISSING"));
    }

    @Test
    void everyQuestionMustBeTrueFalse() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("questions").get(1)).put("type", "MULTIPLE_CHOICE");
        assertTrue(errorsOf(ex).contains("QUESTION_TYPE_INVALID"));
    }

    @Test
    void answersMustBeRichtigOrFalsch() {
        for (String bad : new String[]{"NICHT_IM_TEXT", "a", "true", ""}) {
            ObjectNode ex = exercise();
            ((ObjectNode) ex.get("questions").get(0)).put("correctAnswer", bad);
            assertTrue(errorsOf(ex).contains("TF_ANSWER_INVALID"), bad);
        }
        ObjectNode lower = exercise();
        ((ObjectNode) lower.get("questions").get(0)).put("correctAnswer", "falsch");
        assertEquals(List.of(), errorsOf(lower), "case is normalised");
    }

    @Test
    void emptyStatementIsRejected() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("questions").get(2)).put("statement", " ");
        assertTrue(errorsOf(ex).contains("QUESTION_TEXT_EMPTY"));
    }

    @Test
    void explanationsInAllThreeLanguagesAreRequired() {
        for (String lang : List.of("de", "en", "fa")) {
            ObjectNode ex = exercise();
            ((ObjectNode) ex.get("questions").get(1).get("explanation")).remove(lang);
            assertTrue(errorsOf(ex).contains("EXPLANATION_MISSING"), lang);
        }
        ObjectNode none = exercise();
        ((ObjectNode) none.get("questions").get(0)).remove("explanation");
        assertTrue(errorsOf(none).contains("EXPLANATION_MISSING"));
    }

    @Test
    void placeholdersMarkupAndWrongExerciseTypeAreErrors() {
        ObjectNode placeholder = exercise();
        ((ObjectNode) placeholder.get("questions").get(0)).put("statement", "...");
        assertTrue(errorsOf(placeholder).contains("PLACEHOLDER_CONTENT"));
        ObjectNode markup = exercise();
        ((ObjectNode) markup.get("text")).put("body", BODY + "<script>alert(1)</script>");
        assertTrue(errorsOf(markup).contains("HTML_CONTENT"));
        ObjectNode type = exercise();
        type.put("exerciseType", "TEXT_COMPREHENSION_MIXED");
        assertTrue(errorsOf(type).contains("EXERCISE_TYPE_INVALID"));
    }

    @Test
    void missingMetadataIsRejected() {
        ObjectNode ex = exercise();
        ex.remove("metadata");
        assertTrue(errorsOf(ex).contains("METADATA_REQUIRED"));
    }

    @Test
    void requiredHeaderFieldsAreChecked() {
        ObjectNode ex = exercise();
        ex.remove("title");
        ex.remove("instructions");
        assertTrue(errorsOf(ex).containsAll(List.of("TITLE_MISSING", "INSTRUCTIONS_MISSING")));
    }

    @Test
    void semanticDoubtsAreOnlyWarnings() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("questions").get(0)).put("statement", "Quantenphysik erklärt Sternenexplosionen vollständig.");
        for (int i = 0; i < 3; i++) ((ObjectNode) ex.get("questions").get(i)).put("correctAnswer", "RICHTIG");
        ((ObjectNode) ex.get("text")).put("body", "Kurzer Text mit wenigen Wörtern.");
        var result = validator.validate(ex);
        assertTrue(errors(result).isEmpty(), errors(result).toString());
        List<String> warnings = warnings(result);
        assertTrue(warnings.contains("ANSWER_SUPPORT_UNCLEAR"), warnings.toString());
        assertTrue(warnings.contains("ANSWER_SEQUENCE_PREDICTABLE"), warnings.toString());
        assertTrue(warnings.contains("TEXT_SHORT"), warnings.toString());
    }

    // ------------------------------------------------------------------ storage, publication, learner

    @Test
    void importedEntityStoresTheTextAsPassageAndTheStatementsAsQuestions() {
        ExamExercise e = entity();
        assertEquals(ExamTaskType.TEXT_TRUE_FALSE, e.getTaskType());
        assertEquals(ExamSection.LESEVERSTEHEN, e.getSection());
        assertEquals(LearningLevel.B1, e.getLevel());
        assertEquals(4, e.getPartNumber());
        assertEquals(ExamContentStatus.DRAFT, e.getStatus(), "imports default to DRAFT");
        assertEquals(1, e.getPassages().size());
        assertEquals("Informationen für Eltern", e.getPassages().get(0).getLabel());
        assertEquals(3, e.getQuestions().size());
        assertEquals(37, e.getQuestions().get(0).getQuestionNumber());
        assertEquals(ExamTaskType.TRUE_FALSE, e.getQuestions().get(0).getTaskType());
        assertEquals("FALSCH", e.getQuestions().get(0).getCorrectAnswer());
        assertEquals("Erklärung 2", e.getQuestions().get(1).getExplanation());
        assertEquals(0, e.getQuestions().get(2).getSectionIndex());
    }

    @Test
    void publishRequiresOneTextAndThreeWellFormedStatements() {
        assertNull(ExamContentService.publishProblem(entity()));
        ExamExercise fewer = entity();
        fewer.getQuestions().remove(2);
        assertNotNull(ExamContentService.publishProblem(fewer));
        ExamExercise twoTexts = entity();
        twoTexts.getPassages().add(twoTexts.getPassages().get(0));
        assertNotNull(ExamContentService.publishProblem(twoTexts));
        ExamExercise badAnswer = entity();
        badAnswer.getQuestions().get(0).setCorrectAnswer("NICHT_IM_TEXT");
        assertNotNull(ExamContentService.publishProblem(badAnswer));
        ExamExercise badNumber = entity();
        badNumber.getQuestions().get(1).setQuestionNumber(40);
        assertNotNull(ExamContentService.publishProblem(badNumber));
        ExamExercise emptyText = entity();
        emptyText.getPassages().get(0).setContent("<p> </p>");
        assertNotNull(ExamContentService.publishProblem(emptyText));
    }

    @Test
    void learnerResponseNeverContainsTheAnswerKeyOrExplanations() {
        ExamExercise entity = entity();
        entity.prePersist();
        var publicResponse = ExamExerciseMapper.mapToPublicResponse(entity);
        assertEquals(3, publicResponse.questions().size());
        assertEquals(1, publicResponse.passages().size());
        String json = assertDoesNotThrow(() -> MAPPER.writeValueAsString(publicResponse));
        assertFalse(json.contains("correctAnswer"));
        assertFalse(json.contains("Erklärung 1"), "explanations are only revealed after submitting");
        assertFalse(json.contains("Explanation 1"));
    }

    @Test
    void previewCarriesTheTextStatementsAndTheAnswerKeyForTheAdmin() {
        ParsedExercise parsed = validator.validate(exercise()).exercises().get(0);
        var preview = ExamContentMapper.toPreview(parsed);
        var view = preview.textQuestions();
        assertNotNull(view);
        assertEquals(1, view.texts().size());
        assertEquals("INFORMATION_SHEET", view.texts().get(0).type());
        assertEquals(BODY, view.texts().get(0).body());
        assertEquals(3, view.texts().get(0).tasks().size());
        assertEquals("FALSCH", view.texts().get(0).tasks().get(0).correctAnswer());
        assertEquals("Explanation 2", view.texts().get(0).tasks().get(1).explanation().get("en"));
        assertEquals("توضیح 3", view.texts().get(0).tasks().get(2).explanation().get("fa"));
        assertEquals(3, preview.questions().size());
    }

    @Test
    void exportIsImportableAgain() {
        ObjectNode exported = ExamContentMapper.toExportNode(MAPPER, entity());
        assertNotNull(exported);
        assertEquals("TEXT_TRUE_FALSE", exported.get("exerciseType").asText());
        assertEquals(4, exported.get("part").asInt());
        assertEquals("INFORMATION_SHEET", exported.get("text").get("type").asText());
        assertEquals(BODY, exported.get("text").get("body").asText());
        assertEquals(3, exported.get("questions").size());
        assertEquals("RICHTIG", exported.get("questions").get(1).get("correctAnswer").asText());
        assertEquals("Explanation 3", exported.get("questions").get(2).get("explanation").get("en").asText());
        var again = validator.validate(exported);
        assertTrue(again.fileIssues().isEmpty(), again.fileIssues().toString());
        assertTrue(errors(again).isEmpty(), errors(again).toString());
    }

    @Test
    void duplicateDetectionUsesTheTextBody() {
        var first = validator.validate(exercise()).exercises().get(0);
        String hash = ExamContentFingerprint.hashTexts(first.textContents());
        var twin = validator.validate(exercise()).exercises().get(0);
        var matches = new ExamDuplicateDetector().detect(twin, ExamType.DTZ, hash,
                List.of(ExamDuplicateDetector.Candidate.of(first, ExamType.DTZ, hash)));
        assertFalse(matches.isEmpty());
    }

    // ------------------------------------------------------------------ prompt

    @Test
    void promptReflectsTheSelectedSettingsAndItsExampleIsValidStructure() throws Exception {
        PromptRequest request = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_4", 1, "B1", List.of("HOUSING"), "Nur Alltagssituationen.", null, "RULES_AND_CONDITIONS", null,
                null, null, null, null, null, null, null, "NEW_SCENARIO", null, null, null, "LONG", null, List.of("wohnen"));
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request, 0, 1);
        assertTrue(r.prompt().contains("Difficulty: B1"));
        assertTrue(r.prompt().contains("Topic: Housing and tenants"));
        assertTrue(r.prompt().contains("Text length: longer (about 260–300 words)"));
        assertTrue(r.prompt().contains("Text style: rules and conditions (text.type RULES_AND_CONDITIONS)"));
        assertTrue(r.prompt().contains("Put these tags into metadata.tags: wohnen."));
        assertTrue(r.prompt().contains("Nur Alltagssituationen."));
        assertTrue(r.prompt().contains("Entscheiden Sie, ob die Aussagen 37–39 richtig oder falsch sind."));
        assertTrue(r.prompt().contains("For B1:"));
        assertFalse(r.prompt().contains("{{"), "no unresolved placeholder");
        var example = MAPPER.readTree(r.jsonExample());
        assertEquals("TEXT_TRUE_FALSE", example.get("exerciseType").asText());
        assertEquals(4, example.get("part").asInt());
        assertEquals("A2_B1", example.get("level").asText(), "the file level stays A2_B1 so the DTZ spec resolves; the difficulty is separate");
        assertEquals("B1", example.get("difficulty").asText());
        assertEquals("RULES_AND_CONDITIONS", example.get("text").get("type").asText());
        assertEquals(3, example.get("questions").size());
        assertEquals(39, example.get("questions").get(2).get("number").asInt());
        assertEquals("wohnen", example.get("metadata").get("tags").get(0).asText());
        assertEquals("DTZ-B1-L4-001", r.firstExternalId());
    }

    @Test
    void defaultsAreRandomTopicAndStyleAtMediumLength() {
        PromptRequest request = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_4", 1, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null);
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request, 0, 1);
        assertTrue(r.prompt().contains("Difficulty: A2_B1"));
        assertTrue(r.prompt().contains("any suitable everyday topic"));
        assertTrue(r.prompt().contains("Text length: medium (about 210–260 words)"));
        assertTrue(r.prompt().contains("Text style: your choice of INFORMATION_SHEET"));
    }

    @Test
    void severalTopicsAndSeveralExercisesAskForABatchFileThatTheValidatorUnderstands() throws Exception {
        PromptRequest request = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_4", 3, null, List.of("HOUSING", "WORK_EMPLOYMENT"), null, null, null, null,
                null, null, null, null, null, null, null, null);
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request, 0, 1);
        assertTrue(r.prompt().contains("Generate exactly 3 complete, clearly different exercises"));
        assertTrue(r.prompt().contains("Topic: Housing and tenants; Work and employment"));
        assertTrue(r.prompt().contains("EXAM_EXERCISE_BATCH"));
        assertFalse(r.prompt().contains("{{"));
        var example = MAPPER.readTree(r.jsonExample());
        assertEquals("EXAM_EXERCISE_BATCH", example.get("contentType").asText());
        assertEquals("TEIL_4", example.get("part").asText());
        ObjectNode batch = MAPPER.createObjectNode();
        batch.put("schemaVersion", "1.0");
        batch.put("contentType", "EXAM_EXERCISE_BATCH");
        batch.put("exam", "DTZ");
        batch.put("level", "A2_B1");
        batch.put("section", "LESEN");
        batch.put("part", "TEIL_4");
        batch.putArray("exercises").add(exercise()).add(exercise());
        var result = validator.validate(batch);
        assertTrue(result.fileIssues().isEmpty(), result.fileIssues().toString());
        assertEquals(2, result.exercises().size());
        assertTrue(result.exerciseIssues().values().stream().flatMap(List::stream).noneMatch(i -> "ERROR".equals(i.severity()) && !i.code().startsWith("EXTERNAL")));
    }

    @Test
    void unknownPromptSettingsAreRejected() {
        var builder = new ExamContentPromptBuilder();
        assertThrows(IllegalArgumentException.class, () -> builder.build(spec, new PromptRequest("DTZ", "B1", "LESEN", "TEIL_4", 1, null,
                List.of("SPACE"), null, null, null, null, null, null, null, null, null, null, null, null), 0, 1));
        assertThrows(IllegalArgumentException.class, () -> builder.build(spec, new PromptRequest("DTZ", "B1", "LESEN", "TEIL_4", 1, null,
                null, null, null, "POEM", null, null, null, null, null, null, null, null, null), 0, 1));
    }
}
