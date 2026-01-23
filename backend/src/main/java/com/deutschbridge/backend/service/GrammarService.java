package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class GrammarService {
    private final GrammarLessonRepository grammarRepository;
    private static final String NOT_FOUND_MSG= "Grammar lesson not found!";

    public GrammarService(GrammarLessonRepository grammarRepository) {
        this.grammarRepository = grammarRepository;
    }

    public List<GrammarLesson> findAll() {
        return grammarRepository.findAll();
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
