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
import com.deutschbridge.backend.service.DtzLetterGapValidator;
import com.deutschbridge.backend.util.ExamExerciseMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** DTZ A2-B1 Lesen Teil 5: one letter / email with six gaps {{40}}..{{45}} and three options per gap. */
class ExamContentLetterGapTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final ExamContentValidator validator = new ExamContentValidator();
    private final ExamContentSpec spec = ExamContentSpecs.find(ExamType.DTZ, LearningLevel.B1, ExamSection.LESEVERSTEHEN, 5).orElseThrow();

    private static final String BODY = "Sehr geehrte Damen und Herren,\n\n"
            + "ich habe vom 3. bis zum 10. Mai {{40}} Zimmer in Ihrem Hotel gewohnt. Leider war ich mit meinem Aufenthalt nicht zufrieden, "
            + "{{41}} das Zimmer war sehr laut und schmutzig. Ich habe schon am ersten Tag an der Rezeption {{42}} gesprochen, "
            + "aber niemand hat mir geholfen. Außerdem {{43}} das Frühstück jeden Morgen kalt. "
            + "Deshalb möchte ich Sie bitten, mir einen Teil des Geldes {{44}} zu überweisen. "
            + "Ich warte {{45}} Ihre Antwort und danke Ihnen im Voraus.\n\n"
            + "Mit freundlichen Grüßen\nAnna Weber";
    private static final String[][] OPTIONS = {
            {"mein", "meinem", "meinen"}, {"denn", "dass", "obwohl"}, {"mit", "bei", "für"},
            {"war", "ist", "wurde"}, {"zurück", "vorher", "danach"}, {"auf", "an", "über"}};
    private static final String[] KEY = {"b", "a", "a", "a", "a", "a"};
    private static final String[] CATEGORIES = {"POSSESSIVARTIKEL", "KONJUNKTION", "PRAEPOSITION", "VERBFORM", "ADVERBIEN_KONNEKTOREN", "VERB_PRAEPOSITION"};

    private static ExamContentSpec spec5() {
        return ExamContentSpecs.find(ExamType.DTZ, LearningLevel.B1, ExamSection.LESEVERSTEHEN, 5).orElseThrow();
    }

    private static ObjectNode option(String key, String text) {
        return MAPPER.createObjectNode().put("key", key).put("text", text);
    }

    private static ObjectNode example() {
        ObjectNode e = MAPPER.createObjectNode();
        e.put("number", 0);
        e.put("textBeforeGap", "Sehr ");
        e.put("textAfterGap", " Damen und Herren,");
        ArrayNode options = e.putArray("options");
        options.add(option("a", "geehrte")).add(option("b", "geehrten")).add(option("c", "geehrter"));
        e.put("correctAnswer", "a");
        e.putObject("explanation").put("de", "Formale Anrede.").put("en", "Formal salutation.").put("fa", "خطاب رسمی.");
        return e;
    }

    private static ObjectNode exercise() {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("exam", "DTZ");
        ex.put("section", "LESEN");
        ex.put("part", 5);
        ex.put("exerciseType", "LETTER_GAP_FILL");
        ex.put("level", "A2_B1");
        ex.put("title", "Eine Beschwerde an ein Hotel");
        ex.put("topic", "Reisen und Unterkunft");
        ex.put("difficulty", "A2_B1");
        ex.putObject("instructions").put("de", spec5().defaultInstructions());
        ex.set("example", example());
        ObjectNode text = ex.putObject("text");
        text.put("type", "COMPLAINT");
        text.putNull("sender");
        text.put("recipient", "Hotel Zum Löwen");
        text.put("date", "23.05.20XX");
        text.put("subject", "Beschwerde");
        text.put("body", BODY);
        ArrayNode questions = ex.putArray("questions");
        for (int i = 0; i < 6; i++) {
            ObjectNode q = questions.addObject();
            q.put("number", 40 + i);
            q.put("type", "MULTIPLE_CHOICE");
            ArrayNode options = q.putArray("options");
            for (int j = 0; j < 3; j++) options.add(option(String.valueOf((char) ('a' + j)), OPTIONS[i][j]));
            q.put("correctAnswer", KEY[i]);
            q.put("grammarCategory", CATEGORIES[i]);
            q.put("grammarFocus", "Focus " + (i + 1));
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
    void validExerciseIsAcceptedAndResolvesTheTeil5Spec() {
        var result = validator.validate(exercise());
        assertTrue(result.fileIssues().isEmpty(), result.fileIssues().toString());
        assertTrue(errors(result).isEmpty(), errors(result).toString());
        ParsedExercise parsed = result.exercises().get(0);
        assertTrue(parsed.spec().isLetterGap());
        assertEquals(6, parsed.questions().size());
        assertEquals(List.of(40, 41, 42, 43, 44, 45), parsed.questions().stream().map(ParsedExercise.Question::number).toList());
        assertNotNull(parsed.letter().example(), "the example is kept apart from the scored questions");
        assertTrue(warnings(result).contains("SEMANTIC_REVIEW_NEEDED"), "semantic correctness is never certified automatically");
    }

    @Test
    void exampleIsOptional() {
        ObjectNode none = exercise();
        none.putNull("example");
        assertEquals(List.of(), errorsOf(none));
        ObjectNode absent = exercise();
        absent.remove("example");
        assertEquals(List.of(), errorsOf(absent));
    }

    @Test
    void invalidJsonSyntaxIsRejectedByTheParser() {
        assertThrows(Exception.class, () -> MAPPER.readTree("{ \"exam\": \"DTZ\", "));
    }

    @Test
    void missingGapMarkerIsRejected() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("text")).put("body", BODY.replace("{{43}}", "war"));
        assertTrue(errorsOf(ex).contains("GAP_MARKER_MISSING"));
    }

    @Test
    void duplicateGapMarkerIsRejected() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("text")).put("body", BODY.replace("{{43}}", "{{42}}"));
        assertTrue(errorsOf(ex).contains("GAP_MARKER_DUPLICATE"));
    }

    @Test
    void unexpectedGapMarkersAreRejectedIncludingTheExampleNumber() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("text")).put("body", BODY.replace("{{45}}", "{{45}} {{46}}"));
        assertTrue(errorsOf(ex).contains("GAP_MARKER_UNEXPECTED"));
        ObjectNode zero = exercise();
        ((ObjectNode) zero.get("text")).put("body", BODY.replace("Sehr geehrte", "Sehr {{0}}"));
        assertTrue(errorsOf(zero).contains("GAP_MARKER_UNEXPECTED"), "the example gap is not part of the body");
    }

    @Test
    void gapMarkersMustAscend() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("text")).put("body", BODY.replace("{{41}}", "@@").replace("{{40}}", "{{41}}").replace("@@", "{{40}}"));
        assertTrue(errorsOf(ex).contains("GAP_MARKER_ORDER"));
    }

    @Test
    void emptyBodyIsRejected() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("text")).put("body", "  ");
        assertTrue(errorsOf(ex).contains("TEXT_BODY_MISSING"));
        ObjectNode none = exercise();
        none.remove("text");
        assertTrue(errorsOf(none).contains("TEXT_MISSING"));
    }

    @Test
    void wrongQuestionCountOrNumberingIsRejected() {
        ObjectNode five = exercise();
        ((ArrayNode) five.get("questions")).remove(5);
        assertTrue(errorsOf(five).contains("QUESTION_COUNT"));
        ObjectNode seven = exercise();
        ((ArrayNode) seven.get("questions")).add(((ArrayNode) seven.get("questions")).get(0).deepCopy());
        assertTrue(errorsOf(seven).contains("QUESTION_COUNT"));
        ObjectNode numbering = exercise();
        ((ObjectNode) numbering.get("questions").get(0)).put("number", 41);
        assertTrue(errorsOf(numbering).contains("QUESTION_NUMBERS"));
        ObjectNode missing = exercise();
        ((ObjectNode) missing.get("questions").get(2)).remove("number");
        assertTrue(errorsOf(missing).contains("QUESTION_NUMBER_MISSING"));
        ObjectNode none = exercise();
        none.remove("questions");
        assertTrue(errorsOf(none).contains("QUESTIONS_MISSING"));
    }

    @Test
    void everyQuestionMustBeMultipleChoice() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("questions").get(1)).put("type", "TRUE_FALSE");
        assertTrue(errorsOf(ex).contains("QUESTION_TYPE_INVALID"));
    }

    @Test
    void exactlyThreeOptionsAreRequired() {
        ObjectNode two = exercise();
        ((ArrayNode) two.get("questions").get(0).get("options")).remove(2);
        assertTrue(errorsOf(two).contains("OPTION_COUNT"));
        ObjectNode four = exercise();
        ((ArrayNode) four.get("questions").get(0).get("options")).add(option("d", "unser"));
        assertTrue(errorsOf(four).contains("OPTION_COUNT"));
        ObjectNode none = exercise();
        ((ObjectNode) none.get("questions").get(0)).remove("options");
        assertTrue(errorsOf(none).contains("OPTIONS_MISSING"));
    }

    @Test
    void optionKeysMustBeUniqueAndExactlyAbc() {
        ObjectNode dup = exercise();
        ((ObjectNode) dup.get("questions").get(0).get("options").get(1)).put("key", "a");
        assertTrue(errorsOf(dup).contains("OPTION_ID_DUPLICATE"));
        ObjectNode invalid = exercise();
        ((ObjectNode) invalid.get("questions").get(0).get("options").get(2)).put("key", "x");
        assertTrue(errorsOf(invalid).contains("OPTION_IDS"));
        ObjectNode missing = exercise();
        ((ObjectNode) missing.get("questions").get(0).get("options").get(0)).remove("key");
        assertTrue(errorsOf(missing).contains("OPTION_ID_MISSING"));
    }

    @Test
    void optionsThatOnlyDifferInPunctuationOrCaseCountAsTheSame() {
        ObjectNode ex = exercise();
        ((ObjectNode) ex.get("questions").get(0).get("options").get(1)).put("text", "Mein.");
        ((ObjectNode) ex.get("questions").get(0).get("options").get(0)).put("text", "mein");
        assertTrue(errorsOf(ex).contains("OPTION_TEXT_DUPLICATE"));
    }

    @Test
    void correctAnswerMustMatchAnOptionKey() {
        ObjectNode unknown = exercise();
        ((ObjectNode) unknown.get("questions").get(0)).put("correctAnswer", "d");
        assertTrue(errorsOf(unknown).contains("CORRECT_OPTION_UNKNOWN"));
        ObjectNode missing = exercise();
        ((ObjectNode) missing.get("questions").get(0)).remove("correctAnswer");
        assertTrue(errorsOf(missing).contains("CORRECT_OPTION_MISSING"));
        ObjectNode upper = exercise();
        ((ObjectNode) upper.get("questions").get(0)).put("correctAnswer", "B");
        assertEquals(List.of(), errorsOf(upper), "case is normalised");
    }

    @Test
    void explanationsInAllThreeLanguagesAreRequired() {
        for (String lang : List.of("de", "en", "fa")) {
            ObjectNode ex = exercise();
            ((ObjectNode) ex.get("questions").get(3).get("explanation")).remove(lang);
            assertTrue(errorsOf(ex).contains("EXPLANATION_MISSING"), lang);
        }
        ObjectNode none = exercise();
        ((ObjectNode) none.get("questions").get(0)).remove("explanation");
        assertTrue(errorsOf(none).contains("EXPLANATION_MISSING"));
    }

    @Test
    void malformedExampleIsRejected() {
        ObjectNode wrongNumber = exercise();
        ((ObjectNode) wrongNumber.get("example")).put("number", 40);
        assertTrue(errorsOf(wrongNumber).contains("EXAMPLE_NUMBER"));
        ObjectNode twoOptions = exercise();
        ((ArrayNode) twoOptions.get("example").get("options")).remove(2);
        assertTrue(errorsOf(twoOptions).contains("EXAMPLE_OPTIONS"));
        ObjectNode badAnswer = exercise();
        ((ObjectNode) badAnswer.get("example")).put("correctAnswer", "z");
        assertTrue(errorsOf(badAnswer).contains("EXAMPLE_ANSWER"));
        ObjectNode noText = exercise();
        ((ObjectNode) noText.get("example")).put("textBeforeGap", "").put("textAfterGap", "");
        assertTrue(errorsOf(noText).contains("EXAMPLE_TEXT_MISSING"));
        ObjectNode notObject = exercise();
        notObject.put("example", "Sehr geehrte");
        assertTrue(errorsOf(notObject).contains("EXAMPLE_NOT_OBJECT"));
    }

    @Test
    void placeholdersMarkupWrongExerciseTypeAndMissingMetadataAreErrors() {
        ObjectNode placeholder = exercise();
        ((ObjectNode) placeholder.get("questions").get(0).get("options").get(0)).put("text", "...");
        assertTrue(errorsOf(placeholder).contains("PLACEHOLDER_CONTENT"));
        ObjectNode html = exercise();
        ((ObjectNode) html.get("text")).put("body", BODY + " <script>x</script>");
        assertTrue(errorsOf(html).contains("HTML_CONTENT"));
        ObjectNode type = exercise();
        type.put("exerciseType", "TEXT_TRUE_FALSE");
        assertTrue(errorsOf(type).contains("EXERCISE_TYPE_INVALID"));
        ObjectNode metadata = exercise();
        metadata.remove("metadata");
        assertTrue(errorsOf(metadata).contains("METADATA_REQUIRED"));
    }

    @Test
    void semanticDoubtsAreOnlyWarnings() {
        ObjectNode ex = exercise();
        ArrayNode questions = (ArrayNode) ex.get("questions");
        for (int i = 0; i < 6; i++) {
            ((ObjectNode) questions.get(i)).put("correctAnswer", "a");
            ((ObjectNode) questions.get(i)).put("grammarCategory", "PRAEPOSITION");
        }
        ((ObjectNode) ex.get("text")).put("body", BODY.replace("Sehr geehrte Damen und Herren", "Hallo Anna").replace("Ihnen", "dir"));
        var result = validator.validate(ex);
        assertTrue(errors(result).isEmpty(), errors(result).toString());
        List<String> warnings = warnings(result);
        assertTrue(warnings.contains("ANSWER_SEQUENCE_PREDICTABLE"), warnings.toString());
        assertTrue(warnings.contains("CATEGORY_DOMINATES"), warnings.toString());
    }

    @Test
    void lowerCaseOnlyOptionsAreNotMistakenForCapitals() {
        assertFalse(warnings(validator.validate(exercise())).contains("OPTIONS_UPPERCASE"));
        ObjectNode ex = exercise();
        for (var q : ex.get("questions")) {
            for (var o : q.get("options")) ((ObjectNode) o).put("text", o.get("text").asText().toUpperCase());
        }
        assertTrue(warnings(validator.validate(ex)).contains("OPTIONS_UPPERCASE"));
    }

    // ------------------------------------------------------------------ storage, publication, learner

    @Test
    void importedEntityStoresTheLetterAsPassageAndTheGapsAsQuestions() {
        ExamExercise e = entity();
        assertEquals(ExamTaskType.LETTER_GAP_FILL, e.getTaskType());
        assertEquals(ExamSection.LESEVERSTEHEN, e.getSection());
        assertEquals(LearningLevel.B1, e.getLevel());
        assertEquals(5, e.getPartNumber());
        assertEquals(ExamContentStatus.DRAFT, e.getStatus(), "imports default to DRAFT");
        assertEquals(2, e.getPassages().size(), "example + letter");
        assertEquals(ExamContentMapper.EXAMPLE_LABEL, e.getPassages().get(0).getLabel());
        assertTrue(e.getPassages().get(1).getContent().contains("data-exam-gap=\"40\""));
        assertTrue(e.getPassages().get(1).getContent().contains("Betreff: <strong>Beschwerde</strong>"));
        assertFalse(e.getPassages().get(0).getContent().contains("data-exam-gap"), "the example is not a scored gap");
        assertEquals(6, e.getQuestions().size(), "the example is not a question");
        assertEquals(40, e.getQuestions().get(0).getQuestionNumber());
        assertEquals(40, e.getQuestions().get(0).getGapNumber());
        assertEquals(ExamTaskType.MULTIPLE_CHOICE, e.getQuestions().get(0).getTaskType());
        assertEquals("meinem", e.getQuestions().get(0).getCorrectAnswer());
        assertEquals(1, e.getQuestions().get(0).getSectionIndex(), "the gaps belong to the letter passage");
        assertEquals("Erklärung 2", e.getQuestions().get(1).getExplanation());
    }

    @Test
    void withoutAnExampleTheLetterIsTheOnlyPassage() {
        ObjectNode ex = exercise();
        ex.putNull("example");
        ExamExercise e = ExamContentMapper.toEntity(validator.validate(ex).exercises().get(0), ExamType.DTZ, "1.0", "1.0", "hash", "user");
        assertEquals(1, e.getPassages().size());
        assertEquals(0, e.getQuestions().get(0).getSectionIndex());
        assertNull(ExamContentService.publishProblem(e));
    }

    @Test
    void publishRequiresOneLetterAndSixWellFormedGaps() {
        assertNull(ExamContentService.publishProblem(entity()));
        ExamExercise fewer = entity();
        fewer.getQuestions().remove(5);
        assertNotNull(ExamContentService.publishProblem(fewer));
        ExamExercise badAnswer = entity();
        badAnswer.getQuestions().get(0).setCorrectAnswer("zwei");
        assertNotNull(ExamContentService.publishProblem(badAnswer));
        ExamExercise badNumber = entity();
        badNumber.getQuestions().get(1).setQuestionNumber(50);
        assertNotNull(ExamContentService.publishProblem(badNumber));
        ExamExercise twoOptions = entity();
        twoOptions.getQuestions().get(2).setOptions(List.of("mit", "bei"));
        assertNotNull(ExamContentService.publishProblem(twoOptions));
        ExamExercise missingGap = entity();
        missingGap.getPassages().get(1).setContent(missingGap.getPassages().get(1).getContent().replace("data-exam-gap=\"43\"", "data-x=\"43\""));
        assertNotNull(DtzLetterGapValidator.check(missingGap.getPassages(), missingGap.getQuestions()));
    }

    @Test
    void learnerResponseNeverContainsTheAnswerKeyOrExplanations() {
        ExamExercise entity = entity();
        entity.prePersist();
        var publicResponse = ExamExerciseMapper.mapToPublicResponse(entity);
        assertEquals(6, publicResponse.questions().size());
        String json = assertDoesNotThrow(() -> MAPPER.writeValueAsString(publicResponse));
        assertFalse(json.contains("correctAnswer"));
        assertFalse(json.contains("Erklärung 1"), "explanations are only revealed after submitting");
        assertFalse(json.contains("Explanation 1"));
        assertFalse(json.contains("توضیح 1"));
        assertTrue(json.contains("meinem"), "the options themselves are shown");
    }

    @Test
    void previewCarriesTheLetterTheExampleAndTheAnswerKeyForTheAdmin() {
        ParsedExercise parsed = validator.validate(exercise()).exercises().get(0);
        var preview = ExamContentMapper.toPreview(parsed);
        var view = preview.letter();
        assertNotNull(view);
        assertEquals("COMPLAINT", view.type());
        assertEquals("Hotel Zum Löwen", view.recipient());
        assertEquals(BODY, view.body());
        assertEquals(0, view.example().options().size() - 3);
        assertEquals("a", view.example().correctOptionId());
        assertEquals(6, view.gaps().size());
        assertEquals("POSSESSIVARTIKEL", view.gaps().get(0).grammarCategory());
        assertEquals("Explanation 2", view.gaps().get(1).explanation().get("en"));
        assertEquals("توضیح 3", view.gaps().get(2).explanation().get("fa"));
        assertEquals(6, preview.questions().size());
        assertTrue(preview.readingText().contains("[40]"));
    }

    @Test
    void exportIsImportableAgain() {
        ObjectNode exported = ExamContentMapper.toExportNode(MAPPER, entity());
        assertNotNull(exported);
        assertEquals("LETTER_GAP_FILL", exported.get("exerciseType").asText());
        assertEquals(5, exported.get("part").asInt());
        assertEquals("COMPLAINT", exported.get("text").get("type").asText());
        assertEquals(BODY, exported.get("text").get("body").asText());
        assertEquals(6, exported.get("questions").size());
        assertEquals("b", exported.get("questions").get(0).get("correctAnswer").asText());
        assertEquals("Explanation 3", exported.get("questions").get(2).get("explanation").get("en").asText());
        assertEquals(0, exported.get("example").get("number").asInt());
        var again = validator.validate(exported);
        assertTrue(again.fileIssues().isEmpty(), again.fileIssues().toString());
        assertTrue(errors(again).isEmpty(), errors(again).toString());
    }

    @Test
    void duplicateDetectionUsesTheLetterBody() {
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
        PromptRequest request = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_5", 1, "B1", List.of("TRAVEL_ACCOMMODATION"), "Nur Alltagssituationen.", null, "COMPLAINT",
                List.of("CONNECTORS"), null, null, null, null, "FORMAL", null, true, "NEW_SCENARIO");
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request, 0, 1);
        assertTrue(r.prompt().contains("Difficulty: B1"));
        assertTrue(r.prompt().contains("Topic: Travel and accommodation"));
        assertTrue(r.prompt().contains("Text type: COMPLAINT (a complaint)"));
        assertTrue(r.prompt().contains("Grammar focus: connectors and conjunctions"));
        assertTrue(r.prompt().contains("Include example gap: true"));
        assertTrue(r.prompt().contains("Register: formal"));
        assertTrue(r.prompt().contains("Nur Alltagssituationen."));
        assertTrue(r.prompt().contains(ExamContentSpecs.LETTER_INSTRUCTIONS));
        assertTrue(r.prompt().contains("{{40}}  {{41}}  {{42}}  {{43}}  {{44}}  {{45}}"));
        assertFalse(r.prompt().matches("(?s).*\\{\\{[A-Z_]+}}.*"), "no unresolved placeholder");
        var example = MAPPER.readTree(r.jsonExample());
        assertEquals("LETTER_GAP_FILL", example.get("exerciseType").asText());
        assertEquals(5, example.get("part").asInt());
        assertEquals(6, example.get("questions").size());
        assertEquals(45, example.get("questions").get(5).get("number").asInt());
        assertTrue(example.get("text").get("body").asText().contains("{{45}}"));
        assertEquals(0, example.get("example").get("number").asInt());
        assertEquals("DTZ-B1-L5-001", r.firstExternalId());
    }

    @Test
    void disabledExampleIsOmittedAndDefaultsAreRandom() throws Exception {
        PromptRequest off = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_5", 1, null, null, null, null, null, null,
                null, null, null, null, null, null, false, null);
        PromptResponse r = new ExamContentPromptBuilder().build(spec, off, 0, 1);
        assertTrue(r.prompt().contains("Include example gap: false"));
        assertTrue(r.prompt().contains("\"example\": null"));
        assertTrue(r.prompt().contains("Difficulty: A2_B1"));
        assertTrue(r.prompt().contains("any suitable everyday topic"));
        assertTrue(MAPPER.readTree(r.jsonExample()).get("example").isNull());
    }

    @Test
    void severalTopicsAndSeveralExercisesAskForABatchFileThatTheValidatorUnderstands() throws Exception {
        PromptRequest request = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_5", 3, null, List.of("HOUSING", "TRAVEL_ACCOMMODATION"), null, null, null, null,
                null, null, null, null, null, null, true, null);
        PromptResponse r = new ExamContentPromptBuilder().build(spec, request, 0, 1);
        assertTrue(r.prompt().contains("Generate exactly 3 complete, clearly different exercises"));
        assertTrue(r.prompt().contains("Topic: Housing; Travel and accommodation"));
        assertTrue(r.prompt().contains("EXAM_EXERCISE_BATCH"));
        var root = MAPPER.readTree(r.jsonExample());
        assertEquals("EXAM_EXERCISE_BATCH", root.get("contentType").asText());
        assertEquals("TEIL_5", root.get("part").asText());
        assertEquals(6, root.get("exercises").get(0).get("questions").size());
        ObjectNode file = (ObjectNode) root;
        ((ArrayNode) file.get("exercises")).removeAll();
        ((ArrayNode) file.get("exercises")).add(exercise());
        ((ArrayNode) file.get("exercises")).add(exercise().put("title", "Zweite Beschwerde"));
        ((ObjectNode) file.get("exercises").get(1).get("text")).put("body", BODY + " Noch etwas anderes.");
        var result = validator.validate(file);
        assertTrue(result.fileIssues().isEmpty(), result.fileIssues().toString());
        assertEquals(2, result.exercises().size());
        assertThrows(IllegalArgumentException.class, () -> new ExamContentPromptBuilder().build(spec, new PromptRequest("DTZ", "B1", "LESEN", "TEIL_5", 51,
                null, null, null, null, null, null, null, null, null, null, null, null, null, null), 0, 1));
    }

    @Test
    void unknownPromptSettingsAreRejected() {
        PromptRequest bad = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_5", 1, "C2", null, null, null, null, null,
                null, null, null, null, null, null, null, null);
        assertThrows(IllegalArgumentException.class, () -> new ExamContentPromptBuilder().build(spec, bad, 0, 1));
    }

    @Test
    void customTopicsTypedByTheAdminAreUsedAsWritten() {
        PromptRequest request = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_5", 1, null, List.of("HOUSING", "Umzug in eine neue Stadt", "  \"Bad\" {{x}}\n topic "), null, null, null, null,
                null, null, null, null, null, null, null, null);
        String prompt = new ExamContentPromptBuilder().build(spec, request, 0, 1).prompt();
        assertTrue(prompt.contains("Topic: Housing; Umzug in eine neue Stadt; Bad x topic"), prompt);
        PromptRequest tooLong = new PromptRequest("DTZ", "B1", "LESEN", "TEIL_5", 1, null, List.of("x".repeat(61)), null, null, null, null,
                null, null, null, null, null, null, null, null);
        assertThrows(IllegalArgumentException.class, () -> new ExamContentPromptBuilder().build(spec, tooLong, 0, 1));
    }
}
