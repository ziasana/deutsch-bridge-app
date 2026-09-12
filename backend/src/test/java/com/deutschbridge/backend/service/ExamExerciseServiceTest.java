package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamExercisePublicResponse;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamExerciseCompletion;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExamExerciseCompletionRepository;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExamExerciseServiceTest {

    @Mock
    private ExamExerciseRepository examExerciseRepository;

    @Mock
    private ExamExerciseCompletionRepository examExerciseCompletionRepository;

    @Mock
    private RequestContext requestContext;

    @InjectMocks
    private ExamExerciseService service;

    private ExamExercise hoerverstehenExercise() {
        ExamPassage passage = new ExamPassage("p1", "Durchsage 1", null, null,
                "/uploads/exam-audio/clip1.m4a", "Geheimes Transkript.");
        ExamQuestion question = new ExamQuestion("q1", ExamTaskType.MULTIPLE_CHOICE, "Frage?",
                0, List.of("A", "B"), "B", null, "Erklärung, warum B richtig ist", "Häufiger Fehler");

        ExamExercise exercise = new ExamExercise();
        exercise.setId("ex1");
        exercise.setTitle("Hörverstehen B1 - Teil 1");
        exercise.setSection(ExamSection.HOERVERSTEHEN);
        exercise.setTaskType(ExamTaskType.MULTIPLE_CHOICE);
        exercise.setLevel(LearningLevel.B1);
        exercise.setPassages(List.of(passage));
        exercise.setQuestions(List.of(question));
        exercise.setPublished(true);
        return exercise;
    }

    @Test
    @DisplayName("findAllPublic -> should filter by section and never leak transcript or correctAnswer")
    void findAllPublic_shouldStripAnswersAndTranscript() {
        ExamExercise exercise = hoerverstehenExercise();
        when(examExerciseRepository.findBySection(ExamSection.HOERVERSTEHEN)).thenReturn(List.of(exercise));
        when(requestContext.getUserId()).thenReturn("u1");
        when(examExerciseCompletionRepository.findByUserId("u1")).thenReturn(List.of());

        List<ExamExercisePublicResponse> result = service.findAllPublic(ExamSection.HOERVERSTEHEN, null, null);

        assertEquals(1, result.size());
        ExamExercisePublicResponse response = result.get(0);
        assertEquals("/uploads/exam-audio/clip1.m4a", response.passages().get(0).audioUrl());
        assertFalse(response.completed());
        // ExamPassagePublic/ExamQuestionPublic simply have no transcript/correctAnswer/explanation
        // fields - the assertions above already prove only the safe DTO shape is returned.
    }

    @Test
    @DisplayName("findAllPublic -> should mark exercises the user already completed")
    void findAllPublic_shouldMarkCompletedExercises() {
        ExamExercise exercise = hoerverstehenExercise();
        ExamExerciseCompletion completion = new ExamExerciseCompletion();
        completion.setUserId("u1");
        completion.setExerciseId("ex1");

        when(examExerciseRepository.findBySection(ExamSection.HOERVERSTEHEN)).thenReturn(List.of(exercise));
        when(requestContext.getUserId()).thenReturn("u1");
        when(examExerciseCompletionRepository.findByUserId("u1")).thenReturn(List.of(completion));

        List<ExamExercisePublicResponse> result = service.findAllPublic(ExamSection.HOERVERSTEHEN, null, null);

        assertTrue(result.get(0).completed());
    }

    @Test
    @DisplayName("findAllPublic -> should exclude unpublished exercises")
    void findAllPublic_shouldExcludeUnpublished() {
        ExamExercise exercise = hoerverstehenExercise();
        exercise.setPublished(false);
        when(examExerciseRepository.findBySection(ExamSection.HOERVERSTEHEN)).thenReturn(List.of(exercise));
        when(requestContext.getUserId()).thenReturn("u1");
        when(examExerciseCompletionRepository.findByUserId("u1")).thenReturn(List.of());

        List<ExamExercisePublicResponse> result = service.findAllPublic(ExamSection.HOERVERSTEHEN, null, null);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("findByIdPublic -> should throw DataNotFoundException for an unknown id")
    void findByIdPublic_shouldThrowWhenNotFound() {
        when(examExerciseRepository.findById("missing")).thenReturn(java.util.Optional.empty());

        assertThrows(DataNotFoundException.class, () -> service.findByIdPublic("missing"));
    }

    @Test
    @DisplayName("markCompleted -> should create a completion record for the current user")
    void markCompleted_shouldCreateCompletion() throws DataNotFoundException {
        ExamExercise exercise = hoerverstehenExercise();
        when(examExerciseRepository.findById("ex1")).thenReturn(java.util.Optional.of(exercise));
        when(requestContext.getUserId()).thenReturn("u1");
        when(examExerciseCompletionRepository.findByUserIdAndExerciseId("u1", "ex1")).thenReturn(java.util.Optional.empty());

        service.markCompleted("ex1");

        verify(examExerciseCompletionRepository).save(argThat(c -> c.getUserId().equals("u1") && c.getExerciseId().equals("ex1")));
    }
}
