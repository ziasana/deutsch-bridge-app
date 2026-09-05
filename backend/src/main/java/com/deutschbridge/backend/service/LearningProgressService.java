package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.CategoryProgress;
import com.deutschbridge.backend.model.dto.LearningProgressRequest;
import com.deutschbridge.backend.model.dto.OverviewResponse;
import com.deutschbridge.backend.model.dto.RecentVocabularyResponse;
import com.deutschbridge.backend.model.dto.RecentVocabularyWithStatsResponse;
import com.deutschbridge.backend.model.dto.StreakResponse;
import com.deutschbridge.backend.model.entity.*;
import com.deutschbridge.backend.repository.DailyWordRepository;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import com.deutschbridge.backend.repository.NomenVerbConnectionRepository;
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import com.deutschbridge.backend.repository.VocabularyRepository;
import com.deutschbridge.backend.util.VocabularyMapper;
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
    private final NomenVerbConnectionService nomenVerbConnectionService;
    private final GrammarService grammarService;
    private final VocabularyService vocabularyService;
    private final VocabularyRepository vocabularyRepository;
    private final DailyWordService dailyWordService;
    private final GrammarLessonRepository grammarLessonRepository;
    private final NomenVerbConnectionRepository nomenVerbConnectionRepository;
    private final DailyWordRepository dailyWordRepository;
    private final ReadingArticleService readingArticleService;
    private final ReadingArticleRepository readingArticleRepository;

    public LearningProgressService(LearningProgressRepository repository, RequestContext requestContext, UserService userService, NomenVerbConnectionService nomenVerbConnectionService, GrammarService grammarService, VocabularyService vocabularyService, VocabularyRepository vocabularyRepository, DailyWordService dailyWordService, GrammarLessonRepository grammarLessonRepository, NomenVerbConnectionRepository nomenVerbConnectionRepository, DailyWordRepository dailyWordRepository, ReadingArticleService readingArticleService, ReadingArticleRepository readingArticleRepository) {
        this.repository = repository;
        this.requestContext = requestContext;
        this.userService = userService;
        this.nomenVerbConnectionService = nomenVerbConnectionService;
        this.grammarService = grammarService;
        this.vocabularyService = vocabularyService;
        this.vocabularyRepository = vocabularyRepository;
        this.dailyWordService = dailyWordService;
        this.grammarLessonRepository = grammarLessonRepository;
        this.nomenVerbConnectionRepository = nomenVerbConnectionRepository;
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

        if (request.nomenVerbId() != null) {
            NomenVerbConnection nv =
                    nomenVerbConnectionService.findById(request.nomenVerbId());

            saveProgress(
                    () -> repository.findByUserAndNomenVerb(user, nv),
                    progress -> progress.setNomenVerb(nv),
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
        userService.findByEmail(requestContext.getUserEmail());
        List<Vocabulary> vocabularies = vocabularyService.getTop10VocabularyByUserAndLanguage(
                requestContext.getUserId(), requestContext.getLanguage()
        );
       return vocabularies.stream()
                .map(v -> {
                    String status;

                    if (v.getPractices() == null || v.getPractices().isEmpty()) {
                        status = "NEW";
                    } else if (
                            v.getPractices().stream()
                                    .anyMatch(p -> p.getSuccessRate() == 100)
                    ) {
                        status = "MASTER";
                    } else {
                        status = "LEARNING";
                    }

                    return VocabularyMapper.mapVocabularyRecentPracticeResponse(v, status);
                }).toList();
    }

    public OverviewResponse getOverview() {
        User user = userService.findByEmail(requestContext.getUserEmail());

        int dailyWordsLearned = (int) repository.countByUserAndDailyWordIsNotNullAndIsLearnedTrue(user);
        int grammarLearned = (int) repository.countByUserAndLessonIsNotNullAndIsLearnedTrue(user);
        int nomenVerbLearned = (int) repository.countByUserAndNomenVerbIsNotNullAndIsLearnedTrue(user);
        int readingLearned = (int) repository.countByUserAndReadingIsNotNullAndIsLearnedTrue(user);
        int totalLearned = (int) repository.countByUserAndIsLearnedTrue(user);

        int dailyWordsTotal = (int) dailyWordRepository.count();
        int grammarTotal = (int) grammarLessonRepository.count();
        int nomenVerbTotal = (int) nomenVerbConnectionRepository.count();
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
                new CategoryProgress(nomenVerbLearned, nomenVerbTotal),
                new CategoryProgress(readingLearned, readingTotal),
                totalLearned,
                dailyWordsTotal + grammarTotal + nomenVerbTotal + readingTotal
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

    /*public List<RecentVocabularyResponse> getRecentVocabularyWithStats() {
        userService.findByEmail(requestContext.getUserEmail());

        // 1️⃣ Fetch recent vocabularies (top N)
        List<RecentVocabularyResponse> recentVocabularies = vocabularyService.getTop10VocabularyByUserAndLanguage(
                        requestContext.getUserId(),
                        requestContext.getLanguage()
                )
                .stream()
                .map(v -> {
                    String status;
                    if (v.getPractices() == null || v.getPractices().isEmpty()) {
                        status = "NEW";
                    } else if (v.getPractices().stream().anyMatch(p -> p.getSuccessRate() == 100)) {
                        status = "MASTER";
                    } else {
                        status = "LEARNING";
                    }
                    return VocabularyMapper.mapVocabularyRecentPracticeResponse(v, status);
                })
                .toList();

        // 2️⃣ Fetch totals (counts only)
        List<Vocabulary> allVocabularies = (List<Vocabulary>) vocabularyRepository.getVocabularyByUserAndLanguage(
                requestContext.getUserId(),
                requestContext.getLanguage()
        ).stream()
                .map(v -> {
                    int countNew = 0;
                    int countMaster = 0;
                    int countLearning = 0;
                    if (v.getPractices() == null || v.getPractices().isEmpty()) {
                        countNew++;
                    } else if (v.getPractices().stream().anyMatch(p -> p.getSuccessRate() == 100)) {
                        countMaster++;
                    } else {
                        countLearning++;
                    }
                }).count();

        // 3️⃣ Return combined response
        return new RecentVocabularyWithStatsResponse(recentVocabularies, totalCounts).recentVocabularyResponse();
    }*/

}
