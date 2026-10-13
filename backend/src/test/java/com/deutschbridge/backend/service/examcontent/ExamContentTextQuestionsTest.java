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

/** DTZ A2-B1 Lesen Teil 3: three texts, each with a richtig/falsch and a multiple-choice question, numbered 31-36. */
class ExamContentTextQuestionsTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final ExamContentValidator validator = new ExamContentValidator();
    private final ExamContentSpec spec = ExamContentSpecs.find(ExamType.DTZ, LearningLevel.B1, ExamSection.LESEVERSTEHEN, 3).orElseThrow();

    private static final List<String> TYPES = List.of("PRESS_TEXT", "EMAIL", "FORMAL_NOTICE");
    private static final List<String> TITLES = List.of("Neue Bibliothek im Stadtteil", "Änderung beim Deutschkurs", "Wichtige Mitteilung zur Müllabfuhr");
    private static final List<String> BODIES = List.of(
            "Im Stadtteil Nord hat am Montag eine neue Bibliothek eröffnet. Sie ist von Dienstag bis Samstag geöffnet. "
                    + "Kinder können dort kostenlos Bücher ausleihen, Erwachsene zahlen einen kleinen Jahresbeitrag von zehn Euro. "
                    + "Außerdem gibt es jeden Mittwoch eine Vorlesestunde für Familien. Die Stadt möchte mit dem Angebot das Lesen fördern.",
            "Liebe Kursteilnehmerinnen und Kursteilnehmer, der Deutschkurs am Donnerstag beginnt ab nächster Woche schon um 17 Uhr statt um 18 Uhr. "
                    + "Der Raum bleibt gleich. Bitte bringen Sie Ihr Arbeitsbuch mit, denn wir wiederholen Kapitel vier. "
                    + "Wenn Sie nicht kommen können, schreiben Sie mir bitte bis Dienstag eine kurze Nachricht.",
            "Die Müllabfuhr kommt in der kommenden Woche wegen eines Feiertags einen Tag später als gewohnt. "
                    + "Bitte stellen Sie die Tonnen erst am Abend vor der Abholung an den Straßenrand. "
                    + "Tonnen, die zu früh draußen stehen, werden nicht geleert. Weitere Informationen erhalten Sie beim Bürgerbüro.");
    private static final List<String> STATEMENTS = List.of(
            "Die Bibliothek ist auch am Montag geöffnet.",
            "Der Deutschkurs findet in einem anderen Raum statt.",
            "Die Müllabfuhr kommt in der nächsten Woche später.");
    private static final List<String> TF_KEY = List.of("FALSCH", "FALSCH", "RICHTIG");
    private static final List<String> QUESTIONS = List.of(
            "Was kostet die Bibliothek für Erwachsene?",
            "Was sollen die Teilnehmer tun, wenn sie nicht kommen können?",
            "Warum sollen die Tonnen nicht zu früh draußen stehen?");
    private static final List<List<String>> OPTIONS = List.of(
            List.of("Sie ist für Erwachsene kostenlos.", "Sie kostet zehn Euro im Jahr.", "Sie kostet zehn Euro im Monat."),
            List.of("Sie sollen im Kurs anrufen.", "Sie sollen eine Nachricht schreiben.", "Sie sollen das Arbeitsbuch abgeben."),
            List.of("Sie werden sonst nicht geleert.", "Sie sind sonst zu schwer.", "Sie müssen bezahlt werden."));
    private static final List<String> MC_KEY = List.of("b", "b", "a");

    private static ObjectNode exercise() {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("exam", "DTZ");
        ex.put("section", "LESEN");
        ex.put("part", 3);
        ex.put("exerciseType", "TEXT_COMPREHENSION_MIXED");
        ex.put("skill", "PRESS_TEXTS_AND_FORMAL_NOTICES");
        ex.put("level", "A2_B1");
        ex.put("title", "Neuigkeiten aus dem Alltag");
        ex.put("topic", "Öffentliche Informationen");
        ex.put("difficulty", "A2_B1");
        ex.putObject("instructions").put("de", spec().defaultInstructions());
        ArrayNode texts = ex.putArray("texts");
        for (int i = 0; i < 3; i++) {
            ObjectNode t = texts.addObject();
            t.put("id", "text_" + (i + 1));
            t.put("number", i + 1);
            t.put("type", TYPES.get(i));
            t.put("title", TITLES.get(i));
            if (i == 0) t.putNull("sender"); else t.put("sender", i == 1 ? "Frau Weber, Kursleitung" : "Stadtverwaltung Musterstadt");
            if (i == 2) t.put("date", "12. März"); else t.putNull("date");
            t.put("body", BODIES.get(i));
            ArrayNode questions = t.putArray("questions");
            ObjectNode tf = questions.addObject();
            tf.put("number", 31 + i * 2);
            tf.put("type", "TRUE_FALSE");
            tf.put("statement", STATEMENTS.get(i));
            tf.put("correctAnswer", TF_KEY.get(i));
            tf.putObject("explanation").put("de", "Erklärung TF " + (i + 1)).put("en", "Explanation TF " + (i + 1)).put("fa", "توضیح " + (i + 1));
            ObjectNode mc = questions.addObject();
            mc.put("number", 32 + i * 2);
            mc.put("type", "MULTIPLE_CHOICE");
            mc.put("question", QUESTIONS.get(i));
            ArrayNode options = mc.putArray("options");
            for (int j = 0; j < 3; j++) options.addObject().put("key", String.valueOf((char) ('a' + j))).put("text", OPTIONS.get(i).get(j));
            mc.put("correctAnswer", MC_KEY.get(i));
            mc.putObject("explanation").put("de", "Erklärung MC " + (i + 1)).put("en", "Explanation MC " + (i + 1)).put("fa", "توضیح MC " + (i + 1));
        }
        ObjectNode meta = ex.putObject("metadata");
        meta.put("schemaVersion", 1);
        meta.put("source", "AI_IMPORTED");
        meta.putArray("tags").add("alltag");
        return ex;
    }

    private static ExamContentSpec spec() {
        return ExamContentSpecs.find(ExamType.DTZ, LearningLevel.B1, ExamSection.LESEVERSTEHEN, 3).orElseThrow();
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

    private static ArrayNode questionsOf(ObjectNode ex, int text) {
        return (ArrayNode) ex.get("texts").get(text).get("questions");
    }

    private ExamExercise entity() {
        ParsedExercise parsed = validator.validate(exercise()).exercises().get(0);
        return ExamContentMapper.toEntity(parsed, ExamType.DTZ, "1.0", "1.0", "hash", "user");
    }

    // ------------------------------------------------------------------ structure

    @Test
    void validExerciseResolvesTheTextQuestionsSpec() {
        var result = validator.validate(exercise());
        assertTrue(result.fileIssues().isEmpty(), result.fileIssues().toString());
        assertTrue(errors(result).isEmpty(), errors(result).toString());
        ParsedExercise parsed = result.exercises().get(0);
        assertTrue(parsed.spec().isTextQuestions());
        assertEquals(3, parsed.textSet().texts().size());
        assertEquals(6, parsed.questions().size());
        assertEquals("DTZ-B1-L3-", spec.externalIdPrefix());
        assertTrue(warnings(result).contains("SEMANTIC_REVIEW_NEEDED"), "semantic correctness is never certified automatically");
    }

    @Test
    void invalidJsonShapeIsRejectedAsAnImportError() {
        assertFalse(ExamImportParser.parse("{ \"exam\": \"DTZ\", ").ok(), "broken JSON is rejected before validation");
        var result = validator.validate(MAPPER.createObjectNode().put("exerciseType", "TEXT_COMPREHENSION_MIXED"));
        assertFalse(result.fileIssues().isEmpty() && errors(result).isEmpty(), "a file without exam / section / part cannot be imported");
    }

    @Test
    void twoOrFourTextsAreRejected() {
        ObjectNode two = exercise();
        ((ArrayNode) two.get("texts")).remove(2);
        assertTrue(errorsOf(two).contains("TEXT_COUNT"));
        ObjectNode four = exercise();
        ((ArrayNode) four.get("texts")).add(four.get("texts").get(0).deepCopy());
        assertTrue(errorsOf(four).contains("TEXT_COUNT"));
    }

    @Test
    void textIdsAndNumbersMustBeUniqueAndInOrder() {
        ObjectNode duplicateId = exercise();
        ((ObjectNode) duplicateId.get("texts").get(1)).put("id", "text_1");
        assertTrue(errorsOf(duplicateId).contains("TEXT_ID_DUPLICATE"));
        ObjectNode wrongNumber = exercise();
        ((ObjectNode) wrongNumber.get("texts").get(2)).put("number", 5);
        assertTrue(errorsOf(wrongNumber).contains("TEXT_NUMBER_INVALID"));
        ObjectNode duplicateNumber = exercise();
        ((ObjectNode) duplicateNumber.get("texts").get(1)).put("number", 1);
        assertTrue(errorsOf(duplicateNumber).contains("TEXT_NUMBER_INVALID"));
    }

    @Test
    void textNeedsTypeTitleAndBody() {
        ObjectNode badType = exercise();
        ((ObjectNode) badType.get("texts").get(0)).put("type", "TWEET");
        assertTrue(errorsOf(badType).contains("TEXT_TYPE_INVALID"));
        ObjectNode noTitle = exercise();
        ((ObjectNode) noTitle.get("texts").get(0)).remove("title");
        assertTrue(errorsOf(noTitle).contains("TEXT_TITLE_MISSING"));
        ObjectNode noBody = exercise();
        ((ObjectNode) noBody.get("texts").get(0)).put("body", "  ");
        assertTrue(errorsOf(noBody).contains("TEXT_BODY_MISSING"));
    }

    @Test
    void aMissingQuestionIsRejected() {
        ObjectNode ex = exercise();
        questionsOf(ex, 1).remove(1);
        assertTrue(errorsOf(ex).contains("QUESTION_COUNT"));
        ObjectNode extra = exercise();
        questionsOf(extra, 0).add(questionsOf(extra, 0).get(0).deepCopy());
        assertTrue(errorsOf(extra).contains("QUESTION_COUNT"));
        ObjectNode none = exercise();
        ((ObjectNode) none.get("texts").get(0)).remove("questions");
        assertTrue(errorsOf(none).contains("QUESTIONS_MISSING"));
    }

    @Test
    void questionNumbersMustBeThirtyOneToThirtySixInOrder() {
        ObjectNode ex = exercise();
        ((ObjectNode) questionsOf(ex, 0).get(0)).put("number", 21);
        assertTrue(errorsOf(ex).contains("QUESTION_NUMBERS"));
        ObjectNode swapped = exercise();
        ((ObjectNode) questionsOf(swapped, 1).get(0)).put("number", 36);
        assertTrue(errorsOf(swapped).contains("QUESTION_NUMBERS"));
        ObjectNode missing = exercise();
        ((ObjectNode) questionsOf(missing, 2).get(1)).remove("number");
        assertTrue(errorsOf(missing).contains("QUESTION_NUMBER_MISSING"));
    }

    @Test
    void questionTypesMustFollowTheRequiredSequence() {
        ObjectNode reversed = exercise();
        ((ObjectNode) questionsOf(reversed, 0).get(0)).put("type", "MULTIPLE_CHOICE");
        assertTrue(errorsOf(reversed).contains("QUESTION_TYPE_SEQUENCE"));
        ObjectNode unknown = exercise();
        ((ObjectNode) questionsOf(unknown, 2).get(1)).put("type", "NOT_GIVEN");
        assertTrue(errorsOf(unknown).contains("QUESTION_TYPE_SEQUENCE"));
    }

    @Test
    void trueFalseAnswersMustBeRichtigOrFalsch() {
        ObjectNode ex = exercise();
        ((ObjectNode) questionsOf(ex, 0).get(0)).put("correctAnswer", "NICHT_IM_TEXT");
        assertTrue(errorsOf(ex).contains("TF_ANSWER_INVALID"));
        ObjectNode missing = exercise();
        ((ObjectNode) questionsOf(missing, 1).get(0)).remove("correctAnswer");
        assertTrue(errorsOf(missing).contains("TF_ANSWER_INVALID"));
        ObjectNode lower = exercise();
        ((ObjectNode) questionsOf(lower, 0).get(0)).put("correctAnswer", "richtig");
        assertTrue(errorsOf(lower).isEmpty(), "the case of RICHTIG / FALSCH is not significant");
    }

    @Test
    void multipleChoiceNeedsExactlyThreeOptionsAToC() {
        ObjectNode two = exercise();
        ((ArrayNode) questionsOf(two, 0).get(1).get("options")).remove(2);
        assertTrue(errorsOf(two).contains("OPTION_COUNT"));
        ObjectNode four = exercise();
        ((ArrayNode) questionsOf(four, 0).get(1).get("options")).addObject().put("key", "d").put("text", "Etwas anderes.");
        assertTrue(errorsOf(four).contains("OPTION_COUNT"));
        ObjectNode duplicateKey = exercise();
        ((ObjectNode) questionsOf(duplicateKey, 0).get(1).get("options").get(1)).put("key", "a");
        assertTrue(errorsOf(duplicateKey).contains("OPTION_ID_DUPLICATE"));
        ObjectNode wrongKeys = exercise();
        ((ObjectNode) questionsOf(wrongKeys, 0).get(1).get("options").get(2)).put("key", "d");
        assertTrue(errorsOf(wrongKeys).contains("OPTION_IDS"));
        ObjectNode sameText = exercise();
        ((ObjectNode) questionsOf(sameText, 1).get(1).get("options").get(2)).put("text", OPTIONS.get(1).get(0));
        assertTrue(errorsOf(sameText).contains("OPTION_TEXT_DUPLICATE"));
    }

    @Test
    void multipleChoiceAnswerMustBeOneOfTheOptions() {
        ObjectNode ex = exercise();
        ((ObjectNode) questionsOf(ex, 0).get(1)).put("correctAnswer", "d");
        assertTrue(errorsOf(ex).contains("CORRECT_OPTION_UNKNOWN"));
        ObjectNode missing = exercise();
        ((ObjectNode) questionsOf(missing, 2).get(1)).remove("correctAnswer");
        assertTrue(errorsOf(missing).contains("CORRECT_OPTION_MISSING"));
    }

    @Test
    void germanExplanationIsRequiredOtherLanguagesOnlyWarn() {
        ObjectNode noExplanation = exercise();
        ((ObjectNode) questionsOf(noExplanation, 0).get(0)).remove("explanation");
        assertTrue(errorsOf(noExplanation).contains("EXPLANATION_MISSING"));
        ObjectNode noTranslations = exercise();
        ((ObjectNode) questionsOf(noTranslations, 0).get(0).get("explanation")).remove("fa");
        var result = validator.validate(noTranslations);
        assertTrue(errors(result).isEmpty());
        assertTrue(warnings(result).contains("EXPLANATION_TRANSLATION_MISSING"));
    }

    @Test
    void wrongExerciseTypeAndMarkupAreErrors() {
        ObjectNode wrongType = exercise();
        wrongType.put("exerciseType", "DIRECTORY_MATCHING");
        assertTrue(errorsOf(wrongType).contains("EXERCISE_TYPE_INVALID"));
        ObjectNode markup = exercise();
        ((ObjectNode) markup.get("texts").get(0)).put("body", BODIES.get(0) + " <script>alert(1)</script>");
        assertTrue(errorsOf(markup).contains("HTML_CONTENT"));
    }

    @Test
    void semanticDoubtsAreOnlyWarnings() {
        ObjectNode ex = exercise();
        for (int i = 0; i < 3; i++) {
            ((ObjectNode) ex.get("texts").get(i)).put("type", "EMAIL");
            ((ObjectNode) questionsOf(ex, i).get(0)).put("correctAnswer", "RICHTIG");
            ((ObjectNode) questionsOf(ex, i).get(1)).put("correctAnswer", "c");
            ((ObjectNode) ex.get("texts").get(i)).put("body", "Ein sehr kurzer Text.");
        }
        ((ObjectNode) questionsOf(ex, 0).get(0)).put("statement", "Der Himmel ist blau und die Zahlen sind gerade.");
        var result = validator.validate(ex);
        assertTrue(errors(result).isEmpty(), errors(result).toString());
        List<String> warnings = warnings(result);
        assertTrue(warnings.contains("TEXT_SHORT"));
        assertTrue(warnings.contains("TEXT_TYPES_IDENTICAL"));
        assertTrue(warnings.stream().filter("ANSWER_SEQUENCE_PREDICTABLE"::equals).count() >= 2);
        assertTrue(warnings.contains("ANSWER_SUPPORT_UNCLEAR"));
    }

    // ------------------------------------------------------------------ storage + learner + preview + export

    @Test
    void importedEntityStoresTextsAsPassagesAndTasksAsQuestions() {
        ExamExercise entity = entity();
        assertEquals(ExamTaskType.TEXT_QUESTIONS, entity.getTaskType());
        assertEquals(ExamType.DTZ, entity.getExamType());
        assertEquals(LearningLevel.B1, entity.getLevel());
        assertEquals(3, entity.getPartNumber());
        assertEquals(ExamContentStatus.DRAFT, entity.getStatus(), "imported content is never published automatically");
        assertFalse(entity.isPublished());
        assertEquals(3, entity.getPassages().size());
        assertEquals("Änderung beim Deutschkurs", entity.getPassages().get(1).getLabel());
        assertTrue(entity.getPassages().get(1).getContent().contains("Von: Frau Weber, Kursleitung"));
        assertTrue(entity.getPassages().get(2).getContent().contains("Datum: 12."));
        assertEquals(6, entity.getQuestions().size());
        assertEquals(List.of(31, 32, 33, 34, 35, 36), entity.getQuestions().stream().map(q -> q.getQuestionNumber()).toList());
        assertEquals(List.of(0, 0, 1, 1, 2, 2), entity.getQuestions().stream().map(q -> q.getSectionIndex()).toList());
        assertEquals(ExamTaskType.TRUE_FALSE, entity.getQuestions().get(0).getTaskType());
        assertEquals("FALSCH", entity.getQuestions().get(0).getCorrectAnswer());
        assertEquals(ExamTaskType.MULTIPLE_CHOICE, entity.getQuestions().get(1).getTaskType());
        assertEquals(OPTIONS.get(0).get(1), entity.getQuestions().get(1).getCorrectAnswer(), "the multiple-choice answer is the option's text");
        assertEquals("Erklärung TF 1", entity.getQuestions().get(0).getExplanation());
        assertEquals("Öffentliche Informationen", entity.getMetadata().get("topic"));
        assertEquals("PRESS_TEXT, EMAIL, FORMAL_NOTICE", entity.getMetadata().get("sourceType"));
        assertNull(ExamContentService.publishProblem(entity));
    }

    @Test
    void publishRequiresThreeTextsAndSixWellFormedQuestions() {
        ExamExercise fewerQuestions = entity();
        fewerQuestions.getQuestions().remove(5);
        assertNotNull(ExamContentService.publishProblem(fewerQuestions));
        ExamExercise twoTexts = entity();
        twoTexts.getPassages().remove(2);
        assertNotNull(ExamContentService.publishProblem(twoTexts));
        ExamExercise badAnswer = entity();
        badAnswer.getQuestions().get(0).setCorrectAnswer("NICHT_IM_TEXT");
        assertNotNull(ExamContentService.publishProblem(badAnswer));
        ExamExercise twoOptions = entity();
        twoOptions.getQuestions().get(1).setOptions(List.of("x", "y"));
        assertNotNull(ExamContentService.publishProblem(twoOptions));
        ExamExercise wrongKey = entity();
        wrongKey.getQuestions().get(3).setCorrectAnswer("nicht dabei");
        assertNotNull(ExamContentService.publishProblem(wrongKey));
    }

    @Test
    void learnerResponseNeverContainsTheAnswerKey() {
        ExamExercise entity = entity();
        entity.prePersist();
        var publicResponse = ExamExerciseMapper.mapToPublicResponse(entity);
        assertEquals(6, publicResponse.questions().size());
        assertEquals(3, publicResponse.passages().size());
        String json = assertDoesNotThrow(() -> MAPPER.writeValueAsString(publicResponse));
        assertFalse(json.contains("correctAnswer"));
        assertFalse(json.contains("Erklärung TF 1"), "explanations are only revealed after submitting");
        assertFalse(json.contains("Explanation TF 1"));
    }

    @Test
    void previewCarriesTextsTasksAndTheAnswerKeyForTheAdmin() {
        ParsedExercise parsed = validator.validate(exercise()).exercises().get(0);
        var preview = ExamContentMapper.toPreview(parsed);
        var view = preview.textQuestions();
        assertNotNull(view);
        assertEquals(3, view.texts().size());
        assertEquals("EMAIL", view.texts().get(1).type());
        assertEquals(2, view.texts().get(0).tasks().size());
        assertEquals("TRUE_FALSE", view.texts().get(0).tasks().get(0).type());
        assertEquals("FALSCH", view.texts().get(0).tasks().get(0).correctAnswer());
        assertEquals(3, view.texts().get(0).tasks().get(1).options().size());
        assertEquals("b", view.texts().get(0).tasks().get(1).correctAnswer());
        assertEquals("Explanation TF 1", view.texts().get(0).tasks().get(0).explanation().get("en"));
        assertEquals("توضیح 1", view.texts().get(0).tasks().get(0).explanation().get("fa"));
        assertEquals(6, preview.questions().size());
    }

    @Test
    void exportIsImportableAgain() {
        ObjectNode exported = ExamContentMapper.toExportNode(MAPPER, entity());
        assertNotNull(exported);
        assertEquals("TEXT_COMPREHENSION_MIXED", exported.get("exerciseType").asText());
        assertEquals(3, exported.get("texts").size());
        assertEquals("EMAIL", exported.get("texts").get(1).get("type").asText());
        assertEquals("Frau Weber, Kursleitung", exported.get("texts").get(1).get("sender").asText());
        assertTrue(exported.get("texts").get(0).get("sender").isNull());
        assertEquals(BODIES.get(1), exported.get("texts").get(1).get("body").asText(), "the sender line is not part of the exported body");
        assertEquals("FALSCH", exported.get("texts").get(0).get("questions").get(0).get("correctAnswer").asText());
        assertEquals("b", exported.get("texts").get(0).get("questions").get(1).get("correctAnswer").asText());
        assertEquals("Explanation MC 3", exported.get("texts").get(2).get("questions").get(1).get("explanation").get("en").asText());
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", "1.0");
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", "DTZ");
        root.put("level", "A2_B1");
        root.put("section", "LESEN");
        root.put("part", "TEIL_3");
        root.putArray("exercises").add(exported);
        var again = validator.validate(root);
        assertTrue(again.fileIssues().isEmpty(), again.fileIssues().toString());
        assertTrue(errors(again).isEmpty(), errors(again).toString());
    }

    @Test
    void duplicateDetectionUsesTheTextBodies() {
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
        PromptRequest request = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_3", 1, "A2", List.of("TRANSPORT", "WORK"), "Nur Alltagssituationen.", null, null, null,
                null, null, null, null, null, null, null, "NEW_SCENARIO", null, "PRESS_EMAIL_NOTICE", null, "SHORT", false, List.of("verkehr"));
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request, 0, 1);
        assertTrue(r.prompt().contains("Difficulty: A2"));
        assertTrue(r.prompt().contains("Public transport and mobility; Work and employment"));
        assertTrue(r.prompt().contains("Text types: Text 1 PRESS_TEXT, Text 2 EMAIL, Text 3 FORMAL_NOTICE"));
        assertTrue(r.prompt().contains("Text length: short (about 80–130 words per text)"));
        assertTrue(r.prompt().contains("Do not use specific dates or times"));
        assertTrue(r.prompt().contains("Put these tags into metadata.tags: verkehr."));
        assertTrue(r.prompt().contains("Nur Alltagssituationen."));
        assertTrue(r.prompt().contains("Lesen Sie die drei Texte. Zu jedem Text gibt es zwei Aufgaben."));
        assertFalse(r.prompt().contains("{{"), "no unresolved placeholder");
        var example = MAPPER.readTree(r.jsonExample());
        assertEquals("TEXT_COMPREHENSION_MIXED", example.get("exerciseType").asText());
        assertEquals("A2_B1", example.get("level").asText(), "the file level stays A2_B1 so the DTZ spec resolves; the difficulty is separate");
        assertEquals("A2", example.get("difficulty").asText());
        assertEquals(3, example.get("texts").size());
        assertEquals("FORMAL_NOTICE", example.get("texts").get(2).get("type").asText());
        assertEquals(35, example.get("texts").get(2).get("questions").get(0).get("number").asInt());
        assertEquals("verkehr", example.get("metadata").get("tags").get(0).asText());
        assertEquals("DTZ-B1-L3-001", r.firstExternalId());
    }

    @Test
    void defaultsAreARandomMixOfMediumLengthWithDates() {
        PromptResponse r = new ExamContentPromptBuilder().build(spec, new PromptRequest("DTZ", "B1", "LESEN", "TEIL_3", null, null, null, null), 2, 3, List.of());
        assertTrue(r.prompt().contains("Difficulty: A2_B1"));
        assertTrue(r.prompt().contains("a varied mix of different text types"));
        assertTrue(r.prompt().contains("about 100–160 words per text"));
        assertTrue(r.prompt().contains("Include concrete dates, times"));
        assertEquals("DTZ-B1-L3-003", r.firstExternalId());
    }

    @Test
    void customAndUniformMixesAreSupportedAndValidated() throws Exception {
        PromptRequest custom = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_3", 1, null, null, null, null, null, null, null, null, null, null, null, null, null,
                null, null, "CUSTOM", List.of("EMAIL", "PUBLIC_ANNOUNCEMENT", "INFORMATION_TEXT"), null, null, null);
        PromptResponse r = new ExamContentPromptBuilder().build(spec, custom, 0, 1);
        assertTrue(r.prompt().contains("Text 1 EMAIL, Text 2 PUBLIC_ANNOUNCEMENT, Text 3 INFORMATION_TEXT"));
        assertEquals("INFORMATION_TEXT", MAPPER.readTree(r.jsonExample()).get("texts").get(2).get("type").asText());
        PromptRequest notices = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_3", 1, null, null, null, null, null, null, null, null, null, null, null, null, null,
                null, null, "THREE_NOTICES", null, null, null, null);
        assertTrue(new ExamContentPromptBuilder().build(spec, notices, 0, 1).prompt().contains("three formal notices"));
        PromptRequest tooFew = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_3", 1, null, null, null, null, null, null, null, null, null, null, null, null, null,
                null, null, "CUSTOM", List.of("EMAIL"), null, null, null);
        assertThrows(IllegalArgumentException.class, () -> new ExamContentPromptBuilder().build(spec, tooFew, 0, 1));
        PromptRequest unknown = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_3", 1, null, null, null, null, null, null, null, null, null, null, null, null, null,
                null, null, "CUSTOM", List.of("EMAIL", "EMAIL", "TWEET"), null, null, null);
        assertThrows(IllegalArgumentException.class, () -> new ExamContentPromptBuilder().build(spec, unknown, 0, 1));
    }

    @Test
    void severalExercisesAskForABatchFileThatTheValidatorUnderstands() throws Exception {
        PromptRequest request = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_3", 3, "A2_B1", null, null);
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request, 0, 1);
        assertTrue(r.prompt().contains("Generate exactly 3 complete, clearly different exercises"));
        assertEquals("EXAM_EXERCISE_BATCH", MAPPER.readTree(r.jsonExample()).get("contentType").asText());
        ObjectNode batch = MAPPER.createObjectNode();
        batch.put("schemaVersion", "1.0");
        batch.put("contentType", "EXAM_EXERCISE_BATCH");
        batch.putArray("exercises").add(exercise()).add(exercise());
        var result = validator.validate(batch);
        assertEquals(2, result.exercises().size());
        assertTrue(result.exerciseIssues().values().stream().flatMap(List::stream).noneMatch(i -> "ERROR".equals(i.severity())));
        assertThrows(IllegalArgumentException.class, () -> new ExamContentPromptBuilder().build(spec,
                new PromptRequest("DTZ", "B1", "LESEN", "TEIL_3", 51, null, null, null), 0, 1));
    }

    @Test
    void unknownPromptSettingsAreRejected() {
        PromptRequest bad = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_3", 1, "A2", List.of("NOPE"), null);
        assertThrows(IllegalArgumentException.class, () -> new ExamContentPromptBuilder().build(spec, bad, 0, 1));
        PromptRequest badLength = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_3", 1, null, null, null, null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, "ENORMOUS", null, null);
        assertThrows(IllegalArgumentException.class, () -> new ExamContentPromptBuilder().build(spec, badLength, 0, 1));
    }
}
