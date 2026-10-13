package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.ExamContentDtos.WritingChoiceSaveResult;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.enums.ExamContentStatus;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import com.deutschbridge.backend.util.ExamExerciseMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Hand-creating and editing a DTZ Schreiben exercise (admin editor) and what a learner may fetch. */
class ExamContentWritingChoiceServiceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
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

    private static ObjectNode task(String label, String situation, String... points) {
        ObjectNode t = MAPPER.createObjectNode();
        t.put("taskLabel", label).put("title", "Titel " + label).put("topic", "Thema " + label).put("communicationType", "FORMAL_EMAIL");
        t.put("situation", situation);
        t.putObject("recipient").put("name", "Herr Schmidt").put("role", "Mitarbeiter");
        t.put("writingInstruction", "Schreiben Sie eine E-Mail an Herrn Schmidt.");
        ArrayNode arr = t.putArray("points");
        for (int i = 0; i < points.length; i++) arr.addObject().put("number", i + 1).put("text", points[i]);
        return t;
    }

    private static ObjectNode body(String title, ObjectNode a, ObjectNode b) {
        ObjectNode body = MAPPER.createObjectNode();
        body.put("title", title);
        body.putArray("tasks").add(a).add(b);
        return body;
    }

    private ObjectNode validBody(String title) {
        return body(title,
                task("A", "Sie möchten an einem Computerkurs teilnehmen und haben Fragen.", "Warum Sie den Kurs machen", "Ihre Erfahrungen", "Termine und Dauer", "Kosten"),
                task("B", "Sie haben ein Problem mit der Heizung in Ihrer Wohnung.", "Grund Ihres Schreibens", "Frühere Versuche", "Weitere Probleme", "Was der Vermieter tun soll"));
    }

    @Test
    void manualCreationSavesADraftWithBothTasks() throws Exception {
        WritingChoiceSaveResult result = service.saveWritingChoice(null, validBody("Alltag schreiben"));

        ArgumentCaptor<ExamExercise> saved = ArgumentCaptor.forClass(ExamExercise.class);
        verify(repository).save(saved.capture());
        ExamExercise e = saved.getValue();
        assertEquals(ExamContentStatus.DRAFT, e.getStatus());
        assertFalse(e.isPublished());
        assertEquals(ExamTaskType.WRITING_TASK_CHOICE, e.getTaskType());
        assertEquals(2, e.getPassages().size());
        assertEquals(ExamContentSpecs.WRITING_CHOICE_INSTRUCTIONS, e.getTeilDescription());
        assertEquals("MANUAL", e.getMetadata().get("source"));
        assertNotNull(result.warnings());
    }

    @Test
    void manualCreationRejectsAnInvalidPointCount() {
        ObjectNode body = validBody("Alltag");
        ((ArrayNode) body.get("tasks").get(0).get("points")).remove(0);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.saveWritingChoice(null, body));
        assertTrue(ex.getMessage().contains("four") || ex.getMessage().contains("4"), ex.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void editingReplacesTheEightPointsAndBumpsTheVersion() throws Exception {
        service.saveWritingChoice(null, validBody("Alltag"));
        ArgumentCaptor<ExamExercise> created = ArgumentCaptor.forClass(ExamExercise.class);
        verify(repository).save(created.capture());
        ExamExercise existing = created.getValue();
        existing.setId("ex1");
        when(repository.findById("ex1")).thenReturn(Optional.of(existing));
        int versionBefore = existing.getVersion();

        ObjectNode edited = body("Neuer Titel",
                task("A", "Sie möchten an einem Kochkurs teilnehmen und haben Fragen.", "Neuer Punkt 1", "Neuer Punkt 2", "Neuer Punkt 3", "Neuer Punkt 4"),
                task("B", "Sie haben ein Problem mit dem Lärm im Haus.", "Punkt 5", "Punkt 6", "Punkt 7", "Punkt 8"));
        service.saveWritingChoice("ex1", edited);

        assertEquals("Neuer Titel", existing.getTitle());
        assertEquals(versionBefore + 1, existing.getVersion());
        assertTrue(existing.getPassages().get(0).getContent().contains("Neuer Punkt 4"));
        assertTrue(existing.getPassages().get(1).getContent().contains("Punkt 8"));
        assertNull(ExamContentService.writingChoiceProblem(existing));
    }

    @Test
    void editingAnotherKindOfExerciseIsRefused() {
        ExamExercise other = new ExamExercise();
        other.setId("ex2");
        other.setTaskType(ExamTaskType.WRITING_TASK);
        when(repository.findById("ex2")).thenReturn(Optional.of(other));
        assertThrows(IllegalArgumentException.class, () -> service.saveWritingChoice("ex2", validBody("x")));
    }

    @Test
    void learnerResponseCarriesBothTasksButNoAdminMetadata() throws Exception {
        service.saveWritingChoice(null, validBody("Alltag"));
        ArgumentCaptor<ExamExercise> created = ArgumentCaptor.forClass(ExamExercise.class);
        verify(repository).save(created.capture());
        ExamExercise e = created.getValue();
        e.setId("ex9");
        e.applyStatus(ExamContentStatus.PUBLISHED);

        var publicResponse = ExamExerciseMapper.mapToPublicResponse(e);
        assertNotNull(publicResponse.writingChoice());
        assertEquals(2, ((java.util.List<?>) publicResponse.writingChoice().get("tasks")).size());
        assertNull(publicResponse.modelSolution());
        assertFalse(publicResponse.writingChoice().containsKey("source"));
    }
}
