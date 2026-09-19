package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.AiGenerationException;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.DailyWordResponse;
import com.deutschbridge.backend.model.entity.DailyWord;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.PreferredLanguage;
import com.deutschbridge.backend.repository.DailyWordRepository;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Generates each learner's daily words tailored to their own CEFR level (spec: check level and
 * language from the user's profile), instead of the same fixed 5 words for everyone. A1-B1
 * learners whose profile language is Persian get a Persian translation of the meaning and example
 * alongside the German; B2-C2 stays German/English only regardless of language preference.
 *
 * Generation happens once per user per calendar day via the AI teacher and is persisted (assignedTo
 * + assignedDate), so repeat visits the same day don't re-generate or re-spend an AI call. If
 * generation fails, falls back to the shared hand-seeded pool for that level (see DailyWordSeeder),
 * rotated by day the same way the whole bank used to be rotated before this per-user model existed.
 */
@Service
public class DailyWordService {

    private static final int WORDS_PER_DAY = 5;
    private static final String NOT_FOUND_MSG = "Daily word not found!";
    private static final Set<LearningLevel> PERSIAN_ELIGIBLE_LEVELS = Set.of(
            LearningLevel.A1, LearningLevel.A2, LearningLevel.B1
    );

    private final DailyWordRepository dailyWordRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final UserService userService;
    private final RequestContext requestContext;
    private final OllamaService ollamaService;

    public DailyWordService(DailyWordRepository dailyWordRepository,
                             LearningProgressRepository learningProgressRepository,
                             UserService userService,
                             RequestContext requestContext,
                             OllamaService ollamaService) {
        this.dailyWordRepository = dailyWordRepository;
        this.learningProgressRepository = learningProgressRepository;
        this.userService = userService;
        this.requestContext = requestContext;
        this.ollamaService = ollamaService;
    }

    public DailyWord findById(String id) throws DataNotFoundException {
        return dailyWordRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException(NOT_FOUND_MSG));
    }

    public List<DailyWordResponse> getTodaysWordsForCurrentUser() {
        User user = userService.findByEmail(requestContext.getUserEmail());
        UserProfile profile = user.getProfile();
        LearningLevel level = profile != null && profile.getLearningLevel() != null
                ? profile.getLearningLevel() : LearningLevel.A1;
        boolean includePersian = PERSIAN_ELIGIBLE_LEVELS.contains(level)
                && profile != null && profile.getPreferredLanguage() == PreferredLanguage.PR;

        LocalDate today = LocalDate.now();
        List<DailyWord> words = dailyWordRepository.findByAssignedToAndAssignedDate(user, today);
        if (words.isEmpty()) {
            words = generateForUser(user, level, includePersian, today);
        } else if (words.size() > WORDS_PER_DAY) {
            // Defends against rows persisted under a previous, larger WORDS_PER_DAY or a duplicate-generation race;
            // trims the response without touching the extra rows already stored for today.
            words = words.subList(0, WORDS_PER_DAY);
        }

        return mapWithProgress(user, words, includePersian);
    }

    private List<DailyWord> generateForUser(User user, LearningLevel level, boolean includePersian, LocalDate today) {
        try {
            String raw = ollamaService.generateDailyWords(level, WORDS_PER_DAY, includePersian);
            List<DailyWord> generated = parseGeneratedWords(raw, level);
            if (generated.isEmpty()) {
                throw new AiGenerationException("AI returned no parseable daily words.");
            }
            for (DailyWord word : generated) {
                word.setAssignedTo(user);
                word.setAssignedDate(today);
            }
            return dailyWordRepository.saveAll(generated);
        } catch (AiGenerationException e) {
            return fallbackWords(level);
        }
    }

    /** Best-effort fallback to the shared hand-seeded pool when AI generation is unavailable. */
    private List<DailyWord> fallbackWords(LearningLevel level) {
        List<DailyWord> pool = dailyWordRepository.findByLevelAndAssignedToIsNull(level);
        if (pool.isEmpty()) {
            pool = dailyWordRepository.findAllOrdered();
        }
        if (pool.isEmpty()) return List.of();

        List<DailyWord> finalPool = pool;
        int total = pool.size();
        int count = Math.min(WORDS_PER_DAY, total);
        long epochDay = LocalDate.now().toEpochDay();
        int startIndex = (int) (epochDay % total);

        return IntStream.range(0, count)
                .mapToObj(i -> finalPool.get((startIndex + i) % total))
                .toList();
    }

    private List<DailyWord> parseGeneratedWords(String raw, LearningLevel level) {
        List<DailyWord> result = new ArrayList<>();
        if (raw == null) return result;

        boolean inList = false;
        for (String line : raw.split("\n")) {
            String trimmed = line.strip();
            if (trimmed.equalsIgnoreCase("WOERTER:")) {
                inList = true;
                continue;
            }
            if (!inList || trimmed.isBlank()) continue;

            String[] parts = trimmed.split("\\|", -1);
            if (parts.length < 4) continue;

            DailyWord word = new DailyWord();
            word.setWord(parts[0].strip());
            word.setMeaning(parts[1].strip());
            word.setExample(parts[2].strip());
            word.setSynonyms(parts[3].strip());
            if (parts.length >= 6) {
                word.setMeaningFa(blankToNull(parts[4].strip()));
                word.setExampleFa(blankToNull(parts[5].strip()));
            }
            word.setLevel(level);
            result.add(word);

            if (result.size() >= WORDS_PER_DAY) break;
        }
        return result;
    }

    private String blankToNull(String value) {
        return value.isBlank() || value.equals("-") ? null : value;
    }

    private List<DailyWordResponse> mapWithProgress(User user, List<DailyWord> words, boolean includePersian) {
        if (words.isEmpty()) return List.of();

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
                        learnedWordIds.contains(w.getId()),
                        includePersian ? w.getMeaningFa() : null,
                        includePersian ? w.getExampleFa() : null
                ))
                .toList();
    }
}
