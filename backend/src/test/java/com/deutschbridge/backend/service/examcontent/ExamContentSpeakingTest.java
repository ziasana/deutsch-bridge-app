package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.model.dto.ExamExercisePublicResponse;
import com.deutschbridge.backend.model.dto.ExamContentDtos.PromptRequest;
import com.deutschbridge.backend.model.dto.ExamContentDtos.PromptResponse;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.enums.ExamContentStatus;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.util.ExamExerciseMapper;
import com.deutschbridge.backend.util.ExamTeilResolver;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** TELC B1 Mündlicher Ausdruck (Teil 1 topic interview, Teil 2 opinion discussion, Teil 3 joint planning): German-only learning content. */
class ExamContentSpeakingTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String SAMPLES = "exam-content/samples/muendlicher-ausdruck-teil%d-start.json";

    private final ExamContentValidator validator = new ExamContentValidator();

    private static ExamContentSpec spec(int part) {
        return ExamContentSpecs.find(ExamType.TELC, LearningLevel.B1, ExamSection.MUENDLICHER_AUSDRUCK, part).orElseThrow();
    }

    /** The shipped starter file of a part - the same file an admin uploads. */
    private static ObjectNode sample(int part) throws IOException {
        return (ObjectNode) MAPPER.readTree(new ClassPathResource(SAMPLES.formatted(part)).getContentAsString(StandardCharsets.UTF_8));
    }

    private static ObjectNode first(ObjectNode file) {
        return (ObjectNode) file.get("exercises").get(0);
    }

    private static List<String> codes(ExamContentValidator.FileResult r, String severity) {
        return r.exerciseIssues().get(0).stream().filter(i -> severity.equals(i.severity())).map(i -> i.code()).toList();
    }

    private List<String> errors(ObjectNode file) {
        return codes(validator.validate(file), "ERROR");
    }

    // ------------------------------------------------------------------ the supplied first exercises

    @Test
    void starterExercisesOfAllThreePartsAreValid() throws IOException {
        for (int part = 1; part <= 3; part++) {
            var result = validator.validate(sample(part));
            assertTrue(result.fileIssues().isEmpty(), "part " + part);
            assertTrue(codes(result, "ERROR").isEmpty(), "part " + part + ": " + codes(result, "ERROR"));
            assertTrue(codes(result, "WARNING").isEmpty(), "part " + part + ": " + codes(result, "WARNING"));
            ParsedExercise parsed = result.exercises().get(0);
            assertTrue(parsed.spec().isSpeaking());
            assertEquals(spec(part).taskType().name(), parsed.speaking().taskType());
        }
        assertEquals("B1-M1-", spec(1).externalIdPrefix());
    }

    @Test
    void gruppenreisenKeepsPersonAndGoals() throws IOException {
        ParsedExercise parsed = validator.validate(sample(2)).exercises().get(0);
        @SuppressWarnings("unchecked")
        Map<String, Object> person = (Map<String, Object>) parsed.speaking().data().get("person");
        assertEquals("Sabine Klostermann", person.get("name"));
        assertEquals(33, person.get("age"));
        assertEquals("Bürokauffrau", person.get("occupation"));
        assertEquals("Gruppenreisen", parsed.speaking().topic());
        assertFalse(parsed.speaking().data().containsKey("communicationGoals"), "the goals live in the Lernbereich");
    }

    @Test
    void abschiedspartyKeepsThePlanningPoints() throws IOException {
        ParsedExercise parsed = validator.validate(sample(3)).exercises().get(0);
        List<?> points = (List<?>) parsed.speaking().data().get("planningPoints");
        assertEquals(List.of("Wann?", "Wo?", "Essen", "Getränke", "Wer bezahlt wofür?"),
                points.stream().limit(5).map(p -> ((Map<?, ?>) p).get("title")).toList());
        assertEquals(2, ((List<?>) parsed.speaking().data().get("extraPhrases")).size());
        assertFalse(parsed.speaking().data().containsKey("phraseGroups"), "the phrases live in the Lernbereich");
        assertTrue(String.valueOf(parsed.speaking().data().get("scenario")).contains("Abschiedsparty"));
    }

    @Test
    void germanUmlautsAndEszettSurviveValidationAndStorage() throws IOException {
        ObjectNode file = sample(3);
        first(file).put("scenario", "Wir feiern für Müller, Jörg und Zoë – größer, schöner, süß: ä ö ü Ä Ö Ü ß.");
        ParsedExercise parsed = validator.validate(file).exercises().get(0);
        assertEquals("Wir feiern für Müller, Jörg und Zoë – größer, schöner, süß: ä ö ü Ä Ö Ü ß.", parsed.speaking().data().get("scenario"));
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.TELC, "1.0", "1.0", "h", "u");
        assertTrue(ExamContentMapper.toPlainText(entity.getPassages().get(0).getContent()).contains("Wir feiern für Müller"));
        assertEquals("Wir feiern für Müller, Jörg und Zoë – größer, schöner, süß: ä ö ü Ä Ö Ü ß.",
                ((Map<?, ?>) entity.getMetadata().get("speaking")).get("scenario"));
    }

    // ------------------------------------------------------------------ file level

    @Test
    void shouldRejectUnsupportedPartAndUnknownSection() throws IOException {
        ObjectNode file = sample(1);
        file.put("part", "TEIL_4");
        var result = validator.validate(file);
        assertTrue(codes(result, "ERROR").contains("SPEC_UNSUPPORTED"), codes(result, "ERROR").toString());

        ObjectNode other = sample(1);
        other.put("section", "SPRECHEN_X");
        assertTrue(codes(validator.validate(other), "ERROR").contains("SECTION_INVALID"));
    }

    @Test
    void sectionAcceptsTheDocumentedTokens() throws IOException {
        for (String token : List.of("MUENDLICHER_AUSDRUCK", "SPRECHEN", "MÜNDLICHER_AUSDRUCK")) {
            ObjectNode file = sample(1);
            file.put("section", token);
            assertTrue(errors(file).isEmpty(), token);
        }
    }

    @Test
    void shouldRejectUnsupportedTaskTypeAndOneFromAnotherPart() throws IOException {
        ObjectNode file = sample(1);
        first(file).put("taskType", "ESSAY");
        assertTrue(errors(file).contains("TASK_TYPE_INVALID"));

        ObjectNode wrongPart = sample(1);
        first(wrongPart).put("taskType", "JOINT_PLANNING");
        assertTrue(errors(wrongPart).contains("TASK_TYPE_INVALID"));
    }

    @Test
    void shouldRejectDuplicateExternalIdsInOneFile() throws IOException {
        ObjectNode file = sample(1);
        ((ArrayNode) file.get("exercises")).add(first(file).deepCopy());
        var result = validator.validate(file);
        assertTrue(result.exerciseIssues().get(1).stream().anyMatch(i -> i.code().equals("EXTERNAL_ID_DUPLICATE_IN_FILE")));
    }

    @Test
    void malformedJsonGetsAClearMessage() {
        var parsed = ExamImportParser.parse("{\"schemaVersion\": \"1.0\", \"exercises\": [");
        assertFalse(parsed.ok());
        assertTrue(parsed.error().startsWith("Invalid JSON"), parsed.error());
    }

    // ------------------------------------------------------------------ German only

    @Test
    void shouldRejectTranslationFieldsAnywhere() throws IOException {
        ObjectNode file = sample(2);
        ((ObjectNode) first(file).get("person")).putObject("translations").put("fa", "...");
        assertTrue(errors(file).contains("TRANSLATION_NOT_ALLOWED"));

        ObjectNode phrases = sample(3);
        ((ArrayNode) first(phrases).get("extraPhrases")).addObject().put("de", "Wie wäre es ...?").put("en", "How about ...?");
        var codes = errors(phrases);
        assertTrue(codes.contains("TRANSLATION_NOT_ALLOWED"), codes.toString());
        assertTrue(codes.contains("NOT_A_STRING"), codes.toString());

        ObjectNode instructions = sample(1);
        first(instructions).putObject("instructions").put("de", "Stellen Sie sich vor.").put("fa", "...");
        assertTrue(errors(instructions).contains("TRANSLATION_NOT_ALLOWED"));
    }

    @Test
    void shouldRejectPersianScriptAndMarkup() throws IOException {
        ObjectNode persian = sample(1);
        ((ArrayNode) first(persian).get("topics").get(0).get("exampleAnswers")).add("اسم من علی است");
        assertTrue(errors(persian).contains("NON_GERMAN_TEXT"));

        ObjectNode html = sample(2);
        first(html).put("opinionText", "Ich finde <b>Reisen</b> toll und fahre jedes Jahr mit Freunden in ein anderes Land, weil ich so viel lerne.");
        assertTrue(errors(html).contains("HTML_CONTENT"));
    }

    // ------------------------------------------------------------------ Teil 1

    @Test
    void teil1NeedsAllSevenCoreTopics() throws IOException {
        ObjectNode file = sample(1);
        ArrayNode topics = (ArrayNode) first(file).get("topics");
        topics.remove(6); // sprachen
        topics.remove(2); // wohnen
        var codes = errors(file);
        assertTrue(codes.contains("CORE_TOPIC_MISSING"), codes.toString());
    }

    @Test
    void teil1OptionalTopicsMayBeLeftOut() throws IOException {
        ObjectNode file = sample(1);
        ArrayNode topics = (ArrayNode) first(file).get("topics");
        topics.remove(8);
        topics.remove(7);
        assertTrue(errors(file).isEmpty());
    }

    @Test
    void teil1RejectsUnknownAndDuplicateTopicsAndMissingFields() throws IOException {
        ObjectNode file = sample(1);
        ArrayNode topics = (ArrayNode) first(file).get("topics");
        ((ObjectNode) topics.get(0)).put("id", "wetter");
        ((ObjectNode) topics.get(1)).put("id", "familie");
        ((ObjectNode) topics.get(2)).remove("exampleAnswers");
        var codes = errors(file);
        assertTrue(codes.containsAll(List.of("TOPIC_ID_INVALID", "TOPIC_ID_DUPLICATE", "TOPIC_EXAMPLES_MISSING")), codes.toString());
    }

    @Test
    void movedFieldsAreIgnoredWithAWarningNotRepeatedInTheExercise() throws IOException {
        ObjectNode file = sample(1);
        ((ObjectNode) first(file).get("topics").get(0)).putArray("questions").add("Wie heißen Sie?");
        first(file).putArray("usefulPhrases").add("Und Sie?");
        var result = validator.validate(file);
        assertTrue(codes(result, "ERROR").isEmpty(), codes(result, "ERROR").toString());
        assertTrue(codes(result, "WARNING").contains("MOVED_TO_GUIDE"));
        @SuppressWarnings("unchecked")
        Map<String, Object> stored = (Map<String, Object>) ((List<?>) result.exercises().get(0).speaking().data().get("topics")).get(0);
        assertFalse(stored.containsKey("questions"));
        assertFalse(result.exercises().get(0).speaking().data().containsKey("usefulPhrases"));
    }

    // ------------------------------------------------------------------ Teil 2

    @Test
    void teil2RejectsMissingRequiredFields() throws IOException {
        ObjectNode file = sample(2);
        ObjectNode ex = first(file);
        ex.remove("opinionText");
        ex.remove("topic");
        ((ObjectNode) ex.get("person")).remove("occupation");
        ((ObjectNode) ex.get("person")).put("age", "dreiunddreißig");
        var codes = errors(file);
        assertTrue(codes.containsAll(List.of("OPINION_TEXT_MISSING", "TOPIC_MISSING", "PERSON_OCCUPATION_MISSING", "PERSON_AGE_INVALID")), codes.toString());
    }

    @Test
    void teil2ValidatesImageReferences() throws IOException {
        ObjectNode ok = sample(2);
        ((ObjectNode) first(ok).get("person")).put("image", "/uploads/portraits/sabine.jpg").put("imageAlt", "Porträt einer lächelnden Frau");
        assertTrue(errors(ok).isEmpty());

        ObjectNode noAlt = sample(2);
        ((ObjectNode) first(noAlt).get("person")).put("image", "https://example.org/sabine.jpg").put("imageAlt", "");
        assertTrue(errors(noAlt).contains("IMAGE_ALT_MISSING"));

        ObjectNode bad = sample(2);
        ((ObjectNode) first(bad).get("person")).put("image", "javascript:alert(1)").put("imageAlt", "x");
        assertTrue(errors(bad).contains("IMAGE_REFERENCE_INVALID"));

        ObjectNode traversal = sample(2);
        ((ObjectNode) first(traversal).get("person")).put("image", "/uploads/../secret.png").put("imageAlt", "x");
        assertTrue(errors(traversal).contains("IMAGE_REFERENCE_INVALID"));
    }

    @Test
    void teil2OpinionQualityProblemsAreWarnings() throws IOException {
        ObjectNode file = sample(2);
        first(file).put("opinionText", "Reisen ist gut. Man sieht viel.");
        var result = validator.validate(file);
        assertTrue(codes(result, "ERROR").isEmpty());
        assertTrue(codes(result, "WARNING").containsAll(List.of("OPINION_LENGTH", "OPINION_NOT_FIRST_PERSON")), codes(result, "WARNING").toString());
    }

    // ------------------------------------------------------------------ Teil 3

    @Test
    void teil3RejectsMissingScenarioPointsAndFunctions() throws IOException {
        ObjectNode file = sample(3);
        ObjectNode ex = first(file);
        ex.remove("scenario");
        ((ArrayNode) ex.get("planningPoints")).remove(0);
        ((ArrayNode) ex.get("planningPoints")).remove(0);
        ((ArrayNode) ex.get("planningPoints")).remove(0);
        ((ArrayNode) ex.get("planningPoints")).remove(0);
        ((ArrayNode) ex.get("planningPoints")).remove(0);
        var codes = errors(file);
        assertTrue(codes.containsAll(List.of("SCENARIO_MISSING", "PLANNING_POINTS_COUNT")), codes.toString());
    }

    @Test
    void teil3DialogueMustUseBothSpeakers() throws IOException {
        ObjectNode file = sample(3);
        ArrayNode dialogue = (ArrayNode) first(file).get("exampleDialogue");
        for (JsonNode turn : dialogue) ((ObjectNode) turn).put("speaker", "A");
        assertTrue(errors(file).contains("DIALOGUE_ONE_SPEAKER"));

        ObjectNode badSpeaker = sample(3);
        ((ObjectNode) first(badSpeaker).get("exampleDialogue").get(0)).put("speaker", "C");
        assertTrue(errors(badSpeaker).contains("DIALOGUE_SPEAKER_INVALID"));
    }

    @Test
    void teil3DialogueAndHintsAreOptional() throws IOException {
        ObjectNode file = sample(3);
        first(file).remove("exampleDialogue");
        assertTrue(errors(file).isEmpty());
    }

    @Test
    void selfAssessmentIsOptionalPerExerciseButLimited() throws IOException {
        ObjectNode none = sample(3);
        first(none).remove("selfAssessment");
        assertTrue(errors(none).isEmpty());

        ObjectNode many = sample(3);
        ArrayNode items = first(many).putArray("selfAssessment");
        for (int i = 0; i < 9; i++) items.add("Punkt " + i);
        assertTrue(errors(many).contains("SELF_ASSESSMENT_COUNT"));
    }

    // ------------------------------------------------------------------ Lernbereich (shared learning content)

    private static ObjectNode guide(int part) throws IOException {
        return (ObjectNode) MAPPER.readTree(new ClassPathResource("speaking/guide-B1-teil" + part + ".json").getContentAsString(StandardCharsets.UTF_8));
    }

    private static List<String> guideCodes(int part, ObjectNode node, String severity) {
        List<com.deutschbridge.backend.model.dto.ExamContentDtos.Issue> issues = new java.util.ArrayList<>();
        ExamSpeakingReader.validateGuide(part, node, issues);
        return issues.stream().filter(i -> severity.equals(i.severity())).map(i -> i.code()).toList();
    }

    @Test
    void builtInGuidesOfAllThreePartsAreValid() throws IOException {
        for (int part = 1; part <= 3; part++) {
            assertTrue(guideCodes(part, guide(part), "ERROR").isEmpty(), "part " + part + ": " + guideCodes(part, guide(part), "ERROR"));
            assertTrue(guideCodes(part, guide(part), "WARNING").isEmpty(), "part " + part + ": " + guideCodes(part, guide(part), "WARNING"));
        }
    }

    @Test
    void guideTeil1NeedsTheSevenCoreTopicsAndQuestions() throws IOException {
        ObjectNode g = guide(1);
        ((ArrayNode) g.get("topics")).remove(0);
        assertTrue(guideCodes(1, g, "ERROR").contains("CORE_TOPIC_MISSING"));

        ObjectNode noQuestions = guide(1);
        ((ObjectNode) noQuestions.get("topics").get(0)).remove("questions");
        assertTrue(guideCodes(1, noQuestions, "ERROR").contains("TOPIC_QUESTIONS_MISSING"));

        ObjectNode format = guide(1);
        ((ArrayNode) format.get("topics").get(0).get("questions")).set(0, MAPPER.getNodeFactory().textNode("Wie heißen Sie"));
        assertTrue(guideCodes(1, format, "WARNING").contains("QUESTION_FORMAT"));
    }

    @Test
    void guideTeil2NeedsExactlyTheFourGoalsWithPhrases() throws IOException {
        ObjectNode g = guide(2);
        ((ArrayNode) g.get("goals")).remove(3);
        assertTrue(guideCodes(2, g, "ERROR").contains("GOAL_MISSING"));

        ObjectNode unknown = guide(2);
        ((ObjectNode) unknown.get("goals").get(0)).put("id", "COMPLAIN");
        assertTrue(guideCodes(2, unknown, "ERROR").contains("GOAL_ID_INVALID"));

        ObjectNode few = guide(2);
        ((ObjectNode) few.get("goals").get(1)).putArray("usefulPhrases").add("Ich finde ...");
        assertTrue(guideCodes(2, few, "ERROR").contains("GOAL_PHRASES_COUNT"));
    }

    @Test
    void guideTeil3NeedsAllSixFunctions() throws IOException {
        ObjectNode g = guide(3);
        ((ArrayNode) g.get("functions")).remove(4);
        assertTrue(guideCodes(3, g, "ERROR").contains("FUNCTION_MISSING"));
    }

    @Test
    void guideIsGermanOnlyAndNeedsTipsAndChecklist() throws IOException {
        ObjectNode g = guide(2);
        ((ObjectNode) g.get("goals").get(0)).putObject("translations").put("en", "x");
        assertTrue(guideCodes(2, g, "ERROR").contains("TRANSLATION_NOT_ALLOWED"));

        ObjectNode bare = guide(3);
        bare.remove("tips");
        bare.remove("selfAssessment");
        bare.remove("intro");
        var codes = guideCodes(3, bare, "ERROR");
        assertTrue(codes.containsAll(List.of("TIPS_MISSING", "SELF_ASSESSMENT_MISSING", "INTRO_MISSING")), codes.toString());
    }

    @Test
    void guideServiceSavesOnlyValidContentAndSupportsDryRun() throws Exception {
        var repository = org.mockito.Mockito.mock(com.deutschbridge.backend.repository.SpeakingGuideRepository.class);
        var context = org.mockito.Mockito.mock(com.deutschbridge.backend.context.RequestContext.class);
        org.mockito.Mockito.when(repository.findByLevelAndPartNumber(LearningLevel.B1, 2)).thenReturn(java.util.Optional.empty());
        org.mockito.Mockito.when(repository.save(org.mockito.ArgumentMatchers.any())).thenAnswer(i -> i.getArgument(0));
        var service = new SpeakingGuideService(repository, context, MAPPER);
        @SuppressWarnings("unchecked")
        Map<String, Object> valid = MAPPER.convertValue(guide(2), Map.class);

        assertTrue(service.save(LearningLevel.B1, 2, valid, false).saved());
        org.mockito.Mockito.verify(repository, org.mockito.Mockito.times(1)).save(org.mockito.ArgumentMatchers.any());

        assertFalse(service.save(LearningLevel.B1, 2, valid, true).saved(), "dry run never stores");
        org.mockito.Mockito.verify(repository, org.mockito.Mockito.times(1)).save(org.mockito.ArgumentMatchers.any());

        @SuppressWarnings("unchecked")
        Map<String, Object> invalid = MAPPER.convertValue(guide(2), Map.class);
        invalid.remove("goals");
        var result = service.save(LearningLevel.B1, 2, invalid, false);
        assertFalse(result.saved());
        assertTrue(result.issues().stream().anyMatch(i -> i.code().equals("GOALS_MISSING")));
        org.mockito.Mockito.verify(repository, org.mockito.Mockito.times(1)).save(org.mockito.ArgumentMatchers.any());

        assertThrows(com.deutschbridge.backend.exception.DataNotFoundException.class, () -> service.save(LearningLevel.B1, 4, valid, false));
    }

    // ------------------------------------------------------------------ storage, export, learner view

    @Test
    void entityStoresTheSpeakingContentAsDraftAndExportsBackForEveryPart() throws IOException {
        for (int part = 1; part <= 3; part++) {
            ObjectNode file = sample(part);
            ParsedExercise parsed = validator.validate(file).exercises().get(0);
            ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.TELC, "1.0", "1.0", "hash", "user");

            assertEquals(ExamSection.MUENDLICHER_AUSDRUCK, entity.getSection());
            assertEquals(spec(part).taskType(), entity.getTaskType());
            assertEquals(part, entity.getPartNumber());
            assertEquals(ExamContentStatus.DRAFT, entity.getStatus());
            assertFalse(entity.isPublished(), "imported content never auto-publishes");
            assertTrue(entity.getQuestions().isEmpty());
            assertEquals(1, entity.getPassages().size());
            assertNull(ExamContentService.publishProblem(entity));
            assertEquals(part, ExamTeilResolver.teilOf(entity));

            ObjectNode exported = ExamContentMapper.toExportNode(MAPPER, entity);
            assertNotNull(exported, "part " + part);
            ObjectNode again = sample(part);
            ((ArrayNode) again.get("exercises")).removeAll();
            ((ArrayNode) again.get("exercises")).add(exported);
            var result = validator.validate(again);
            assertTrue(codes(result, "ERROR").isEmpty(), "part " + part + ": " + codes(result, "ERROR"));
            // the round trip keeps the content
            ParsedExercise reparsed = result.exercises().get(0);
            assertEquals(parsed.speaking().data(), reparsed.speaking().data(), "part " + part);
        }
    }

    @Test
    void publishIsBlockedWhenTheStructuredContentIsGone() throws IOException {
        ParsedExercise parsed = validator.validate(sample(1)).exercises().get(0);
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.TELC, "1.0", "1.0", "hash", "user");
        entity.getMetadata().remove("speaking");
        assertNotNull(ExamContentService.publishProblem(entity));
    }

    @Test
    void learnerResponseCarriesTheSpeakingContent() throws IOException {
        ParsedExercise parsed = validator.validate(sample(2)).exercises().get(0);
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.TELC, "1.0", "1.0", "hash", "user");
        entity.setId("x1");
        ExamExercisePublicResponse response = ExamExerciseMapper.mapToPublicResponse(entity);
        assertEquals("MUENDLICHER_AUSDRUCK", response.section());
        assertEquals("OPINION_DISCUSSION", response.taskType());
        assertEquals(2, response.teil());
        assertEquals("OPINION_DISCUSSION", response.speaking().get("taskType"));
        assertEquals("Gruppenreisen", response.speaking().get("topic"));

        // other sections never carry it
        ExamExercise reading = new ExamExercise();
        reading.setId("r1");
        reading.setSection(ExamSection.LESEVERSTEHEN);
        reading.setTaskType(ExamTaskType.MATCHING);
        assertNull(ExamExerciseMapper.mapToPublicResponse(reading).speaking());
    }

    @Test
    void previewShowsTheContentOfThePart() throws IOException {
        ParsedExercise parsed = validator.validate(sample(3)).exercises().get(0);
        var preview = ExamContentMapper.toPreview(parsed);
        assertEquals("JOINT_PLANNING", preview.speaking().taskType());
        assertEquals("Abschiedsparty", preview.speaking().topic());
        assertTrue(preview.speaking().content().containsKey("planningPoints"));
    }

    @Test
    void duplicateDetectionComparesTheWholeTask() throws IOException {
        var first = validator.validate(sample(2)).exercises().get(0);
        String hash = ExamContentFingerprint.hashTexts(first.textContents());
        ObjectNode copy = sample(2);
        first(copy).put("externalId", "B1-M2-002");
        var twin = validator.validate(copy).exercises().get(0);
        var matches = new ExamDuplicateDetector().detect(twin, ExamType.TELC, hash,
                List.of(ExamDuplicateDetector.Candidate.of(first, ExamType.TELC, hash)));
        assertEquals("BATCH_EXACT", matches.get(0).kind());
        ExamExercise stored = ExamContentMapper.toEntity(first, ExamType.TELC, "1.0", "1.0", hash, "user");
        assertEquals(ExamContentMapper.toPlainText(stored.getPassages().get(0).getContent()), first.textContents().get(0));
    }

    // ------------------------------------------------------------------ prompt

    @Test
    void everyPartHasAPromptWhoseExampleIsTheSchemaTheImporterAccepts() throws Exception {
        for (int part = 1; part <= 3; part++) {
            ExamContentSpec spec = spec(part);
            PromptResponse r = new ExamContentPromptBuilder().build(spec,
                    new PromptRequest("TELC", "B1", "MUENDLICHER_AUSDRUCK", "TEIL_" + part, 4, "MIXED", List.of("TRAVEL"), null),
                    2, 3, List.of("B1 Mündlicher Ausdruck – Gruppenreisen - Gruppenreisen"));
            String prompt = r.prompt();
            assertFalse(prompt.contains("{{"), "unresolved placeholder in part " + part);
            assertTrue(prompt.contains("Generate exactly 4 exercise sets"));
            assertTrue(prompt.contains("B1-M" + part + "-003"), prompt);
            assertTrue(prompt.contains("Do NOT add translations") || prompt.contains("Do not add translations of any kind"));
            assertTrue(prompt.contains("Do NOT write Persian"));
            assertTrue(prompt.contains("\"en\" or \"fa\""));
            assertTrue(prompt.contains("Return ONLY one valid JSON document"));
            assertTrue(prompt.contains("EXISTING EXERCISES"));
            assertTrue(prompt.contains(spec.defaultInstructions()));
            assertTrue(prompt.contains("NOT official"), "must not claim official TELC material");
            assertFalse(r.jsonExample().contains("\"en\""), "the schema example must not contain translation fields");
            assertFalse(r.jsonExample().contains("\"fa\""));

            // the example printed in the prompt carries the right header and parses
            JsonNode example = MAPPER.readTree(r.jsonExample());
            assertEquals("MUENDLICHER_AUSDRUCK", example.get("section").asText());
            assertEquals("TEIL_" + part, example.get("part").asText());
            assertEquals(spec.taskType().name(), example.get("exercises").get(0).get("taskType").asText());
            assertTrue(ExamImportParser.parse(r.jsonExample()).ok());
            assertTrue(prompt.contains(r.jsonExample()), "the prompt must print the example");
        }
    }

    @Test
    void theSchemaInThePromptIsAcceptedByTheImporter() throws Exception {
        // Fill the "..." placeholders of each generated example with German text and check the validator accepts the structure.
        for (int part = 1; part <= 3; part++) {
            PromptResponse r = new ExamContentPromptBuilder().build(spec(part),
                    new PromptRequest("TELC", "B1", "MUENDLICHER_AUSDRUCK", "TEIL_" + part, 1, "MEDIUM", List.of(), null), 0, 1);
            ObjectNode file = (ObjectNode) MAPPER.readTree(r.jsonExample());
            var result = validator.validate(file);
            var structural = codes(result, "ERROR").stream()
                    .filter(c -> !c.endsWith("_DUPLICATE") && !c.equals("PERSON_NAME_MISSING"))
                    .toList();
            // a placeholder example may only fail on content that is not allowed to be "..." (e.g. the age is a number, so it passes)
            assertFalse(structural.contains("TRANSLATION_NOT_ALLOWED"), structural.toString());
            assertFalse(structural.contains("TASK_TYPE_INVALID"), structural.toString());
            assertFalse(structural.contains("SPEC_UNSUPPORTED"), structural.toString());
            assertFalse(structural.contains("CORE_TOPIC_MISSING"), structural.toString());
            assertFalse(structural.contains("GOAL_MISSING"), structural.toString());
            assertFalse(structural.contains("FUNCTION_MISSING"), structural.toString());
        }
    }

    @Test
    void promptRejectsUnknownThemeButNotMissingOnes() {
        var builder = new ExamContentPromptBuilder();
        assertThrows(IllegalArgumentException.class, () -> builder.build(spec(1),
                new PromptRequest("TELC", "B1", "MUENDLICHER_AUSDRUCK", "TEIL_1", 1, "MIXED", List.of("UNKNOWN"), null), 0, 1));
        assertThrows(IllegalArgumentException.class, () -> builder.build(spec(1),
                new PromptRequest("TELC", "B1", "MUENDLICHER_AUSDRUCK", "TEIL_1", 0, "MIXED", List.of(), null), 0, 1));
        PromptResponse plain = builder.build(spec(3), new PromptRequest("TELC", "B1", "MUENDLICHER_AUSDRUCK", "TEIL_3", 1, "MIXED", List.of(), null), 0, 1);
        assertFalse(plain.prompt().contains("EXISTING EXERCISES"));
    }

    @Test
    void specsAreRegisteredForTheThreeParts() {
        assertEquals(ExamTaskType.TOPIC_INTERVIEW, spec(1).taskType());
        assertEquals(ExamTaskType.OPINION_DISCUSSION, spec(2).taskType());
        assertEquals(ExamTaskType.JOINT_PLANNING, spec(3).taskType());
        assertTrue(ExamContentSpecs.find(ExamType.TELC, LearningLevel.B1, ExamSection.MUENDLICHER_AUSDRUCK, 4).isEmpty());
        // existing parts are untouched
        assertTrue(ExamContentSpecs.find(ExamType.TELC, LearningLevel.B1, ExamSection.LESEVERSTEHEN, 1).isPresent());
        assertFalse(ExamContentSpecs.find(ExamType.TELC, LearningLevel.B1, ExamSection.LESEVERSTEHEN, 1).orElseThrow().isSpeaking());
    }
}
