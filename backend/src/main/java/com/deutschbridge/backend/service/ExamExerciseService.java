package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamExerciseManualRequest;
import com.deutschbridge.backend.model.dto.ExamExercisePublicResponse;
import com.deutschbridge.backend.model.dto.ExamExerciseResponse;
import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.entity.ExamPassage;
import com.deutschbridge.backend.model.entity.ExamQuestion;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import com.deutschbridge.backend.util.ExamExerciseMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ExamExerciseService {

    private static final String NOT_FOUND_MSG = "Exam exercise not found!";

    private final ExamExerciseRepository examExerciseRepository;

    public ExamExerciseService(ExamExerciseRepository examExerciseRepository) {
        this.examExerciseRepository = examExerciseRepository;
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

        return exercises.stream()
                .filter(ExamExercise::isPublished)
                .map(ExamExerciseMapper::mapToPublicResponse)
                .toList();
    }

    public ExamExercisePublicResponse findByIdPublic(String id) throws DataNotFoundException {
        return ExamExerciseMapper.mapToPublicResponse(findById(id));
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
