package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamAnswerFeedbackResponse;
import com.deutschbridge.backend.model.dto.ExamAttemptResultResponse;
import com.deutschbridge.backend.model.dto.CompleteExamAttemptRequest;
import com.deutschbridge.backend.model.dto.ExamPassagePublic;
import com.deutschbridge.backend.model.dto.ExamQuestionPublic;
import com.deutschbridge.backend.model.dto.StartExamAttemptResponse;
import com.deutschbridge.backend.model.dto.SubmitExamAnswerRequest;
import com.deutschbridge.backend.model.entity.ExamAnswerRecord;
import com.deutschbridge.backend.model.entity.ExamAttempt;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.ExamAttemptRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Runs the exam exercise attempt flow, mirroring ReadingAttemptService's start/submitAnswer/complete
 * shape: the exercise's own stored questions are the source of truth for grading, never the client.
 */
@Service
public class ExamAttemptService {

    private static final String ATTEMPT_NOT_FOUND_MSG = "Exam attempt not found!";
    private static final String QUESTION_NOT_FOUND_MSG = "Exam question not found!";

    private final ExamAttemptRepository attemptRepository;
    private final ExamExerciseService examExerciseService;
    private final UserService userService;
    private final RequestContext requestContext;

    public ExamAttemptService(ExamAttemptRepository attemptRepository,
                               ExamExerciseService examExerciseService,
                               UserService userService,
                               RequestContext requestContext) {
        this.attemptRepository = attemptRepository;
        this.examExerciseService = examExerciseService;
        this.userService = userService;
        this.requestContext = requestContext;
    }

    public StartExamAttemptResponse start(String exerciseId) throws DataNotFoundException {
        User user = userService.findByEmail(requestContext.getUserEmail());
        ExamExercise exercise = examExerciseService.findById(exerciseId);

        ExamAttempt attempt = new ExamAttempt();
        attempt.setUser(user);
        attempt.setExercise(exercise);
        attempt = attemptRepository.save(attempt);

        List<ExamPassage> passages = exercise.getPassages() != null ? exercise.getPassages() : List.of();
        List<ExamQuestion> questions = exercise.getQuestions() != null ? exercise.getQuestions() : List.of();

        List<ExamPassagePublic> passagesPublic = passages.stream()
                .map(p -> new ExamPassagePublic(p.getId(), p.getLabel(), p.getContent(), p.getImageUrl()))
                .toList();
        List<ExamQuestionPublic> questionsPublic = questions.stream()
                .map(q -> new ExamQuestionPublic(q.getId(), q.getTaskType(), q.getPrompt(), q.getSectionIndex(), q.getOptions(), q.getGapNumber()))
                .toList();

        return new StartExamAttemptResponse(attempt.getId(), passagesPublic, questionsPublic, exercise.getAnswerOptions());
    }

    public ExamAnswerFeedbackResponse submitAnswer(String attemptId, SubmitExamAnswerRequest request) throws DataNotFoundException {
        ExamAttempt attempt = findAttempt(attemptId);
        ExamExercise exercise = attempt.getExercise();

        ExamQuestion question = (exercise.getQuestions() != null ? exercise.getQuestions() : List.<ExamQuestion>of())
                .stream()
                .filter(q -> q.getId().equals(request.questionId()))
                .findFirst()
                .orElseThrow(() -> new DataNotFoundException(QUESTION_NOT_FOUND_MSG));

        boolean correct = isCorrect(question, request.answer());

        String explanation = question.getExplanation() != null && !question.getExplanation().isBlank()
                ? question.getExplanation()
                : exercise.getDefaultExplanation();
        String commonMistake = question.getCommonMistake() != null && !question.getCommonMistake().isBlank()
                ? question.getCommonMistake()
                : exercise.getDefaultCommonMistake();

        recordAnswer(attempt, question, request, correct, explanation, commonMistake);
        attemptRepository.save(attempt);

        return new ExamAnswerFeedbackResponse(correct, question.getCorrectAnswer(), explanation, commonMistake);
    }

    public ExamAttemptResultResponse complete(String attemptId, CompleteExamAttemptRequest request) throws DataNotFoundException {
        ExamAttempt attempt = findAttempt(attemptId);
        List<ExamQuestion> questions = attempt.getExercise().getQuestions() != null
                ? attempt.getExercise().getQuestions() : List.of();

        List<ExamAnswerRecord> answers = attempt.getAnswers() != null ? attempt.getAnswers() : List.of();
        long correctCount = answers.stream().filter(ExamAnswerRecord::isCorrect).count();
        double score = questions.isEmpty() ? 0.0 : (correctCount * 100.0) / questions.size();

        attempt.setScore(score);
        attempt.setCompletedAt(LocalDateTime.now());
        attemptRepository.save(attempt);

        return new ExamAttemptResultResponse(attempt.getId(), score, answers);
    }

    private boolean isCorrect(ExamQuestion question, String answer) {
        String submitted = answer != null ? answer.trim() : "";
        return question.getCorrectAnswer() != null && question.getCorrectAnswer().trim().equalsIgnoreCase(submitted);
    }

    private ExamAttempt findAttempt(String attemptId) throws DataNotFoundException {
        return attemptRepository.findById(attemptId)
                .orElseThrow(() -> new DataNotFoundException(ATTEMPT_NOT_FOUND_MSG));
    }

    private void recordAnswer(ExamAttempt attempt, ExamQuestion question, SubmitExamAnswerRequest request,
                               boolean correct, String explanation, String commonMistake) {
        List<ExamAnswerRecord> answers = attempt.getAnswers() != null ? attempt.getAnswers() : new ArrayList<>();
        answers.removeIf(a -> a.getQuestionId().equals(question.getId()));
        answers.add(new ExamAnswerRecord(question.getId(), request.answer(), correct, explanation, commonMistake));
        attempt.setAnswers(answers);
    }
}
