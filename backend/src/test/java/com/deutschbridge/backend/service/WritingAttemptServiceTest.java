package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.AiGenerationException;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.WritingAttemptRequest;
import com.deutschbridge.backend.model.dto.WritingAttemptResponse;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.WritingAttempt;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.WritingMode;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import com.deutschbridge.backend.repository.WritingAttemptRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WritingAttemptServiceTest {

    @Mock private WritingAttemptRepository attemptRepository;
    @Mock private ExamExerciseRepository exerciseRepository;
    @Mock private RequestContext requestContext;
    @Mock private WritingPhraseRepository phraseRepository;
    @Mock private OllamaService ollamaService;

    private WritingAttemptService service;

    @BeforeEach
    void setUp() {
        service = new WritingAttemptService(attemptRepository, exerciseRepository, requestContext, new ObjectMapper(), new WritingFeedbackAnalyzer(), phraseRepository, ollamaService);
        when(requestContext.getUserId()).thenReturn("u1");
        when(attemptRepository.save(any(WritingAttempt.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private ExamExercise writingExercise() {
        ExamExercise e = new ExamExercise();
        e.setId("ex1");
        e.setSection(ExamSection.SCHRIFTLICHER_AUSDRUCK);
        e.setLevel(LearningLevel.B1);
        return e;
    }

    @Test
    @DisplayName("submit -> stores trimmed text, word count and next attempt number")
    void submit_storesAttempt() throws DataNotFoundException {
        when(exerciseRepository.findById("ex1")).thenReturn(Optional.of(writingExercise()));
        when(attemptRepository.countByUserIdAndExerciseId("u1", "ex1")).thenReturn(1);

        WritingAttemptResponse res = service.submit(new WritingAttemptRequest(
                "ex1", "  Liebe Anna,  vielen Dank.  ", WritingMode.PRACTICE, List.of("Stichwort", ""), null));

        assertEquals("Liebe Anna,  vielen Dank.", res.text());
        assertEquals(4, res.wordCount());
        assertEquals(2, res.attemptNumber());
        assertEquals(List.of("Stichwort", ""), res.planNotes());
    }

    @Test
    @DisplayName("submit -> rejects blank text")
    void submit_rejectsBlank() {
        when(exerciseRepository.findById("ex1")).thenReturn(Optional.of(writingExercise()));
        assertThrows(ResponseStatusException.class,
                () -> service.submit(new WritingAttemptRequest("ex1", "   ", WritingMode.EXAM, null, null)));
        verify(attemptRepository, never()).save(any());
    }

    @Test
    @DisplayName("submit -> rejects non-writing exercises")
    void submit_rejectsOtherSections() {
        ExamExercise e = writingExercise();
        e.setSection(ExamSection.LESEVERSTEHEN);
        when(exerciseRepository.findById("ex1")).thenReturn(Optional.of(e));
        assertThrows(ResponseStatusException.class,
                () -> service.submit(new WritingAttemptRequest("ex1", "Text", WritingMode.EXAM, null, null)));
    }

    private static final String PRIMARY_TEXT = "Sehr geehrte Frau Becker, ich habe eine Frage zum Kurs.";

    /** A DTZ Schreiben exercise with the tasks A and B stored the way the importer stores them. */
    private ExamExercise choiceExercise(boolean published) {
        ExamExercise e = writingExercise();
        e.setTaskType(ExamTaskType.WRITING_TASK_CHOICE);
        e.setPublished(published);
        java.util.function.BiFunction<String, List<String>, java.util.Map<String, Object>> task = (label, points) -> {
            java.util.Map<String, Object> t = new java.util.LinkedHashMap<>();
            t.put("taskLabel", label);
            t.put("title", "Aufgabe " + label);
            t.put("situation", "Eine Situation für " + label);
            t.put("writingInstruction", "Schreiben Sie eine E-Mail.");
            List<java.util.Map<String, Object>> pts = new java.util.ArrayList<>();
            for (int i = 0; i < points.size(); i++) pts.add(java.util.Map.of("number", i + 1, "text", points.get(i)));
            t.put("points", pts);
            return t;
        };
        e.setMetadata(java.util.Map.of("writingChoice", java.util.Map.of("durationMinutes", 30, "tasks", List.of(
                task.apply("A", List.of("Grund", "Erfahrung", "Termine", "Kosten")),
                task.apply("B", List.of("Anlass", "Ort", "Mitbringen", "Anfahrt"))))));
        e.setPassages(List.of(
                new com.deutschbridge.backend.model.entity.ExamPassage("pa", "Aufgabe A", "<p>Text A</p>", null, null, null),
                new com.deutschbridge.backend.model.entity.ExamPassage("pb", "Aufgabe B", "<p>Text B</p>", null, null, null)));
        return e;
    }

    @Test
    @DisplayName("submit (DTZ Schreiben) -> stores the chosen alternative with the response")
    void submit_choice_storesSelectedTask() throws DataNotFoundException {
        when(exerciseRepository.findById("ex1")).thenReturn(Optional.of(choiceExercise(true)));

        WritingAttemptResponse res = service.submit(new WritingAttemptRequest("ex1", PRIMARY_TEXT, WritingMode.EXAM, null, null, "b"));

        assertEquals("B", res.selectedTask());
        assertEquals(PRIMARY_TEXT, res.text());
        org.mockito.ArgumentCaptor<WritingAttempt> saved = org.mockito.ArgumentCaptor.forClass(WritingAttempt.class);
        verify(attemptRepository).save(saved.capture());
        assertEquals("B", saved.getValue().getSelectedTask());
    }

    @Test
    @DisplayName("submit (DTZ Schreiben) -> a task must be chosen, and it must be A or B")
    void submit_choice_validatesLabel() {
        when(exerciseRepository.findById("ex1")).thenReturn(Optional.of(choiceExercise(true)));

        assertThrows(ResponseStatusException.class, () -> service.submit(new WritingAttemptRequest("ex1", PRIMARY_TEXT, WritingMode.EXAM, null, null, null)));
        assertThrows(ResponseStatusException.class, () -> service.submit(new WritingAttemptRequest("ex1", PRIMARY_TEXT, WritingMode.EXAM, null, null, " ")));
        assertThrows(ResponseStatusException.class, () -> service.submit(new WritingAttemptRequest("ex1", PRIMARY_TEXT, WritingMode.EXAM, null, null, "C")));
        verify(attemptRepository, never()).save(any());
    }

    @Test
    @DisplayName("submit (DTZ Schreiben) -> an unpublished (draft) exercise cannot be answered")
    void submit_choice_rejectsDraft() {
        when(exerciseRepository.findById("ex1")).thenReturn(Optional.of(choiceExercise(false)));

        assertThrows(DataNotFoundException.class, () -> service.submit(new WritingAttemptRequest("ex1", PRIMARY_TEXT, WritingMode.EXAM, null, null, "A")));
        verify(attemptRepository, never()).save(any());
    }

    @Test
    @DisplayName("submit -> single-task exercises never carry a selected task")
    void submit_singleTask_ignoresLabel() throws DataNotFoundException {
        when(exerciseRepository.findById("ex1")).thenReturn(Optional.of(writingExercise()));

        WritingAttemptResponse res = service.submit(new WritingAttemptRequest("ex1", "Liebe Anna, danke.", WritingMode.EXAM, null, null, "A"));

        assertNull(res.selectedTask());
    }

    @Test
    @DisplayName("requestAiFeedback (DTZ Schreiben) -> uses the chosen task's text and points")
    void aiFeedback_choice_usesChosenTask() throws DataNotFoundException {
        WritingAttempt a = storedAttempt("u1");
        a.setSelectedTask("B");
        when(attemptRepository.findById("a1")).thenReturn(Optional.of(a));
        when(exerciseRepository.findById("ex1")).thenReturn(Optional.of(choiceExercise(true)));
        when(ollamaService.evaluateWriting(any(), any(), any(), any())).thenReturn("POSITIVE|Gut.");

        service.requestAiFeedback("a1");

        verify(ollamaService).evaluateWriting(any(), org.mockito.ArgumentMatchers.eq("Text B"),
                org.mockito.ArgumentMatchers.eq(List.of("Anlass", "Ort", "Mitbringen", "Anfahrt")), any());
    }

    private WritingAttempt storedAttempt(String owner) {
        WritingAttempt a = new WritingAttempt();
        a.setId("a1");
        a.setUserId(owner);
        a.setExerciseId("ex1");
        a.setMode(WritingMode.PRACTICE);
        a.setText("Liebe Anna, ich kommen morgen.");
        return a;
    }

    @Test
    @DisplayName("requestAiFeedback -> parses and stores the AI answer")
    void aiFeedback_storesParsedResult() throws DataNotFoundException {
        when(attemptRepository.findById("a1")).thenReturn(Optional.of(storedAttempt("u1")));
        when(exerciseRepository.findById("ex1")).thenReturn(Optional.of(writingExercise()));
        when(ollamaService.evaluateWriting(any(), any(), any(), any()))
                .thenReturn("POSITIVE|Gute Anrede.\nGRAMMAR|ich kommen => ich komme | Verb konjugieren");

        WritingAttemptResponse res = service.requestAiFeedback("a1");

        assertEquals(List.of("Gute Anrede."), res.aiFeedback().positives());
        assertEquals("ich komme", res.aiFeedback().grammar().get(0).corrected());
    }

    @Test
    @DisplayName("requestAiFeedback -> a second request does not call the AI again")
    void aiFeedback_isIdempotent() throws DataNotFoundException {
        WritingAttempt a = storedAttempt("u1");
        a.setAiFeedback("{\"positives\":[\"ok\"],\"missingPoints\":[],\"grammar\":[],\"vocabulary\":[],\"structure\":[],\"improvementExample\":null}");
        when(attemptRepository.findById("a1")).thenReturn(Optional.of(a));

        service.requestAiFeedback("a1");

        verify(ollamaService, never()).evaluateWriting(any(), any(), any(), any());
    }

    @Test
    @DisplayName("requestAiFeedback -> other users' attempts are not found")
    void aiFeedback_rejectsForeignAttempt() {
        when(attemptRepository.findById("a1")).thenReturn(Optional.of(storedAttempt("someone-else")));
        assertThrows(DataNotFoundException.class, () -> service.requestAiFeedback("a1"));
    }

    @Test
    @DisplayName("requestAiFeedback -> an unreadable AI answer is reported, nothing is saved")
    void aiFeedback_unreadableAnswer() {
        when(attemptRepository.findById("a1")).thenReturn(Optional.of(storedAttempt("u1")));
        when(exerciseRepository.findById("ex1")).thenReturn(Optional.of(writingExercise()));
        when(ollamaService.evaluateWriting(any(), any(), any(), any())).thenReturn("Sorry, I cannot help.");

        assertThrows(AiGenerationException.class, () -> service.requestAiFeedback("a1"));
        verify(attemptRepository, never()).save(any());
    }

    @Test
    @DisplayName("progress -> counts attempts, revisions and the most frequent open dimensions")
    void progress_aggregates() {
        WritingAttempt first = storedAttempt("u1");
        first.setWordCount(10);
        first.setFeedback(feedbackJson("STRUCTURE", "IMPROVE"));
        WritingAttempt second = storedAttempt("u1");
        second.setId("a2");
        second.setWordCount(20);
        second.setParentAttemptId("a1");
        second.setFeedback(feedbackJson("STRUCTURE", "OK"));
        when(attemptRepository.findByUserIdOrderBySubmittedAtDesc("u1")).thenReturn(List.of(second, first));

        var progress = service.progress();

        assertEquals(2, progress.attemptsCount());
        assertEquals(1, progress.exercisesWritten());
        assertEquals(1, progress.revisedTexts());
        assertEquals(30, progress.totalWords());
        assertEquals("STRUCTURE", progress.topIssues().get(0).key());
        assertEquals(2, progress.topIssues().get(0).count());
    }

    private String feedbackJson(String key, String status) {
        return "{\"source\":\"RULES\",\"dimensions\":[{\"key\":\"" + key + "\",\"title\":\"Textaufbau\",\"status\":\"" + status
                + "\",\"positives\":[],\"improvements\":[\"x\"]}],\"highlights\":[],\"nextFocus\":[],"
                + "\"stats\":{\"wordCount\":1,\"sentenceCount\":1,\"paragraphCount\":1,\"connectorCount\":0,\"usedPhrases\":[],\"uncoveredLeitpunkte\":[]}}";
    }
}
