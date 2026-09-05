package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.GrammarLessonResponse;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import com.deutschbridge.backend.util.GrammarLessonMapper;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GrammarService {
    private final GrammarLessonRepository grammarRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final UserService userService;
    private final RequestContext requestContext;
    private static final String NOT_FOUND_MSG= "Grammar lesson not found!";

    public GrammarService(GrammarLessonRepository grammarRepository,
                           LearningProgressRepository learningProgressRepository,
                           UserService userService,
                           RequestContext requestContext) {
        this.grammarRepository = grammarRepository;
        this.learningProgressRepository = learningProgressRepository;
        this.userService = userService;
        this.requestContext = requestContext;
    }

    public List<GrammarLesson> findAll() {
        return grammarRepository.findAll();
    }

    public List<GrammarLessonResponse> findAllWithLearningProgress() {
        return mapWithCurrentUserProgress(grammarRepository.getWithLearningProgress());
    }

    public GrammarLessonResponse findByIdWithLearningProgress(String id) throws DataNotFoundException {
        GrammarLesson lesson = findById(id);
        return mapWithCurrentUserProgress(List.of(lesson)).get(0);
    }

    private List<GrammarLessonResponse> mapWithCurrentUserProgress(List<GrammarLesson> lessons) {
        if (lessons.isEmpty()) return List.of();

        User user = userService.findByEmail(requestContext.getUserEmail());
        List<LearningProgress> progresses = learningProgressRepository.findByUserAndLessonIn(user, lessons);
        Map<String, LearningProgress> progressByLessonId = progresses.stream()
                .collect(Collectors.toMap(p -> p.getLesson().getId(), p -> p, (first, second) -> first));

        return lessons.stream()
                .map(l -> GrammarLessonMapper.mapToResponse(l, progressByLessonId.get(l.getId())))
                .toList();
    }

    @Transactional
    public GrammarLesson saveLesson(GrammarLesson lesson) {
        if (lesson.getQuiz() == null) lesson.setQuiz(new ArrayList<>());
        return grammarRepository.save(lesson);
    }

    @Transactional
    public List<GrammarLesson> saveAll(List<GrammarLesson> lessons) {
        for (GrammarLesson lesson : lessons) {
            if (lesson.getQuiz() == null) {
                lesson.setQuiz(new ArrayList<>());
            }
        }
        return  grammarRepository.saveAll(lessons);
    }
    public GrammarLesson findById(String id) throws DataNotFoundException {
        return grammarRepository.findById(id)
                .orElseThrow(()->new DataNotFoundException(NOT_FOUND_MSG));
    }

    public boolean deleteById(String  id) throws DataNotFoundException {
        grammarRepository.findById(id)
                .orElseThrow(()->new DataNotFoundException(NOT_FOUND_MSG));
        grammarRepository.deleteById(id);
        return true;
    }

    public GrammarLesson update(GrammarLesson grammar, String id) throws DataNotFoundException {
        GrammarLesson existing = grammarRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
        if (existing.getTitle() != null) existing.setTitle(grammar.getTitle());
        if (existing.getContent() != null) existing.setContent(grammar.getContent());
        if (existing.getExample() != null) existing.setExample(grammar.getExample());
        if (existing.getLevel() != null) existing.setLevel(grammar.getLevel());
        if (existing.getSummary() != null) existing.setSummary(grammar.getSummary());
        return grammarRepository.save(existing);
    }
}
