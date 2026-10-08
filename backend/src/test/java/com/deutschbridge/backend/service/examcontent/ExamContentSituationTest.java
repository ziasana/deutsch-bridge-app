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

/** TELC B1 Lesen Teil 3: 10 situations matched to 12 advertisements (or x). */
class ExamContentSituationTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final List<String> ANSWERS = List.of("d", "h", "a", "k", "f", "c", "l", "b", "g", "x");
    private static final List<String> ADS = List.of("a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l");

    private final ExamContentValidator validator = new ExamContentValidator();
    private final ExamContentSpec spec = ExamContentSpecs.find(ExamType.TELC, LearningLevel.B1, ExamSection.LESEVERSTEHEN, 3).orElseThrow();

    private static ObjectNode exercise(String externalId) {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("externalId", externalId);
        ex.put("title", "Passende Anzeigen finden");
        ex.put("instructions", "Lesen Sie die Situationen 11–20 und die Anzeigen a–l.");
        ArrayNode situations = ex.putArray("situations");
        for (int i = 0; i < 10; i++) {
            ObjectNode s = situations.addObject();
            s.put("id", "situation_" + (11 + i));
            s.put("number", 11 + i);
            s.put("text", "Sie suchen etwas Besonderes Nummer " + i + ".");
            s.put("correctAdvertisementId", ANSWERS.get(i));
        }
        ArrayNode ads = ex.putArray("advertisements");
        for (String id : ADS) {
            ObjectNode a = ads.addObject();
            a.put("id", id);
            a.put("type", "RESTAURANT");
            a.put("layout", "CLASSIC");
            ObjectNode c = a.putObject("content");
            c.put("headline", "Anzeige " + id + " & Co");
            c.put("description", "Beschreibung für " + id);
            c.putArray("details").add("Täglich geöffnet").add("Auch zum Mitnehmen");
            c.putObject("contact").put("address", "Musterstraße " + id).put("phone", "089 / 123 45 6" + id.charAt(0) % 10);
            ObjectNode v = a.putObject("visual");
            v.put("hasImage", true).put("imageType", "PHOTO").putNull("imageUrl");
            v.put("imagePrompt", "Terrasse mit Gästen").put("altText", "Terrasse");
        }
        ex.putObject("metadata").put("difficulty", "MEDIUM").putArray("topics").add("SERVICES");
        return ex;
    }

    private static ObjectNode batch(ObjectNode... exercises) {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("schemaVersion", "1.0");
        root.put("contentType", "EXAM_EXERCISE_BATCH");
        root.put("exam", "TELC");
        root.put("level", "B1");
        root.put("section", "LESEN");
        root.put("part", "TEIL_3");
        ArrayNode array = root.putArray("exercises");
        for (ObjectNode e : exercises) array.add(e);
        return root;
    }

    private static List<String> codes(ExamContentValidator.FileResult r, String severity) {
        return r.exerciseIssues().get(0).stream().filter(i -> severity.equals(i.severity())).map(Issue::code).toList();
    }

    private static List<String> errors(ExamContentValidator.FileResult r) {
        return codes(r, "ERROR");
    }

    @Test
    void validExerciseResolvesTheSituationSpec() {
        var result = validator.validate(batch(exercise("B1-L3-001")));
        assertTrue(result.fileIssues().isEmpty());
        assertTrue(errors(result).isEmpty(), errors(result).toString());
        ParsedExercise parsed = result.exercises().get(0);
        assertTrue(parsed.spec().isSituationMatching());
        assertEquals(10, parsed.situations().size());
        assertEquals(12, parsed.advertisements().size());
        assertEquals("B1-L3-", spec.externalIdPrefix());
    }

    @Test
    void duplicateAdvertisementUsageIsAHardError() {
        ObjectNode ex = exercise("B1-L3-001");
        ((ObjectNode) ex.get("situations").get(1)).put("correctAdvertisementId", "d");
        var result = validator.validate(batch(ex));
        assertTrue(errors(result).contains("AD_REUSED"), errors(result).toString());
        String message = result.exerciseIssues().get(0).stream().filter(i -> i.code().equals("AD_REUSED")).findFirst().orElseThrow().message();
        assertTrue(message.contains("11") && message.contains("12"), message);
    }

    @Test
    void xIsAcceptedMoreThanOnceAndInvalidIdsAreRejected() {
        ObjectNode twoX = exercise("B1-L3-001");
        ((ObjectNode) twoX.get("situations").get(0)).put("correctAdvertisementId", "X");
        assertTrue(errors(validator.validate(batch(twoX))).isEmpty());

        ObjectNode bad = exercise("B1-L3-001");
        ((ObjectNode) bad.get("situations").get(6)).put("correctAdvertisementId", "m");
        assertTrue(errors(validator.validate(batch(bad))).contains("SITUATION_ANSWER_INVALID"));
    }

    @Test
    void countsAndNumbersAreChecked() {
        ObjectNode ex = exercise("B1-L3-001");
        ((ArrayNode) ex.get("situations")).remove(9);
        ((ArrayNode) ex.get("advertisements")).remove(11);
        ((ObjectNode) ex.get("situations").get(0)).put("number", 3);
        var codes = errors(validator.validate(batch(ex)));
        assertTrue(codes.contains("SITUATION_COUNT"), codes.toString());
        assertTrue(codes.contains("AD_COUNT"), codes.toString());
        assertTrue(codes.contains("AD_IDS"), codes.toString());
        assertTrue(codes.contains("SITUATION_NUMBERS"), codes.toString());
    }

    @Test
    void visualDataIsValidated() {
        ObjectNode ex = exercise("B1-L3-001");
        ObjectNode v = (ObjectNode) ex.get("advertisements").get(0).get("visual");
        v.put("imageType", "HOLOGRAM");
        ((ObjectNode) ex.get("advertisements").get(1).get("visual")).remove("altText");
        ((ObjectNode) ex.get("advertisements").get(2)).put("layout", "WILD");
        ((ObjectNode) ex.get("advertisements").get(3)).remove("visual");
        var result = validator.validate(batch(ex));
        assertTrue(errors(result).contains("AD_IMAGE_TYPE_INVALID"));
        assertTrue(errors(result).contains("AD_ALT_TEXT_MISSING"));
        assertTrue(codes(result, "WARNING").contains("AD_LAYOUT_UNKNOWN"));
    }

    @Test
    void emptyAdvertisementContentIsRejected() {
        ObjectNode ex = exercise("B1-L3-001");
        ((ObjectNode) ex.get("advertisements").get(0)).putObject("content");
        assertTrue(errors(validator.validate(batch(ex))).contains("AD_CONTENT_EMPTY"));
    }

    @Test
    void ambiguityIsReportedFromTheMatchingProfilesAsAWarning() {
        ObjectNode ex = exercise("B1-L3-001");
        ObjectNode need = ((ObjectNode) ex.get("situations").get(0)).putObject("matchingProfile");
        need.put("primaryNeed", "RESTAURANT").putArray("requirements").add("OUTDOOR_SEATING");
        for (String id : List.of("d", "e")) {
            ObjectNode ad = (ObjectNode) ex.get("advertisements").get(ADS.indexOf(id));
            ad.putObject("matchingProfile").put("primaryService", "RESTAURANT").putArray("features").add("OUTDOOR_SEATING");
        }
        var result = validator.validate(batch(ex));
        assertTrue(errors(result).isEmpty());
        var warning = result.exerciseIssues().get(0).stream().filter(i -> i.code().equals("SITUATION_AMBIGUOUS")).findFirst().orElseThrow();
        assertTrue(warning.message().contains("Situation 11") && warning.message().contains("advertisement e"));
    }

    @Test
    void entityUsesTheSituationMatchingModelAndExportsBackToTheSameShape() {
        ObjectNode source = exercise("B1-L3-001");
        ((ObjectNode) source.get("situations").get(0)).putObject("matchingProfile").put("primaryNeed", "RESTAURANT");
        ParsedExercise parsed = validator.validate(batch(source)).exercises().get(0);
        ExamExercise entity = ExamContentMapper.toEntity(parsed, ExamType.TELC, "1.0", "1.0", "hash", "user");

        assertEquals(ExamTaskType.SITUATION_MATCHING, entity.getTaskType());
        assertEquals(3, entity.getPartNumber());
        assertEquals(ExamContentStatus.DRAFT, entity.getStatus());
        assertEquals(12, entity.getPassages().size());
        assertEquals("a", entity.getPassages().get(0).getLabel());
        assertTrue(entity.getPassages().get(0).getContent().contains("<strong>Anzeige a &amp; Co</strong>"));
        assertEquals(10, entity.getQuestions().size());
        assertEquals(11, entity.getQuestions().get(0).getQuestionNumber());
        String passageForD = entity.getPassages().get(3).getId();
        assertEquals(passageForD, entity.getQuestions().get(0).getCorrectAnswer(), "situation 11 -> ad d (passage id)");
        assertEquals("X", entity.getQuestions().get(9).getCorrectAnswer());
        assertNull(entity.getAnswerOptions());
        assertNull(ExamContentService.publishProblem(entity));

        ObjectNode exported = ExamContentMapper.toExportNode(MAPPER, entity);
        assertNotNull(exported);
        assertEquals("d", exported.get("situations").get(0).get("correctAdvertisementId").asText());
        assertEquals("x", exported.get("situations").get(9).get("correctAdvertisementId").asText());
        assertEquals("RESTAURANT", exported.get("situations").get(0).get("matchingProfile").get("primaryNeed").asText());
        assertEquals("Terrasse", exported.get("advertisements").get(0).get("visual").get("altText").asText());
        assertEquals("CLASSIC", exported.get("advertisements").get(0).get("layout").asText());
        assertFalse(exported.get("metadata").has("teil3"));

        var again = validator.validate(batch(exported));
        assertTrue(errors(again).isEmpty(), errors(again).toString());
    }

    @Test
    void duplicateDetectionUsesTheAdvertisementTexts() {
        var first = validator.validate(batch(exercise("B1-L3-001"))).exercises().get(0);
        String hash = ExamContentFingerprint.hashTexts(first.textContents());
        assertNotNull(hash);
        var twin = validator.validate(batch(exercise("B1-L3-002"))).exercises().get(0);
        var matches = new ExamDuplicateDetector().detect(twin, ExamType.TELC, hash,
                List.of(ExamDuplicateDetector.Candidate.of(first, ExamType.TELC, hash)));
        assertEquals("BATCH_EXACT", matches.get(0).kind());
    }

    @Test
    void promptIsBuiltFromTheSpecAndItsExampleIsValid() throws Exception {
        PromptResponse r = new ExamContentPromptBuilder().build(spec,
                new PromptRequest("TELC", "B1", "LESEN", "TEIL_3", 5, "MIXED", List.of(), null, true), 0, 1);
        assertFalse(r.prompt().contains("{{"), "unresolved placeholder");
        assertTrue(r.prompt().contains("B1-L3-001"));
        assertTrue(r.prompt().contains("exactly 10 situations"));
        assertTrue(r.prompt().contains("exactly 12 advertisements"));
        assertTrue(r.prompt().contains("Visual briefs are requested"));
        assertTrue(r.prompt().contains("must NEVER reveal the correct answer"));
        assertTrue(r.prompt().contains("Return ONLY valid JSON"));

        var root = MAPPER.readTree(r.jsonExample());
        assertEquals("TEIL_3", root.get("part").asText());
        assertEquals(10, root.get("exercises").get(0).get("situations").size());
        assertEquals(12, root.get("exercises").get(0).get("advertisements").size());

        PromptResponse noVisuals = new ExamContentPromptBuilder().build(spec,
                new PromptRequest("TELC", "B1", "LESEN", "TEIL_3", 1, "MIXED", List.of(), null, false), 0, 1);
        assertTrue(noVisuals.prompt().contains("Visual briefs are NOT requested"));
    }
}
