package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.ExamContentDtos.DtzOralSaveResult;
import com.deutschbridge.backend.model.dto.ExamContentDtos.StatusChangeRequest;
import com.deutschbridge.backend.model.dto.ExamContentDtos.StatusChangeResult;
import com.deutschbridge.backend.model.dto.ExamExercisePublicResponse;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.enums.ExamContentStatus;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import com.deutschbridge.backend.util.ExamExerciseMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Creating, editing, publishing and archiving DTZ Mündliche Prüfung exercises, and what a learner may fetch. */
class ExamContentDtzOralServiceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String IMAGE = "/uploads/exam-passages/abc123.webp";
    private ExamExerciseRepository repository;
    private ExamContentService service;

    @BeforeEach
    void setUp() {
        repository = mock(ExamExerciseRepository.class);
        RequestContext context = mock(RequestContext.class);
        when(context.getUserId()).thenReturn("admin");
        when(repository.save(any(ExamExercise.class))).thenAnswer(inv -> inv.getArgument(0));
        service = new ExamContentService(repository, context);
    }

    private static ObjectNode photoBody(String title) {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("part", 2).put("title", title).put("topic", "Einkaufen");
        ex.putObject("image").putNull("imageUrl").put("imagePrompt",
                "An original realistic photograph of an adult shopping online at home with a laptop and a parcel, natural light, no readable text, no logos, no watermarks.")
                .put("altText", "Eine Frau bestellt am Laptop etwas im Internet.");
        ex.putObject("possibleSolution").put("description", "Ich sehe eine Frau am Laptop.").put("experienceA2", "Ich kaufe manchmal online.").put("experienceB1", "Ich kaufe online, weil es bequem ist.");
        ObjectNode a = ex.putObject("participantA");
        a.put("instructions", DtzOralSchema.PARTICIPANT_A_INSTRUCTIONS);
        a.putArray("questions").add(DtzOralSchema.PICTURE_PROMPTS.get(0)).add(DtzOralSchema.PICTURE_PROMPTS.get(1));
        ObjectNode b = ex.putObject("participantB");
        b.put("instructions", DtzOralSchema.PARTICIPANT_B_INSTRUCTIONS);
        b.putArray("questionsA2").add("Was haben Sie schon im Internet gekauft?").add("Welche Produkte kaufen Sie lieber im Geschäft?")
                .add("Wo kaufen Sie sonst noch ein?").add("Wie bezahlen Sie beim Einkaufen?");
        b.putArray("questionsB1").add("Wo kaufen Sie meistens ein? Warum?").add("Welche Erfahrungen haben Sie mit Einkäufen im Internet gemacht?")
                .add("Welche Vor- und Nachteile gibt es?").add("Wie unterscheidet sich das Einkaufsverhalten in Ihrem Heimatland?");
        return ex;
    }

    private static ObjectNode planningBody() {
        ObjectNode ex = MAPPER.createObjectNode();
        ex.put("part", 3).put("title", "Ein Klassenfest organisieren").put("topic", "Klassenfest");
        ex.put("situation", "Ihr Deutschkurs möchte ein kleines Fest feiern. Sie beide organisieren das Klassenfest.");
        ex.put("taskInstruction", DtzOralSchema.TASK_INSTRUCTION);
        ArrayNode notes = ex.putArray("planningNotes");
        List<String> labels = List.of("Wann?", "Wo feiern?", "Essen und Trinken?", "Musik?");
        for (int i = 0; i < labels.size(); i++) notes.addObject().put("number", i + 1).put("label", labels.get(i));
        ArrayNode dialogue = ex.putObject("possibleSolution").putArray("dialogue");
        String[] turns = {"Wann feiern wir?", "Am Freitag. Passt dir das?", "Ja. Wo feiern wir?", "Im Kursraum.", "Gut. Was machen wir mit Essen und Trinken?", "Jeder bringt etwas mit."};
        for (int i = 0; i < turns.length; i++) dialogue.addObject().put("speaker", i % 2 == 0 ? "A" : "B").put("text", turns[i]);
        return ex;
    }

    private ExamExercise created(ObjectNode body) throws Exception {
        service.saveDtzOral(null, body);
        ArgumentCaptor<ExamExercise> saved = ArgumentCaptor.forClass(ExamExercise.class);
        verify(repository, atLeastOnce()).save(saved.capture());
        ExamExercise e = saved.getValue();
        e.setId("ex1");
        when(repository.findById("ex1")).thenReturn(Optional.of(e));
        when(repository.findAllById(List.of("ex1"))).thenReturn(List.of(e));
        return e;
    }

    private StatusChangeResult move(String status) {
        return service.changeStatus(new StatusChangeRequest(List.of("ex1"), status));
    }

    // ---- Teil 1

    @Test
    void teil1TemplateIsCreatedAsADraftWithTheSixFixedTopics() throws Exception {
        DtzOralSaveResult result = service.createDefaultTeil1Template();
        ArgumentCaptor<ExamExercise> saved = ArgumentCaptor.forClass(ExamExercise.class);
        verify(repository).save(saved.capture());
        ExamExercise e = saved.getValue();
        assertNotNull(result);
        assertEquals(ExamType.DTZ, e.getExamType());
        assertEquals(ExamSection.MUENDLICHER_AUSDRUCK, e.getSection());
        assertEquals(ExamTaskType.SELF_INTRODUCTION, e.getTaskType());
        assertEquals(1, e.getPartNumber());
        assertEquals(ExamContentStatus.DRAFT, e.getStatus());
        assertFalse(e.isPublished());
        List<?> topics = (List<?>) ((Map<?, ?>) e.getMetadata().get("dtzOral")).get("topics");
        assertEquals(6, topics.size());
        assertEquals("Arbeit/Beruf", ((Map<?, ?>) topics.get(3)).get("label"));
    }

    @Test
    void onlyOneActiveTeil1TemplateIsAllowed() throws Exception {
        ExamExercise existing = new ExamExercise();
        existing.setExamType(ExamType.DTZ);
        existing.setStatus(ExamContentStatus.DRAFT);
        when(repository.findBySectionAndTaskType(ExamSection.MUENDLICHER_AUSDRUCK, ExamTaskType.SELF_INTRODUCTION)).thenReturn(List.of(existing));
        assertThrows(IllegalArgumentException.class, () -> service.createDefaultTeil1Template());
        existing.applyStatus(ExamContentStatus.ARCHIVED);
        assertDoesNotThrow(() -> service.createDefaultTeil1Template());
    }

    @Test
    void teil1CannotLoseOrRenameATopicWhenEdited() throws Exception {
        ExamExercise e = created(DtzOralTemplates.teil1());
        ObjectNode edited = DtzOralTemplates.teil1();
        ((ObjectNode) edited.get("topics").get(1)).put("label", "Heimat");
        assertThrows(IllegalArgumentException.class, () -> service.saveDtzOral("ex1", edited));
        // The editable parts (instruction, guidance, practice support) can change.
        ObjectNode ok = DtzOralTemplates.teil1();
        ok.put("guidance", "Neue Hilfe für Lernende.");
        service.saveDtzOral("ex1", ok);
        assertEquals(2, e.getVersion());
        assertEquals("Neue Hilfe für Lernende.", ((Map<?, ?>) e.getMetadata().get("dtzOral")).get("guidance"));
    }

    @Test
    void teil1CanBePublishedAndArchived() throws Exception {
        ExamExercise e = created(DtzOralTemplates.teil1());
        assertFalse(e.isPublished(), "a draft is not available to learners");
        assertEquals(1, move("APPROVED").updated());
        assertEquals(1, move("PUBLISHED").updated());
        assertTrue(e.isPublished());
        assertEquals(1, move("ARCHIVED").updated());
        assertFalse(e.isPublished());
        assertEquals(ExamContentStatus.ARCHIVED, e.getStatus());
    }

    // ---- Teil 2

    @Test
    void teil2CannotBePublishedWithoutAnImage() throws Exception {
        ExamExercise e = created(photoBody("Einkaufen im Internet"));
        assertEquals(ExamContentStatus.DRAFT, e.getStatus());
        assertEquals(1, move("APPROVED").updated());
        StatusChangeResult result = move("PUBLISHED");
        assertEquals(0, result.updated());
        assertTrue(result.failures().get(0).reason().contains("photo"), result.failures().get(0).reason());
        assertFalse(e.isPublished());
    }

    @Test
    void teil2CanBePublishedOnceTheImageIsAttached() throws Exception {
        ExamExercise e = created(photoBody("Einkaufen im Internet"));
        ObjectNode withImage = photoBody("Einkaufen im Internet");
        ((ObjectNode) withImage.get("image")).put("imageUrl", IMAGE);
        service.saveDtzOral("ex1", withImage);
        assertEquals(IMAGE, e.getPassages().get(0).getImageUrl(), "the photo is stored where every exam image lives");
        move("APPROVED");
        assertEquals(1, move("PUBLISHED").updated());
        assertTrue(e.isPublished());
    }

    @Test
    void aPlaceholderImageLinkIsNeverStoredAndNeverMakesTheExercisePublishable() throws Exception {
        ObjectNode body = photoBody("Einkaufen im Internet");
        ((ObjectNode) body.get("image")).put("imageUrl", "https://via.placeholder.com/600x400");
        ExamExercise e = created(body);
        assertNull(e.getPassages().get(0).getImageUrl());
        assertNotNull(ExamContentService.publishProblem(e));
    }

    @Test
    void anExerciseWithoutAnyImageDataCanBeSavedAndGetsItsPhotoLater() throws Exception {
        ObjectNode body = photoBody("Einkaufen im Internet");
        body.remove("image");
        ExamExercise e = created(body);
        assertEquals(ExamContentStatus.DRAFT, e.getStatus());
        assertTrue(ExamContentService.publishProblem(e).contains("photo"));
        ObjectNode withImage = photoBody("Einkaufen im Internet");
        ((ObjectNode) withImage.get("image")).put("imageUrl", IMAGE);
        service.saveDtzOral("ex1", withImage);
        assertNull(ExamContentService.publishProblem(e));
    }

    @Test
    void teil2WithoutBothQuestionSetsIsRejected() {
        ObjectNode body = photoBody("Einkaufen im Internet");
        ((ObjectNode) body.get("participantB")).remove("questionsB1");
        assertThrows(IllegalArgumentException.class, () -> service.saveDtzOral(null, body));
        verify(repository, never()).save(any());
    }

    @Test
    void removingTheImageOfAPublishedPhotoExerciseIsRefused() throws Exception {
        ExamExercise e = created(photoBody("Einkaufen im Internet"));
        ObjectNode withImage = photoBody("Einkaufen im Internet");
        ((ObjectNode) withImage.get("image")).put("imageUrl", IMAGE);
        service.saveDtzOral("ex1", withImage);
        move("APPROVED");
        move("PUBLISHED");
        assertThrows(IllegalArgumentException.class, () -> service.saveDtzOral("ex1", photoBody("Einkaufen im Internet")));
        assertEquals(IMAGE, e.getPassages().get(0).getImageUrl());
    }

    @Test
    void learnerResponseHasBothQuestionSetsAndThePhotoButNeitherImagePromptNorAdminMetadata() throws Exception {
        ExamExercise e = created(photoBody("Einkaufen im Internet"));
        ObjectNode withImage = photoBody("Einkaufen im Internet");
        ((ObjectNode) withImage.get("image")).put("imageUrl", IMAGE);
        service.saveDtzOral("ex1", withImage);
        move("APPROVED");
        move("PUBLISHED");

        ExamExercisePublicResponse response = ExamExerciseMapper.mapToPublicResponse(e);
        assertNotNull(response.dtzOral());
        Map<?, ?> image = (Map<?, ?>) response.dtzOral().get("image");
        assertEquals(IMAGE, image.get("imageUrl"));
        assertFalse(image.containsKey("imagePrompt"), "the image prompt is admin-only");
        Map<?, ?> participantB = (Map<?, ?>) response.dtzOral().get("participantB");
        assertEquals(4, ((List<?>) participantB.get("questionsA2")).size());
        assertEquals(4, ((List<?>) participantB.get("questionsB1")).size());
        assertEquals(2, ((List<?>) ((Map<?, ?>) response.dtzOral().get("participantA")).get("questions")).size());
        assertNotNull(response.dtzOral().get("possibleSolution"), "the possible solution is learner content (revealed on request)");
        assertNull(response.writingChoice());
        assertNull(response.speaking());
    }

    // ---- Teil 3

    @Test
    void teil3IsSavedAndPublishedWithItsPlanningNotes() throws Exception {
        ExamExercise e = created(planningBody());
        assertEquals(ExamTaskType.JOINT_PLANNING, e.getTaskType());
        assertEquals(3, e.getPartNumber());
        move("APPROVED");
        assertEquals(1, move("PUBLISHED").updated());
        ExamExercisePublicResponse response = ExamExerciseMapper.mapToPublicResponse(e);
        assertEquals(4, ((List<?>) response.dtzOral().get("planningNotes")).size());
        assertEquals(DtzOralSchema.TASK_INSTRUCTION, response.dtzOral().get("taskInstruction"));
        assertNotNull(response.dtzOral().get("possibleSolution"));
    }

    @Test
    void teil3NotesCanBeEditedButNotBelowFour() throws Exception {
        ExamExercise e = created(planningBody());
        ObjectNode edited = planningBody();
        ((ArrayNode) edited.get("planningNotes")).addObject().put("number", 5).put("label", "Wer kocht?");
        service.saveDtzOral("ex1", edited);
        assertEquals(5, ((List<?>) ((Map<?, ?>) e.getMetadata().get("dtzOral")).get("planningNotes")).size());
        ObjectNode tooFew = planningBody();
        ((ArrayNode) tooFew.get("planningNotes")).remove(3);
        assertThrows(IllegalArgumentException.class, () -> service.saveDtzOral("ex1", tooFew));
    }

    // ---- guards

    @Test
    void thePartOfAnExerciseCannotChange() throws Exception {
        created(planningBody());
        assertThrows(IllegalArgumentException.class, () -> service.saveDtzOral("ex1", photoBody("x")));
    }

    @Test
    void anotherKindOfExerciseCannotBeEditedAsOral() {
        ExamExercise other = new ExamExercise();
        other.setId("ex2");
        other.setExamType(ExamType.DTZ);
        other.setSection(ExamSection.SCHRIFTLICHER_AUSDRUCK);
        when(repository.findById("ex2")).thenReturn(Optional.of(other));
        assertThrows(IllegalArgumentException.class, () -> service.saveDtzOral("ex2", planningBody()));
    }

    @Test
    void telcSpeakingAndOtherExercisesKeepTheirOwnPublishRules() {
        ExamExercise telc = new ExamExercise();
        telc.setExamType(ExamType.TELC);
        telc.setSection(ExamSection.MUENDLICHER_AUSDRUCK);
        telc.setTaskType(ExamTaskType.TOPIC_INTERVIEW);
        telc.setPassages(List.of(new com.deutschbridge.backend.model.entity.ExamPassage("p", "Aufgabe", "<p>x</p>", null, null, null)));
        assertTrue(ExamContentService.publishProblem(telc).contains("metadata.speaking"));
    }

    // ---- import workflow

    private static String importFile(ObjectNode exercise) {
        exercise.put("exam", "DTZ").put("section", "MUENDLICH").put("level", "A2_B1").put("exerciseType", DtzOralSchema.taskTypeOf(exercise.get("part").asInt()));
        return exercise.toString();
    }

    @Test
    void importedOralExercisesAreSavedAsDrafts() {
        String json = importFile(planningBody());
        var report = service.validate(json);
        assertTrue(report.syntaxValid());
        assertEquals(1, report.importableCount());
        var result = service.importContent(new com.deutschbridge.backend.model.dto.ExamContentDtos.ImportRequest(json, null));
        assertEquals(1, result.imported().size());
        ArgumentCaptor<ExamExercise> saved = ArgumentCaptor.forClass(ExamExercise.class);
        verify(repository).save(saved.capture());
        assertEquals(ExamContentStatus.DRAFT, saved.getValue().getStatus());
        assertFalse(saved.getValue().isPublished());
        assertEquals(ExamTaskType.JOINT_PLANNING, saved.getValue().getTaskType());
        assertEquals(ExamType.DTZ, saved.getValue().getExamType());
    }

    @Test
    void anImportedPhotoExerciseWithoutAnImageIsImportableButNotPublishable() {
        String json = importFile(photoBody("Einkaufen im Internet"));
        assertEquals(1, service.validate(json).importableCount());
        service.importContent(new com.deutschbridge.backend.model.dto.ExamContentDtos.ImportRequest(json, null));
        ArgumentCaptor<ExamExercise> saved = ArgumentCaptor.forClass(ExamExercise.class);
        verify(repository).save(saved.capture());
        assertNotNull(ExamContentService.publishProblem(saved.getValue()));
    }

    @Test
    void invalidOralJsonIsRejectedByTheImport() {
        ObjectNode broken = planningBody();
        broken.remove("planningNotes");
        String json = importFile(broken);
        assertEquals(0, service.validate(json).importableCount());
        var result = service.importContent(new com.deutschbridge.backend.model.dto.ExamContentDtos.ImportRequest(json, List.of(0)));
        assertTrue(result.imported().isEmpty());
        assertEquals("Has validation errors.", result.skipped().get(0).reason());
        verify(repository, never()).save(any());
        assertFalse(service.validate("{ not json").syntaxValid());
    }

    @Test
    void theValidationReportListsChecksForThePart() {
        var checks = service.validate(importFile(photoBody("Einkaufen im Internet"))).checks();
        assertTrue(checks.stream().anyMatch(c -> c.label().contains("A2") && c.label().contains("B1") && c.ok()));
        assertTrue(checks.stream().anyMatch(c -> c.label().contains("picture-description") && c.ok()));
    }
}
