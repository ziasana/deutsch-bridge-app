package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.ExerciseAnswerRequest;
import com.deutschbridge.backend.model.dto.ExerciseAnswerResponse;
import com.deutschbridge.backend.model.entity.ExerciseProgress;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.ExerciseProgressRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ExerciseProgressService {

    private final ExerciseProgressRepository repository;
    private final UserService userService;
    private final RequestContext requestContext;

    public ExerciseProgressService(ExerciseProgressRepository repository, UserService userService, RequestContext requestContext) {
        this.repository = repository;
        this.userService = userService;
        this.requestContext = requestContext;
    }

    public List<ExerciseAnswerResponse> getProgress() {
        User user = userService.findByEmail(requestContext.getUserEmail());
        return repository.findByUser(user).stream()
                .map(p -> new ExerciseAnswerResponse(p.getQuestionKey(), p.isCorrect()))
                .toList();
    }

    @Transactional
    public void saveAnswer(ExerciseAnswerRequest request) {
        User user = userService.findByEmail(requestContext.getUserEmail());

        ExerciseProgress progress = repository.findByUserAndQuestionKey(user, request.questionKey())
                .orElseGet(() -> {
                    ExerciseProgress p = new ExerciseProgress();
                    p.setUser(user);
                    p.setQuestionKey(request.questionKey());
                    return p;
                });

        progress.setCorrect(request.correct());
        progress.setAnsweredAt(LocalDateTime.now());
        repository.save(progress);
    }

    @Transactional
    public void resetProgress(List<String> questionKeys) {
        User user = userService.findByEmail(requestContext.getUserEmail());
        if (questionKeys == null || questionKeys.isEmpty()) {
            repository.deleteAllByUser(user);
        } else {
            repository.deleteByUserAndQuestionKeyIn(user, questionKeys);
        }
    }
}
