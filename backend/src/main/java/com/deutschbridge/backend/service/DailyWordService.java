package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.DailyWordResponse;
import com.deutschbridge.backend.model.entity.DailyWord;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.repository.DailyWordRepository;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
public class DailyWordService {

    private static final int WORDS_PER_DAY = 5;
    private static final String NOT_FOUND_MSG = "Daily word not found!";

    private final DailyWordRepository dailyWordRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final UserService userService;
    private final RequestContext requestContext;

    public DailyWordService(DailyWordRepository dailyWordRepository,
                             LearningProgressRepository learningProgressRepository,
                             UserService userService,
                             RequestContext requestContext) {
        this.dailyWordRepository = dailyWordRepository;
        this.learningProgressRepository = learningProgressRepository;
        this.userService = userService;
        this.requestContext = requestContext;
    }

    public DailyWord findById(String id) throws DataNotFoundException {
        return dailyWordRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
    }

    /**
     * Deterministically rotates through the word bank so every user sees the
     * same curated set of words for a given calendar day, and a different set
     * the next day.
     */
    public List<DailyWord> getTodaysWords() {
        List<DailyWord> all = dailyWordRepository.findAllOrdered();
        if (all.isEmpty()) return List.of();

        int total = all.size();
        int count = Math.min(WORDS_PER_DAY, total);
        long epochDay = LocalDate.now().toEpochDay();
        int startIndex = (int) (epochDay % total);

        return IntStream.range(0, count)
                .mapToObj(i -> all.get((startIndex + i) % total))
                .toList();
    }

    public List<DailyWordResponse> getTodaysWordsForCurrentUser() {
        List<DailyWord> words = getTodaysWords();
        if (words.isEmpty()) return List.of();

        User user = userService.findByEmail(requestContext.getUserEmail());
        List<LearningProgress> progresses = learningProgressRepository.findByUserAndDailyWordIn(user, words);
        Set<String> learnedWordIds = progresses.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsLearned()))
                .map(p -> p.getDailyWord().getId())
                .collect(Collectors.toSet());

        return words.stream()
                .map(w -> new DailyWordResponse(
                        w.getId(),
                        w.getWord(),
                        w.getMeaning(),
                        w.getExample(),
                        w.getSynonyms(),
                        w.getLevel() != null ? w.getLevel().getValue() : null,
                        learnedWordIds.contains(w.getId())
                ))
                .toList();
    }
}
