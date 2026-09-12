package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamExerciseManualRequest;
import com.deutschbridge.backend.model.dto.ExamExercisePublicResponse;
import com.deutschbridge.backend.model.dto.ExamExerciseResponse;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamExerciseCompletion;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExamExerciseCompletionRepository;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import com.deutschbridge.backend.util.ExamExerciseMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ExamExerciseService {

    private static final String NOT_FOUND_MSG = "Exam exercise not found!";

    private final ExamExerciseRepository examExerciseRepository;
    private final ExamExerciseCompletionRepository examExerciseCompletionRepository;
    private final RequestContext requestContext;

    public ExamExerciseService(ExamExerciseRepository examExerciseRepository,
                                ExamExerciseCompletionRepository examExerciseCompletionRepository,
                                RequestContext requestContext) {
        this.examExerciseRepository = examExerciseRepository;
        this.examExerciseCompletionRepository = examExerciseCompletionRepository;
        this.requestContext = requestContext;
    }

    public ExamExercise findById(String id) throws DataNotFoundException {
        return examExerciseRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
    }

    public List<ExamExercisePublicResponse> findAllPublic(ExamSection section, LearningLevel level, ExamTaskType taskType) {
        List<ExamExercise> exercises;
        if (section == null) {
            exercises = examExerciseRepository.findAll();
        } else if (level != null && taskType != null) {
            exercises = examExerciseRepository.findBySectionAndLevelAndTaskType(section, level, taskType);
        } else if (level != null) {
            exercises = examExerciseRepository.findBySectionAndLevel(section, level);
        } else if (taskType != null) {
            exercises = examExerciseRepository.findBySectionAndTaskType(section, taskType);
        } else {
            exercises = examExerciseRepository.findBySection(section);
        }

        Set<String> completedExerciseIds = examExerciseCompletionRepository.findByUserId(requestContext.getUserId()).stream()
                .map(ExamExerciseCompletion::getExerciseId)
                .collect(Collectors.toSet());

        return exercises.stream()
                .filter(ExamExercise::isPublished)
                .map(exercise -> ExamExerciseMapper.mapToPublicResponse(exercise, completedExerciseIds))
                .toList();
    }

    public ExamExercisePublicResponse findByIdPublic(String id) throws DataNotFoundException {
        return ExamExerciseMapper.mapToPublicResponse(findById(id));
    }

    public void markCompleted(String exerciseId) throws DataNotFoundException {
        findById(exerciseId);
        String userId = requestContext.getUserId();
        ExamExerciseCompletion completion = examExerciseCompletionRepository
                .findByUserIdAndExerciseId(userId, exerciseId)
                .orElseGet(() -> {
                    ExamExerciseCompletion c = new ExamExerciseCompletion();
                    c.setUserId(userId);
                    c.setExerciseId(exerciseId);
                    return c;
                });
        completion.setCompletedAt(LocalDateTime.now());
        examExerciseCompletionRepository.save(completion);
    }

    public void unmarkCompleted(String exerciseId) {
        examExerciseCompletionRepository.findByUserIdAndExerciseId(requestContext.getUserId(), exerciseId)
                .ifPresent(examExerciseCompletionRepository::delete);
    }

    public List<ExamExerciseResponse> findAllForAdmin() {
        return examExerciseRepository.findAll().stream().map(ExamExerciseMapper::mapToResponse).toList();
    }

    public ExamExerciseResponse getForAdmin(String id) throws DataNotFoundException {
        return ExamExerciseMapper.mapToResponse(findById(id));
    }

    public ExamExerciseResponse createManual(ExamExerciseManualRequest request) {
        ExamExercise exercise = new ExamExercise();
        applyRequest(exercise, request);
        return ExamExerciseMapper.mapToResponse(examExerciseRepository.save(exercise));
    }

    public ExamExerciseResponse update(String id, ExamExerciseManualRequest request) throws DataNotFoundException {
        ExamExercise existing = findById(id);
        applyRequest(existing, request);
        return ExamExerciseMapper.mapToResponse(examExerciseRepository.save(existing));
    }

    public void delete(String id) throws DataNotFoundException {
        findById(id);
        examExerciseRepository.deleteById(id);
    }

    private void applyRequest(ExamExercise exercise, ExamExerciseManualRequest request) {
        if (request.title() != null) exercise.setTitle(request.title());
        if (request.section() != null) exercise.setSection(request.section());
        if (request.taskType() != null) exercise.setTaskType(request.taskType());
        if (request.level() != null) exercise.setLevel(request.level());
        if (request.partNumber() != null) exercise.setPartNumber(request.partNumber());
        if (request.passages() != null) exercise.setPassages(preparePassages(request.passages()));
        if (request.questions() != null) exercise.setQuestions(prepareQuestions(request.questions()));
        if (request.answerOptions() != null) exercise.setAnswerOptions(request.answerOptions());
        if (request.defaultExplanation() != null) exercise.setDefaultExplanation(request.defaultExplanation());
        if (request.defaultCommonMistake() != null) exercise.setDefaultCommonMistake(request.defaultCommonMistake());
        if (request.published() != null) exercise.setPublished(request.published());
    }

    private List<ExamPassage> preparePassages(List<ExamPassage> passages) {
        if (passages == null) return new ArrayList<>();
        passages.forEach(ExamPassage::ensureId);
        return passages;
    }

    private List<ExamQuestion> prepareQuestions(List<ExamQuestion> questions) {
        if (questions == null) return new ArrayList<>();
        questions.forEach(ExamQuestion::ensureId);
        return questions;
    }
}
