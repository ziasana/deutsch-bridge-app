package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.CategoryProgress;
import com.deutschbridge.backend.model.dto.LearningProgressRequest;
import com.deutschbridge.backend.model.dto.OverviewResponse;
import com.deutschbridge.backend.model.dto.RecentVocabularyResponse;
import com.deutschbridge.backend.model.dto.StreakResponse;
import com.deutschbridge.backend.model.entity.*;
import com.deutschbridge.backend.model.enums.ExpressionMasteryLevel;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import com.deutschbridge.backend.model.enums.VocabularyMasteryLevel;
import com.deutschbridge.backend.repository.DailyWordRepository;
import com.deutschbridge.backend.repository.ExpressionProgressRepository;
import com.deutschbridge.backend.repository.ExpressionRepository;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import com.deutschbridge.backend.repository.VocabularyItemRepository;
import com.deutschbridge.backend.repository.VocabularyProgressRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Supplier;
import java.util.stream.Stream;


@Service
public class LearningProgressService {

    private final LearningProgressRepository repository;
    private final RequestContext requestContext;
    private final UserService userService;
    private final GrammarService grammarService;
    private final VocabularyItemRepository vocabularyItemRepository;
    private final VocabularyProgressRepository vocabularyProgressRepository;
    private final DailyWordService dailyWordService;
    private final GrammarLessonRepository grammarLessonRepository;
    private final ExpressionRepository expressionRepository;
    private final ExpressionProgressRepository expressionProgressRepository;
    private final DailyWordRepository dailyWordRepository;
    private final ReadingArticleService readingArticleService;
    private final ReadingArticleRepository readingArticleRepository;

    public LearningProgressService(LearningProgressRepository repository, RequestContext requestContext, UserService userService, GrammarService grammarService, VocabularyItemRepository vocabularyItemRepository, VocabularyProgressRepository vocabularyProgressRepository, DailyWordService dailyWordService, GrammarLessonRepository grammarLessonRepository, ExpressionRepository expressionRepository, ExpressionProgressRepository expressionProgressRepository, DailyWordRepository dailyWordRepository, ReadingArticleService readingArticleService, ReadingArticleRepository readingArticleRepository) {
        this.repository = repository;
        this.requestContext = requestContext;
        this.userService = userService;
        this.grammarService = grammarService;
        this.vocabularyItemRepository = vocabularyItemRepository;
        this.vocabularyProgressRepository = vocabularyProgressRepository;
        this.dailyWordService = dailyWordService;
        this.grammarLessonRepository = grammarLessonRepository;
        this.expressionRepository = expressionRepository;
        this.expressionProgressRepository = expressionProgressRepository;
        this.dailyWordRepository = dailyWordRepository;
        this.readingArticleService = readingArticleService;
        this.readingArticleRepository = readingArticleRepository;
    }

    public List<LearningProgress> findAll()
    {
        return repository.findAll();
    }

    public Optional<LearningProgress> finById(String id) {
        return repository.findById(id);
    }

    @Transactional
    public void save(LearningProgressRequest request) throws DataNotFoundException {

        User user = userService.findByEmail(requestContext.getUserEmail());
        LocalDateTime now = LocalDateTime.now();

        if (request.lessonId() != null) {
            GrammarLesson lesson = grammarService.findById(request.lessonId());

            saveProgress(
                    () -> repository.findByUserAndLesson(user, lesson),
                    progress -> progress.setLesson(lesson),
                    user,
                    request.learned(),
                    now
            );
        }

        if (request.dailyWordId() != null) {
            DailyWord dailyWord = dailyWordService.findById(request.dailyWordId());

            saveProgress(
                    () -> repository.findByUserAndDailyWord(user, dailyWord),
                    progress -> progress.setDailyWord(dailyWord),
                    user,
                    request.learned(),
                    now
            );
        }

        if (request.readingId() != null) {
            ReadingArticle reading = readingArticleService.findById(request.readingId());

            saveProgress(
                    () -> repository.findByUserAndReading(user, reading),
                    progress -> progress.setReading(reading),
                    user,
                    request.learned(),
                    now
            );
        }
    }

    private void saveProgress(
            Supplier<Optional<LearningProgress>> finder,
            Consumer<LearningProgress> relationSetter,
            User user,
            boolean learned,
            LocalDateTime now
    ) {
        LearningProgress progress = finder.get()
                .orElseGet(() -> {
                    LearningProgress lp = new LearningProgress();
                    lp.setUser(user);
                    relationSetter.accept(lp);
                    return lp;
                });

        progress.setIsLearned(learned);
        progress.setLearnedAt(learned ? now : null);

        repository.save(progress);
    }

   public List<RecentVocabularyResponse> getRecentVocabularyWithPractice() {
        User user = userService.findByEmail(requestContext.getUserEmail());
        List<VocabularyItem> items = vocabularyItemRepository.findTop10ByUserOrderByCreatedAtDesc(user);
        List<VocabularyProgress> progresses = vocabularyProgressRepository.findByUserAndVocabularyItemIn(user, items);
        java.util.Map<String, VocabularyProgress> progressByItemId = progresses.stream()
                .collect(java.util.stream.Collectors.toMap(p -> p.getVocabularyItem().getId(), p -> p, (first, second) -> first));

        return items.stream()
                .map(item -> {
                    VocabularyProgress progress = progressByItemId.get(item.getId());
                    String status;
                    if (progress == null) {
                        status = "NEW";
                    } else if (progress.getMasteryLevel() == VocabularyMasteryLevel.MASTERED) {
                        status = "MASTER";
                    } else {
                        status = "LEARNING";
                    }
                    return new RecentVocabularyResponse(item.getId(), item.getWord(), Optional.ofNullable(item.getMeaning()), status);
                }).toList();
    }

    public OverviewResponse getOverview() {
        User user = userService.findByEmail(requestContext.getUserEmail());

        int dailyWordsLearned = (int) repository.countByUserAndDailyWordIsNotNullAndIsLearnedTrue(user);
        int grammarLearned = (int) repository.countByUserAndLessonIsNotNullAndIsLearnedTrue(user);
        // "Learned" for expressions means active knowledge (ACTIVE/MASTERED mastery), not just
        // recognition - a boolean checkbox can't capture that, see ExpressionPracticeService.
        int expressionsActive = (int) expressionProgressRepository.countByUserAndMasteryLevelIn(
                user, List.of(ExpressionMasteryLevel.ACTIVE, ExpressionMasteryLevel.MASTERED));
        int readingLearned = (int) repository.countByUserAndReadingIsNotNullAndIsLearnedTrue(user);
        int totalLearned = (int) repository.countByUserAndIsLearnedTrue(user) + expressionsActive;

        // Not a plain count(): daily words are now generated per-user per-day (see DailyWordService),
        // so the raw table count grows unboundedly. countByAssignedToIsNull() reflects only the
        // shared seed/fallback pool, keeping this stat meaningful.
        int dailyWordsTotal = (int) dailyWordRepository.countByAssignedToIsNull();
        int grammarTotal = (int) grammarLessonRepository.count();
        int expressionsTotal = (int) expressionRepository.countByStatus(ExpressionStatus.PUBLISHED);
        int readingTotal = (int) readingArticleRepository.count();

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfTomorrow = startOfToday.plusDays(1);
        int itemsLearnedToday = (int) repository.countByUserAndIsLearnedTrueAndLearnedAtBetween(
                user, startOfToday, startOfTomorrow
        );

        Integer dailyGoalWords = user.getProfile() != null ? user.getProfile().getDailyGoalWords() : null;

        return new OverviewResponse(
                dailyGoalWords,
                itemsLearnedToday,
                new CategoryProgress(dailyWordsLearned, dailyWordsTotal),
                new CategoryProgress(grammarLearned, grammarTotal),
                new CategoryProgress(expressionsActive, expressionsTotal),
                new CategoryProgress(readingLearned, readingTotal),
                totalLearned,
                dailyWordsTotal + grammarTotal + expressionsTotal + readingTotal
        );
    }

    public StreakResponse getStreak() {
        User user = userService.findByEmail(requestContext.getUserEmail());

        List<LocalDate> learnedDates = repository.findDistinctLearnedDatesByUser(user);

        if (learnedDates.isEmpty()) {
            return new StreakResponse(0, 0, null);
        }

        LocalDate today = LocalDate.now();
        LocalDate lastActiveDate = learnedDates.get(0);

        int currentStreak = 0;
        LocalDate expected = lastActiveDate.equals(today) ? today : today.minusDays(1);
        if (lastActiveDate.equals(today) || lastActiveDate.equals(today.minusDays(1))) {
            for (LocalDate date : learnedDates) {
                if (date.equals(expected)) {
                    currentStreak++;
                    expected = expected.minusDays(1);
                } else {
                    break;
                }
            }
        }

        int longestStreak = 1;
        int runLength = 1;
        for (int i = 1; i < learnedDates.size(); i++) {
            LocalDate previous = learnedDates.get(i - 1);
            LocalDate current = learnedDates.get(i);
            if (previous.minusDays(1).equals(current)) {
                runLength++;
            } else {
                runLength = 1;
            }
            longestStreak = Math.max(longestStreak, runLength);
        }
        longestStreak = Math.max(longestStreak, currentStreak);

        return new StreakResponse(currentStreak, longestStreak, lastActiveDate);
    }

}
