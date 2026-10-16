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

/** DTZ A2-B1 Lesen Teil 2: five situations (26-30), eight advertisements (a-h), exactly one X. */
class ExamContentAdMatchingTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    /** The answer key of the valid exercise: four distinct advertisements and one X (question 28). */
    private static final List<String> KEY = List.of("b", "g", "X", "a", "d");

    private final ExamContentValidator validator = new ExamContentValidator();
    private final ExamContentSpec spec = ExamContentSpecs.find(ExamType.DTZ, LearningLevel.B1, ExamSection.LESEVERSTEHEN, 2).orElseThrow();

    private static final List<String> ADS = List.of(
            "Abendkurs Deutsch für den Beruf|Wir üben Bewerbungen schreiben und Telefongespräche führen.\n- Montag und Mittwoch, 18 bis 20 Uhr\n- Kosten: 80 Euro im Monat",
            "Aushilfe am Wochenende gesucht|Das Café am Marktplatz sucht freundliche Hilfe für Samstag und Sonntag. Sie bedienen Gäste und bereiten Getränke vor. Bezahlung 13 Euro pro Stunde.",
            "Yogakurs im Stadtpark|Jeden Dienstagmorgen treffen wir uns zum Yoga unter freiem Himmel. Bitte bringen Sie eine Matte mit. Die Teilnahme ist kostenlos.",
            "Fahrschule Schneider|Auto fahren lernen mit netten Lehrern. Theorieunterricht jeden Donnerstag, praktische Stunden nach Absprache. Anmeldung im Büro.",
            "Kinderbetreuung zu Hause|Studentin betreut Ihre Kinder zwischen 3 und 10 Jahren am Nachmittag. Erfahrung vorhanden, Referenzen auf Anfrage.",
            "Wohnung zu vermieten|Zwei Zimmer, Küche, Bad, 55 Quadratmeter. Ruhige Lage, Bushaltestelle in der Nähe. Miete 620 Euro warm.",
            "Hauptschulabschluss nachholen|Die Volkshochschule bietet einen Abendkurs für Erwachsene an. Unterricht an vier Abenden pro Woche, Start im September.",
            "Fahrradwerkstatt Müller|Wir reparieren alle Fahrräder schnell und günstig. Offen von Montag bis Freitag, 9 bis 17 Uhr.");
    private static final List<String> CATEGORIES = List.of("COURSES", "JOBS", "LEISURE", "SERVICES", "CHILDCARE", "HOUSING", "EDUCATION", "SERVICES");
    private static final List<String> SITUATIONS = List.of(
            "Sie arbeiten tagsüber und möchten nur am Wochenende etwas dazuverdienen.",
            "Sie haben keinen Schulabschluss und möchten ihn abends nachholen.",
            "Sie brauchen dringend jemanden, der Ihr Auto repariert.",
            "Sie möchten Ihr Deutsch für Bewerbungen verbessern und haben nur abends Zeit.",
            "Sie wollen den Führerschein machen und suchen eine Schule.");

    private static ObjectNode exercise() {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("exam", "DTZ");
        ex.put("section", "LESEN");
        ex.put("part", 2);
        ex.put("exerciseType", "ADVERTISEMENT_MATCHING");
        ex.put("skill", "ANZEIGEN_ZUORDNEN");
        ex.put("level", "A2_B1");
        ex.put("title", "Arbeit und Weiterbildung");
        ex.put("topic", "Arbeit und Bildung");
        ex.put("difficulty", "A2_B1");
        ex.putObject("instructions").put("de", spec().defaultInstructions());
        ArrayNode situations = ex.putArray("situations");
        for (int i = 0; i < 5; i++) situations.addObject().put("number", 26 + i).put("text", SITUATIONS.get(i));
        ArrayNode ads = ex.putArray("advertisements");
        for (int i = 0; i < 8; i++) {
            String[] parts = ADS.get(i).split("\\|", 2);
            ads.addObject().put("label", String.valueOf((char) ('a' + i))).put("title", parts[0]).put("body", parts[1]).put("category", CATEGORIES.get(i));
        }
        ex.putObject("example").put("enabled", false);
        ArrayNode key = ex.putArray("answerKey");
        for (int i = 0; i < 5; i++) {
            ObjectNode entry = key.addObject();
            entry.put("questionNumber", 26 + i);
            entry.put("correctAnswer", KEY.get(i));
            entry.putObject("explanation").put("de", "Erklärung " + (26 + i) + ": " + ("X".equals(KEY.get(i)) ? "keine Anzeige passt." : "Anzeige " + KEY.get(i) + " passt."));
        }
        ObjectNode meta = ex.putObject("metadata");
        meta.put("schemaVersion", 1);
        meta.put("source", "AI_IMPORTED");
        meta.putArray("tags").add("arbeit");
        return ex;
    }

    private static ExamContentSpec spec() {
        return ExamContentSpecs.find(ExamType.DTZ, LearningLevel.B1, ExamSection.LESEVERSTEHEN, 2).orElseThrow();
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

    @Test
    void validExerciseResolvesTheAdMatchingSpec() {
        var result = validator.validate(exercise());
        assertTrue(result.fileIssues().isEmpty(), result.fileIssues().toString());
        assertTrue(errors(result).isEmpty(), errors(result).toString());
        ParsedExercise parsed = result.exercises().get(0);
        assertTrue(parsed.spec().isAdMatching());
        assertEquals(5, parsed.situations().size());
        assertEquals(8, parsed.advertisements().size());
        assertEquals("DTZ-B1-L2-", spec.externalIdPrefix());
        assertTrue(warnings(result).contains("SEMANTIC_REVIEW_NEEDED"), "semantic uniqueness is never certified automatically");
    }

    @Test
    void fourOrSixSituationsAreRejected() {
        ObjectNode four = exercise();
        ((ArrayNode) four.get("situations")).remove(4);
        assertTrue(errorsOf(four).contains("SITUATION_COUNT"));
        ObjectNode six = exercise();
        ((ArrayNode) six.get("situations")).addObject().put("number", 31).put("text", "Noch eine Situation.");
        assertTrue(errorsOf(six).contains("SITUATION_COUNT"));
    }

    @Test
    void situationNumbersMustBeTwentySixToThirty() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("situations").get(0)).put("number", 21);
        assertTrue(errorsOf(ex).contains("SITUATION_NUMBERS"));
        ObjectNode duplicate = exercise();
        ((ObjectNode) duplicate.get("situations").get(1)).put("number", 26);
        assertTrue(errorsOf(duplicate).contains("SITUATION_NUMBER_DUPLICATE"));
    }

    @Test
    void sevenOrNineAdvertisementsAreRejected() {
        ObjectNode seven = exercise();
        ((ArrayNode) seven.get("advertisements")).remove(7);
        assertTrue(errorsOf(seven).contains("AD_COUNT"));
        ObjectNode nine = exercise();
        ((ArrayNode) nine.get("advertisements")).addObject().put("label", "i").put("title", "Neu").put("body", "Text");
        var codes = errorsOf(nine);
        assertTrue(codes.contains("AD_COUNT"), codes.toString());
    }

    @Test
    void duplicateOrWrongAdvertisementLabelsAreRejected() {
        ObjectNode duplicate = exercise();
        ((ObjectNode) duplicate.get("advertisements").get(7)).put("label", "a");
        assertTrue(errorsOf(duplicate).contains("AD_LABEL_DUPLICATE"));
        ObjectNode wrong = exercise();
        ((ObjectNode) wrong.get("advertisements").get(7)).put("label", "z");
        assertTrue(errorsOf(wrong).contains("AD_LABELS"));
    }

    @Test
    void advertisementsNeedTitleAndBody() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("advertisements").get(2)).remove("title");
        ((ObjectNode) ex.get("advertisements").get(3)).remove("body");
        var codes = errorsOf(ex);
        assertTrue(codes.contains("AD_TITLE_MISSING"));
        assertTrue(codes.contains("AD_BODY_MISSING"));
    }

    @Test
    void missingAnswerKeyEntriesAreRejected() {
        ObjectNode ex = exercise();
        ((ArrayNode) ex.get("answerKey")).remove(4);
        var codes = errorsOf(ex);
        assertTrue(codes.contains("ANSWER_KEY_COUNT"), codes.toString());
        ObjectNode none = exercise();
        none.remove("answerKey");
        assertTrue(errorsOf(none).contains("ANSWER_KEY_MISSING"));
    }

    @Test
    void answerKeyQuestionNumbersMustMatchTheSituations() {
        ObjectNode unknown = exercise();
        ((ObjectNode) unknown.get("answerKey").get(0)).put("questionNumber", 99);
        assertTrue(errorsOf(unknown).contains("ANSWER_NUMBER_UNKNOWN"));
        ObjectNode duplicate = exercise();
        ((ObjectNode) duplicate.get("answerKey").get(1)).put("questionNumber", 26);
        assertTrue(errorsOf(duplicate).contains("ANSWER_NUMBER_DUPLICATE"));
    }

    @Test
    void answerReferencingAMissingAdvertisementIsRejected() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("answerKey").get(0)).put("correctAnswer", "z");
        assertTrue(errorsOf(ex).contains("ANSWER_UNKNOWN_AD"));
    }

    @Test
    void zeroOrMultipleXAnswersAreRejected() {
        ObjectNode zero = exercise();
        ((ObjectNode) zero.get("answerKey").get(2)).put("correctAnswer", "c");
        assertTrue(errorsOf(zero).contains("NO_ANSWER_COUNT"));
        ObjectNode two = exercise();
        ((ObjectNode) two.get("answerKey").get(0)).put("correctAnswer", "X");
        assertTrue(errorsOf(two).contains("NO_ANSWER_COUNT"));
        ObjectNode lower = exercise();
        ((ObjectNode) lower.get("answerKey").get(2)).put("correctAnswer", "x");
        assertTrue(errorsOf(lower).isEmpty(), "x and X are the same answer");
    }

    @Test
    void repeatedAdvertisementAnswersAreRejected() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("answerKey").get(1)).put("correctAnswer", "b");
        var codes = errorsOf(ex);
        assertTrue(codes.contains("AD_REUSED"), codes.toString());
        assertTrue(codes.contains("AD_ANSWER_COUNT"), codes.toString());
    }

    @Test
    void germanExplanationIsRequiredAndOtherLanguagesAreIgnored() {
        ObjectNode missing = exercise();
        ((ObjectNode) missing.get("answerKey").get(0)).remove("explanation");
        assertTrue(errorsOf(missing).contains("EXPLANATION_MISSING"));
        ObjectNode extra = exercise();
        ((ObjectNode) extra.get("answerKey").get(0).get("explanation")).put("en", "English").put("fa", "فارسی");
        var result = validator.validate(extra);
        assertTrue(errors(result).isEmpty());
        assertEquals(java.util.Set.of("de"), result.exercises().get(0).situations().get(0).explanation().keySet());
    }

    @Test
    void wrongExerciseTypeAndMarkupAreErrors() {
        ObjectNode type = exercise();
        type.put("exerciseType", "DIRECTORY_MATCHING");
        assertTrue(errorsOf(type).contains("EXERCISE_TYPE_INVALID"));
        ObjectNode html = exercise();
        ((ObjectNode) html.get("situations").get(0)).put("text", "Sie lesen <b>fett</b>.");
        assertTrue(errorsOf(html).contains("HTML_CONTENT"));
    }

    @Test
    void exampleConfigurationIsValidated() {
        ObjectNode ex = exercise();
        ObjectNode example = (ObjectNode) ex.get("example");
        example.put("enabled", true);
        var codes = errorsOf(ex);
        assertTrue(codes.contains("EXAMPLE_SITUATION_EMPTY"));
        assertTrue(codes.contains("EXAMPLE_ANSWER"));
        assertTrue(codes.contains("EXAMPLE_EXPLANATION_MISSING"));
        example.put("situation", "Sie suchen eine Wohnung.").put("correctAnswer", "f");
        example.putObject("explanation").put("de", "Anzeige f passt.");
        var result = validator.validate(ex);
        assertTrue(errors(result).isEmpty(), errors(result).toString());
        assertEquals(5, result.exercises().get(0).situations().size(), "the example is not a scored situation");
        assertTrue(result.exercises().get(0).metadata().containsKey("example"));
    }

    @Test
    void semanticDoubtsAreOnlyWarnings() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("advertisements").get(4)).put("body", "Kurz.");
        ((ObjectNode) ex.get("answerKey").get(0)).putObject("explanation").put("de", "Anzeige e passt.");
        var result = validator.validate(ex);
        assertTrue(errors(result).isEmpty(), errors(result).toString());
        var warns = warnings(result);
        assertTrue(warns.contains("AD_TOO_SHORT"), warns.toString());
        assertTrue(warns.contains("EXPLANATION_CONTRADICTS"), warns.toString());
    }

    @Test
    void importedEntityStoresAdvertisementsAsPassagesAndSituationsAsQuestions() {
        ExamExercise entity = entity();
        assertEquals(ExamTaskType.SITUATION_MATCHING, entity.getTaskType());
        assertEquals(ExamType.DTZ, entity.getExamType());
        assertEquals(LearningLevel.B1, entity.getLevel());
        assertEquals(2, entity.getPartNumber());
        assertEquals(ExamContentStatus.DRAFT, entity.getStatus(), "imported content is never published automatically");
        assertFalse(entity.isPublished());
        assertEquals(8, entity.getPassages().size());
        assertEquals("a", entity.getPassages().get(0).getLabel());
        assertTrue(entity.getPassages().get(0).getContent().contains("Abendkurs Deutsch f&uuml;r den Beruf"));
        assertTrue(entity.getPassages().get(0).getContent().contains("Kosten: 80 Euro im Monat"));
        assertEquals(5, entity.getQuestions().size());
        assertEquals(26, entity.getQuestions().get(0).getQuestionNumber());
        assertEquals(entity.getPassages().get(1).getId(), entity.getQuestions().get(0).getCorrectAnswer());
        assertEquals("X", entity.getQuestions().get(2).getCorrectAnswer());
        assertEquals("Erklärung 26: Anzeige b passt.", entity.getQuestions().get(0).getExplanation());
        assertEquals("Arbeit und Bildung", entity.getMetadata().get("topic"));
        assertNull(ExamContentService.publishProblem(entity));
    }

    @Test
    void publishRequiresFiveSituationsEightAdvertisementsAndOneX() {
        ExamExercise fewer = entity();
        fewer.getQuestions().remove(0);
        assertNotNull(ExamContentService.publishProblem(fewer));
        ExamExercise noX = entity();
        noX.getQuestions().get(2).setCorrectAnswer(noX.getPassages().get(2).getId());
        assertNotNull(ExamContentService.publishProblem(noX));
        ExamExercise sevenAds = entity();
        sevenAds.getPassages().remove(7);
        assertNotNull(ExamContentService.publishProblem(sevenAds));
        ExamExercise reuse = entity();
        reuse.getQuestions().get(1).setCorrectAnswer(reuse.getQuestions().get(0).getCorrectAnswer());
        assertNotNull(ExamContentService.publishProblem(reuse));
    }

    @Test
    void learnerResponseNeverContainsTheAnswerKey() {
        ExamExercise entity = entity();
        entity.prePersist();
        var publicResponse = ExamExerciseMapper.mapToPublicResponse(entity);
        assertEquals(5, publicResponse.questions().size());
        assertEquals(8, publicResponse.passages().size());
        String json = assertDoesNotThrow(() -> MAPPER.writeValueAsString(publicResponse));
        assertFalse(json.contains("correctAnswer"));
        assertFalse(json.contains("Erklärung 26"), "explanations are only revealed after submitting");
    }

    @Test
    void previewCarriesTheAnswerKeyForTheAdmin() {
        ParsedExercise parsed = validator.validate(exercise()).exercises().get(0);
        var preview = ExamContentMapper.toPreview(parsed);
        assertEquals(5, preview.situations().size());
        assertEquals(8, preview.advertisements().size());
        assertEquals("b", preview.situations().get(0).correctAdvertisementId());
        assertEquals("x", preview.situations().get(2).correctAdvertisementId());
        assertEquals("Erklärung 26: Anzeige b passt.", preview.situations().get(0).explanation().get("de"));
        assertEquals("COURSES", preview.advertisements().get(0).type());
    }

    @Test
    void exportIsImportableAgain() {
        ObjectNode exported = ExamContentMapper.toExportNode(MAPPER, entity());
        assertNotNull(exported);
        assertEquals("ADVERTISEMENT_MATCHING", exported.get("exerciseType").asText());
        assertEquals("X", exported.get("answerKey").get(2).get("correctAnswer").asText());
        assertEquals("b", exported.get("answerKey").get(0).get("correctAnswer").asText());
        assertEquals("Aushilfe am Wochenende gesucht", exported.get("advertisements").get(1).get("title").asText());
        assertEquals("JOBS", exported.get("advertisements").get(1).get("category").asText());
        assertTrue(exported.get("advertisements").get(0).get("body").asText().contains("- Montag und Mittwoch"));
        var again = validator.validate(exported);
        assertTrue(errors(again).isEmpty(), errors(again).toString());
    }

    @Test
    void duplicateDetectionUsesTheAdvertisementTexts() {
        var first = validator.validate(exercise()).exercises().get(0);
        String hash = ExamContentFingerprint.hashTexts(first.textContents());
        var twin = validator.validate(exercise()).exercises().get(0);
        var matches = new ExamDuplicateDetector().detect(twin, ExamType.DTZ, hash,
                List.of(ExamDuplicateDetector.Candidate.of(first, ExamType.DTZ, hash)));
        assertFalse(matches.isEmpty());
    }

    @Test
    void promptReflectsTheSelectedSettingsAndItsExampleIsValidStructure() throws Exception {
        PromptRequest request = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_2", 1, "A2", List.of("WORK"), "Nur Berufe.", null, null, null, null, null,
                null, null, null, null, true, "NEW_SCENARIO", List.of("JOBS", "DRIVING_SCHOOL"));
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request, 0, 1);
        assertTrue(r.prompt().contains("Difficulty: A2"));
        assertTrue(r.prompt().contains("Work (jobs, part-time work, applications)"));
        assertTrue(r.prompt().contains("Advertisement categories: JOBS, DRIVING_SCHOOL"));
        assertTrue(r.prompt().contains("Example question: true"));
        assertTrue(r.prompt().contains("Lesen Sie die Situationen 26–30 und die Anzeigen a–h."));
        assertTrue(r.prompt().contains("Nur Berufe."));
        assertTrue(r.prompt().contains("German (`de`) only"), "explanations are requested in German only");
        assertFalse(r.prompt().contains("\"fa\""));
        assertFalse(r.prompt().contains("\"en\""));
        assertFalse(r.prompt().contains("{{"), "no unresolved placeholder");
        var example = MAPPER.readTree(r.jsonExample());
        assertEquals("ADVERTISEMENT_MATCHING", example.get("exerciseType").asText());
        assertEquals(5, example.get("situations").size());
        assertEquals(8, example.get("advertisements").size());
        assertEquals(5, example.get("answerKey").size());
        assertTrue(example.get("example").get("enabled").asBoolean());
        assertEquals("DTZ-B1-L2-001", r.firstExternalId());
    }

    @Test
    void promptWithoutExampleAsksForADisabledExampleAndDefaultsToNoExample() throws Exception {
        PromptRequest request = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_2", null, null, null, null);
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request, 2, 3, List.of());
        assertTrue(r.prompt().contains("Example question: false"));
        assertTrue(r.prompt().contains("\"example\": {\"enabled\": false}"));
        assertFalse(MAPPER.readTree(r.jsonExample()).get("example").get("enabled").asBoolean());
        assertTrue(r.prompt().contains("Difficulty: A2_B1"));
    }

    @Test
    void severalExercisesAskForABatchFileThatTheValidatorUnderstands() throws Exception {
        PromptRequest request = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_2", 3, "A2_B1", null, null);
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request, 0, 1);
        assertTrue(r.prompt().contains("Generate exactly 3 complete, clearly different exercises"));
        assertTrue(r.prompt().contains("EXAM_EXERCISE_BATCH"));
        var root = MAPPER.readTree(r.jsonExample());
        assertEquals("EXAM_EXERCISE_BATCH", root.get("contentType").asText());
        ObjectNode batch = MAPPER.createObjectNode();
        batch.put("schemaVersion", "1.0");
        batch.put("contentType", "EXAM_EXERCISE_BATCH");
        batch.putArray("exercises").add(exercise()).add(exercise());
        var result = validator.validate(batch);
        assertEquals(2, result.exercises().size());
        assertTrue(result.exerciseIssues().values().stream().flatMap(List::stream).noneMatch(i -> "ERROR".equals(i.severity())));
        assertThrows(IllegalArgumentException.class, () -> new ExamContentPromptBuilder().build(spec,
                new PromptRequest("DTZ", "B1", "LESEN", "TEIL_2", 51, null, null, null), 0, 1));
    }

    @Test
    void unknownPromptSettingsAreRejected() {
        PromptRequest bad = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_2", 1, "C2", List.of("NOPE"), null);
        assertThrows(IllegalArgumentException.class, () -> new ExamContentPromptBuilder().build(spec, bad, 0, 1));
        PromptRequest badCategory = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_2", 1, "A2", null, null, null, null, null, null, null,
                null, null, null, null, null, null, List.of("NOPE"));
        assertThrows(IllegalArgumentException.class, () -> new ExamContentPromptBuilder().build(spec, badCategory, 0, 1));
    }
}
