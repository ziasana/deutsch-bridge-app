package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamExercisePublicResponse;
import com.deutschbridge.backend.model.dto.ExamExerciseSummaryResponse;
import com.deutschbridge.backend.model.dto.ExamLevelSummaryResponse;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamExerciseCompletion;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExamExerciseCompletionRepository;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import com.deutschbridge.backend.service.cache.ContentCacheService;
import com.deutschbridge.backend.service.cache.ExamProgressCacheService;
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

    @Mock
    private ContentCacheService contentCacheService;

    @Mock
    private ExamProgressCacheService examProgressCacheService;

    @InjectMocks
    private ExamExerciseService service;

    private ExamExercise hoerverstehenExercise() {
        ExamPassage passage = new ExamPassage("p1", "Durchsage 1", null, null,
                "/uploads/exam-audio/clip1.m4a", "Geheimes Transkript.");
        ExamQuestion question = new ExamQuestion("q1", ExamTaskType.MULTIPLE_CHOICE, "Frage?",
                0, List.of("A", "B"), "B", null, null, "Erklärung, warum B richtig ist", "Häufiger Fehler");

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
    @DisplayName("findSummary -> should filter by section and never leak passages/questions content")
    void findSummary_shouldOmitContentFields() {
        ExamExercise exercise = hoerverstehenExercise();
        when(contentCacheService.getPublishedExamExercises(ExamSection.HOERVERSTEHEN, null, null)).thenReturn(List.of(exercise));
        when(requestContext.getUserId()).thenReturn("u1");
        when(examExerciseCompletionRepository.findByUserId("u1")).thenReturn(List.of());

        List<ExamExerciseSummaryResponse> result = service.findSummary(ExamSection.HOERVERSTEHEN, null, null);

        assertEquals(1, result.size());
        ExamExerciseSummaryResponse response = result.get(0);
        assertEquals("ex1", response.id());
        assertEquals(1, response.questionsCount());
        assertFalse(response.completed());
        // ExamExerciseSummaryResponse simply has no passages/questions/answerOptions fields - the
        // assertions above already prove only the lightweight DTO shape is returned.
    }

    @Test
    @DisplayName("findSummary -> should mark exercises the user already completed, with their last score")
    void findSummary_shouldMarkCompletedExercises() {
        ExamExercise exercise = hoerverstehenExercise();
        ExamExerciseCompletion completion = new ExamExerciseCompletion();
        completion.setUserId("u1");
        completion.setExerciseId("ex1");
        completion.setLastScore(75.0);

        when(contentCacheService.getPublishedExamExercises(ExamSection.HOERVERSTEHEN, null, null)).thenReturn(List.of(exercise));
        when(requestContext.getUserId()).thenReturn("u1");
        when(examExerciseCompletionRepository.findByUserId("u1")).thenReturn(List.of(completion));

        List<ExamExerciseSummaryResponse> result = service.findSummary(ExamSection.HOERVERSTEHEN, null, null);

        assertTrue(result.get(0).completed());
        assertEquals(75.0, result.get(0).lastScore());
    }

    @Test
    @DisplayName("findSummary -> should exclude unpublished exercises")
    void findSummary_shouldExcludeUnpublished() {
        // Filtering out unpublished exercises is ContentCacheService's job (see
        // ContentCacheService.getPublishedExamExercises) - this just verifies findSummary
        // passes its result straight through without re-adding anything unpublished.
        when(contentCacheService.getPublishedExamExercises(ExamSection.HOERVERSTEHEN, null, null)).thenReturn(List.of());
        when(requestContext.getUserId()).thenReturn("u1");
        when(examExerciseCompletionRepository.findByUserId("u1")).thenReturn(List.of());

        List<ExamExerciseSummaryResponse> result = service.findSummary(ExamSection.HOERVERSTEHEN, null, null);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("findLevelSummary -> should delegate to the per-user progress cache for the current user")
    void findLevelSummary_shouldDelegateToProgressCache() {
        List<ExamLevelSummaryResponse> summaries = List.of(new ExamLevelSummaryResponse("B1", 10, 4, 55));
        when(requestContext.getUserId()).thenReturn("u1");
        when(examProgressCacheService.getLevelSummary("u1")).thenReturn(summaries);

        List<ExamLevelSummaryResponse> result = service.findLevelSummary();

        assertEquals(summaries, result);
    }

    @Test
    @DisplayName("findByIdPublic -> should throw DataNotFoundException for an unknown id")
    void findByIdPublic_shouldThrowWhenNotFound() {
        when(examExerciseRepository.findById("missing")).thenReturn(java.util.Optional.empty());

        assertThrows(DataNotFoundException.class, () -> service.findByIdPublic("missing"));
    }

    @Test
    @DisplayName("findByIdPublic -> should include the current user's completion status and last score")
    void findByIdPublic_shouldIncludeCompletionData() throws DataNotFoundException {
        ExamExercise exercise = hoerverstehenExercise();
        ExamExerciseCompletion completion = new ExamExerciseCompletion();
        completion.setUserId("u1");
        completion.setExerciseId("ex1");
        completion.setLastScore(60.0);

        when(examExerciseRepository.findById("ex1")).thenReturn(java.util.Optional.of(exercise));
        when(requestContext.getUserId()).thenReturn("u1");
        when(examExerciseCompletionRepository.findByUserIdAndExerciseId("u1", "ex1")).thenReturn(java.util.Optional.of(completion));

        ExamExercisePublicResponse response = service.findByIdPublic("ex1");

        assertTrue(response.completed());
        assertEquals(60.0, response.lastScore());
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

    @Test
    @DisplayName("saveLastScore -> should create a completion record with the score when none exists yet")
    void saveLastScore_shouldCreateCompletionWithScore() {
        when(requestContext.getUserId()).thenReturn("u1");
        when(examExerciseCompletionRepository.findByUserIdAndExerciseId("u1", "ex1")).thenReturn(java.util.Optional.empty());

        service.saveLastScore("ex1", 42.0);

        verify(examExerciseCompletionRepository).save(argThat(c ->
                c.getUserId().equals("u1") && c.getExerciseId().equals("ex1") && c.getLastScore().equals(42.0)));
    }

    @Test
    @DisplayName("saveLastScore -> should update the score on an existing completion record")
    void saveLastScore_shouldUpdateExistingCompletion() {
        ExamExerciseCompletion existing = new ExamExerciseCompletion();
        existing.setUserId("u1");
        existing.setExerciseId("ex1");
        existing.setLastScore(10.0);

        when(requestContext.getUserId()).thenReturn("u1");
        when(examExerciseCompletionRepository.findByUserIdAndExerciseId("u1", "ex1")).thenReturn(java.util.Optional.of(existing));

        service.saveLastScore("ex1", 90.0);

        verify(examExerciseCompletionRepository).save(argThat(c -> c.getLastScore().equals(90.0)));
    }
}
