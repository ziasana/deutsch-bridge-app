package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.CompleteExamAttemptRequest;
import com.deutschbridge.backend.model.dto.ExamAnswerFeedbackResponse;
import com.deutschbridge.backend.model.dto.ExamAttemptResultResponse;
import com.deutschbridge.backend.model.dto.StartExamAttemptResponse;
import com.deutschbridge.backend.model.dto.SubmitExamAnswerRequest;
import com.deutschbridge.backend.model.entity.ExamAnswerRecord;
import com.deutschbridge.backend.model.entity.ExamAttempt;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExamAttemptRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Covers the Hoerverstehen listening flow (audio passages + per-question transcript reveal),
 * reusing the same start/submitAnswer/complete contract as Leseverstehen.
 */
@ExtendWith(MockitoExtension.class)
class ExamAttemptServiceTest {

    @Mock
    private ExamAttemptRepository attemptRepository;

    @Mock
    private ExamExerciseService examExerciseService;

    @Mock
    private UserService userService;

    @Mock
    private RequestContext requestContext;

    @InjectMocks
    private ExamAttemptService service;

    private User createUser() {
        User user = new User();
        user.setId("u1");
        user.setEmail("test@mail.com");
        return user;
    }

    private ExamPassage audioPassage(String transcript) {
        ExamPassage passage = new ExamPassage("p1", "Durchsage 1", null, null,
                "/uploads/exam-audio/clip1.m4a", transcript);
        return passage;
    }

    private ExamQuestion mcQuestion(Integer sectionIndex, String correctAnswer) {
        return new ExamQuestion("q1", ExamTaskType.MULTIPLE_CHOICE, "Was erfahren die Fahrgäste?",
                sectionIndex, List.of("A", "B", "C"), correctAnswer, null,
                "Erklärung", "Häufiger Fehler");
    }

    private ExamExercise hoerverstehenExercise(ExamPassage passage, ExamQuestion question) {
        ExamExercise exercise = new ExamExercise();
        exercise.setId("ex1");
        exercise.setSection(ExamSection.HOERVERSTEHEN);
        exercise.setTaskType(ExamTaskType.MULTIPLE_CHOICE);
        exercise.setLevel(LearningLevel.B1);
        exercise.setPassages(List.of(passage));
        exercise.setQuestions(List.of(question));
        return exercise;
    }

    // ---------------------------------------------------------------
    // start
    // ---------------------------------------------------------------
    @Test
    @DisplayName("start -> should expose audioUrl but never the transcript before answering")
    void start_shouldExposeAudioButNotTranscript() throws DataNotFoundException {
        User user = createUser();
        ExamPassage passage = audioPassage("Geheimes Transkript, das erst nach der Antwort erscheinen darf.");
        ExamExercise exercise = hoerverstehenExercise(passage, mcQuestion(0, "B"));

        when(requestContext.getUserEmail()).thenReturn(user.getEmail());
        when(userService.findByEmail(user.getEmail())).thenReturn(user);
        when(examExerciseService.findById("ex1")).thenReturn(exercise);
        when(attemptRepository.save(any())).thenAnswer(inv -> {
            ExamAttempt attempt = inv.getArgument(0);
            attempt.setId("attempt1");
            return attempt;
        });

        StartExamAttemptResponse response = service.start("ex1");

        assertEquals("attempt1", response.attemptId());
        assertEquals(1, response.passages().size());
        assertEquals("/uploads/exam-audio/clip1.m4a", response.passages().get(0).audioUrl());
        // ExamPassagePublic has no transcript field at all - structurally impossible to leak it here.
        assertEquals("Was erfahren die Fahrgäste?", response.questions().get(0).prompt());
    }

    // ---------------------------------------------------------------
    // submitAnswer
    // ---------------------------------------------------------------
    @Test
    @DisplayName("submitAnswer -> correct answer should reveal the referenced passage's transcript")
    void submitAnswer_shouldRevealTranscriptOnCorrectAnswer() throws DataNotFoundException {
        ExamPassage passage = audioPassage("Der Zug hat fünfzehn Minuten Verspätung.");
        ExamExercise exercise = hoerverstehenExercise(passage, mcQuestion(0, "B"));
        ExamAttempt attempt = new ExamAttempt();
        attempt.setId("attempt1");
        attempt.setExercise(exercise);
        attempt.setAnswers(new ArrayList<>());

        when(attemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));

        ExamAnswerFeedbackResponse feedback = service.submitAnswer("attempt1", new SubmitExamAnswerRequest("q1", "B"));

        assertTrue(feedback.correct());
        assertEquals("B", feedback.correctAnswer());
        assertEquals("Der Zug hat fünfzehn Minuten Verspätung.", feedback.transcript());
        assertEquals(1, attempt.getAnswers().size());
        assertEquals("Der Zug hat fünfzehn Minuten Verspätung.", attempt.getAnswers().get(0).getTranscript());
        verify(attemptRepository).save(attempt);
    }

    @Test
    @DisplayName("submitAnswer -> wrong answer should still reveal the correct answer and transcript")
    void submitAnswer_shouldRevealFeedbackOnWrongAnswer() throws DataNotFoundException {
        ExamPassage passage = audioPassage("Transkripttext.");
        ExamExercise exercise = hoerverstehenExercise(passage, mcQuestion(0, "B"));
        ExamAttempt attempt = new ExamAttempt();
        attempt.setId("attempt1");
        attempt.setExercise(exercise);
        attempt.setAnswers(new ArrayList<>());

        when(attemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));

        ExamAnswerFeedbackResponse feedback = service.submitAnswer("attempt1", new SubmitExamAnswerRequest("q1", "A"));

        assertFalse(feedback.correct());
        assertEquals("B", feedback.correctAnswer());
        assertEquals("Transkripttext.", feedback.transcript());
    }

    @Test
    @DisplayName("submitAnswer -> question without a referenced passage should not return a transcript")
    void submitAnswer_shouldReturnNullTranscriptWhenNoSectionIndex() throws DataNotFoundException {
        ExamPassage passage = audioPassage("Nicht relevant.");
        ExamExercise exercise = hoerverstehenExercise(passage, mcQuestion(null, "B"));
        ExamAttempt attempt = new ExamAttempt();
        attempt.setId("attempt1");
        attempt.setExercise(exercise);
        attempt.setAnswers(new ArrayList<>());

        when(attemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));

        ExamAnswerFeedbackResponse feedback = service.submitAnswer("attempt1", new SubmitExamAnswerRequest("q1", "B"));

        assertNull(feedback.transcript());
    }

    @Test
    @DisplayName("submitAnswer -> unknown question id should throw DataNotFoundException")
    void submitAnswer_shouldThrowWhenQuestionNotFound() {
        ExamPassage passage = audioPassage("x");
        ExamExercise exercise = hoerverstehenExercise(passage, mcQuestion(0, "B"));
        ExamAttempt attempt = new ExamAttempt();
        attempt.setId("attempt1");
        attempt.setExercise(exercise);
        attempt.setAnswers(new ArrayList<>());

        when(attemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));

        assertThrows(DataNotFoundException.class,
                () -> service.submitAnswer("attempt1", new SubmitExamAnswerRequest("does-not-exist", "B")));
    }

    @Test
    @DisplayName("submitAnswer -> unknown attempt id should throw DataNotFoundException")
    void submitAnswer_shouldThrowWhenAttemptNotFound() {
        when(attemptRepository.findById("missing")).thenReturn(Optional.empty());

        assertThrows(DataNotFoundException.class,
                () -> service.submitAnswer("missing", new SubmitExamAnswerRequest("q1", "B")));
    }

    @Test
    @DisplayName("submitAnswer -> should reject answers on an already-completed attempt")
    void submitAnswer_shouldRejectOnCompletedAttempt() {
        ExamPassage passage = audioPassage("x");
        ExamExercise exercise = hoerverstehenExercise(passage, mcQuestion(0, "B"));
        ExamAttempt attempt = new ExamAttempt();
        attempt.setId("attempt1");
        attempt.setExercise(exercise);
        attempt.setAnswers(new ArrayList<>());
        attempt.setCompletedAt(LocalDateTime.now());

        when(attemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));

        assertThrows(IllegalArgumentException.class,
                () -> service.submitAnswer("attempt1", new SubmitExamAnswerRequest("q1", "B")));
        verify(attemptRepository, never()).save(any());
    }

    // ---------------------------------------------------------------
    // complete
    // ---------------------------------------------------------------
    @Test
    @DisplayName("complete -> should compute the percentage score from recorded answers")
    void complete_shouldComputeScore() throws DataNotFoundException {
        ExamPassage passage = audioPassage("x");
        ExamQuestion q1 = mcQuestion(0, "B");
        ExamQuestion q2 = new ExamQuestion("q2", ExamTaskType.MULTIPLE_CHOICE, "Frage 2", 0, List.of("A", "B"), "A", null, null, null);
        ExamExercise exercise = hoerverstehenExercise(passage, q1);
        exercise.setQuestions(List.of(q1, q2));

        ExamAttempt attempt = new ExamAttempt();
        attempt.setId("attempt1");
        attempt.setExercise(exercise);
        attempt.setAnswers(List.of(
                new ExamAnswerRecord("q1", "B", true, "expl", "mistake", "transcript"),
                new ExamAnswerRecord("q2", "B", false, "expl", "mistake", "transcript")
        ));

        when(attemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));
        when(attemptRepository.save(attempt)).thenReturn(attempt);

        ExamAttemptResultResponse result = service.complete("attempt1", new CompleteExamAttemptRequest());

        assertEquals("attempt1", result.attemptId());
        assertEquals(50.0, result.score());
        assertNotNull(attempt.getCompletedAt());
        assertEquals(2, result.answerBreakdown().size());
    }

    @Test
    @DisplayName("complete -> should reject completing an already-completed attempt")
    void complete_shouldRejectOnCompletedAttempt() {
        ExamPassage passage = audioPassage("x");
        ExamExercise exercise = hoerverstehenExercise(passage, mcQuestion(0, "B"));
        ExamAttempt attempt = new ExamAttempt();
        attempt.setId("attempt1");
        attempt.setExercise(exercise);
        attempt.setAnswers(new ArrayList<>());
        attempt.setCompletedAt(LocalDateTime.now());

        when(attemptRepository.findById("attempt1")).thenReturn(Optional.of(attempt));

        assertThrows(IllegalArgumentException.class,
                () -> service.complete("attempt1", new CompleteExamAttemptRequest()));
        verify(attemptRepository, never()).save(any());
    }
}
