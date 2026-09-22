package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.ContinueLearningDto;
import com.deutschbridge.backend.model.dto.CurrentFocusDto;
import com.deutschbridge.backend.model.dto.DailyWordResponse;
import com.deutschbridge.backend.model.dto.DashboardResponse;
import com.deutschbridge.backend.model.dto.DashboardUserDto;
import com.deutschbridge.backend.model.dto.GrammarLessonResponse;
import com.deutschbridge.backend.model.dto.MilestoneDto;
import com.deutschbridge.backend.model.dto.NewContentDto;
import com.deutschbridge.backend.model.dto.OverviewResponse;
import com.deutschbridge.backend.model.dto.PlanActivityDto;
import com.deutschbridge.backend.model.dto.ReviewNeededDto;
import com.deutschbridge.backend.model.dto.StreakResponse;
import com.deutschbridge.backend.model.dto.TodaysPlanDto;
import com.deutschbridge.backend.model.dto.WeekSummaryDto;
import com.deutschbridge.backend.model.entity.Expression;
import com.deutschbridge.backend.model.entity.ExpressionProgress;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.ReadingArticle;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.entity.VocabularyItem;
import com.deutschbridge.backend.model.entity.VocabularyProgress;
import com.deutschbridge.backend.model.enums.ExpressionMasteryLevel;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import com.deutschbridge.backend.model.enums.GrammarLessonStatus;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.VocabularyMasteryLevel;
import com.deutschbridge.backend.repository.ExpressionProgressRepository;
import com.deutschbridge.backend.repository.ExpressionRepository;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import com.deutschbridge.backend.repository.VocabularyItemRepository;
import com.deutschbridge.backend.repository.VocabularyProgressRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Composes the "what should I do now" dashboard entirely from data other services/repositories
 * already compute (overview, streak, daily words, vocab/expression SRS due dates, grammar
 * progress) - see the dashboard redesign plan. No new learning logic or content lives here.
 */
@Service
public class DashboardService {

    private static final int[] MILESTONE_THRESHOLDS = {10, 50, 100, 250, 500, 1000};

    private final RequestContext requestContext;
    private final UserService userService;
    private final LearningProgressService learningProgressService;
    private final DailyWordService dailyWordService;
    private final GrammarService grammarService;
    private final VocabularyItemRepository vocabularyItemRepository;
    private final VocabularyProgressRepository vocabularyProgressRepository;
    private final ExpressionRepository expressionRepository;
    private final ExpressionProgressRepository expressionProgressRepository;
    private final ReadingArticleRepository readingArticleRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final GrammarLessonRepository grammarLessonRepository;

    public DashboardService(RequestContext requestContext,
                             UserService userService,
                             LearningProgressService learningProgressService,
                             DailyWordService dailyWordService,
                             GrammarService grammarService,
                             VocabularyItemRepository vocabularyItemRepository,
                             VocabularyProgressRepository vocabularyProgressRepository,
                             ExpressionRepository expressionRepository,
                             ExpressionProgressRepository expressionProgressRepository,
                             ReadingArticleRepository readingArticleRepository,
                             LearningProgressRepository learningProgressRepository,
                             GrammarLessonRepository grammarLessonRepository) {
        this.requestContext = requestContext;
        this.userService = userService;
        this.learningProgressService = learningProgressService;
        this.dailyWordService = dailyWordService;
        this.grammarService = grammarService;
        this.vocabularyItemRepository = vocabularyItemRepository;
        this.vocabularyProgressRepository = vocabularyProgressRepository;
        this.expressionRepository = expressionRepository;
        this.expressionProgressRepository = expressionProgressRepository;
        this.readingArticleRepository = readingArticleRepository;
        this.learningProgressRepository = learningProgressRepository;
        this.grammarLessonRepository = grammarLessonRepository;
    }

    public DashboardResponse getDashboard() {
        User user = userService.findByEmail(requestContext.getUserEmail());
        UserProfile profile = user.getProfile();
        LearningLevel level = profile != null && profile.getLearningLevel() != null
                ? profile.getLearningLevel() : LearningLevel.A1;

        OverviewResponse overview = learningProgressService.getOverview();
        StreakResponse streak = learningProgressService.getStreak();
        List<DailyWordResponse> todaysWords = dailyWordService.getTodaysWordsForCurrentUser();
        List<GrammarLessonResponse> grammarLessons = grammarService.findAllWithLearningProgress();

        List<VocabularyItem> vocabPool = vocabularyItemRepository.findByUser(user);
        List<VocabularyProgress> vocabProgresses = vocabularyProgressRepository.findByUserAndVocabularyItemIn(user, vocabPool);
        LocalDateTime now = LocalDateTime.now();
        int wordsDue = (int) vocabProgresses.stream()
                .filter(p -> p.getMasteryLevel() != VocabularyMasteryLevel.MASTERED)
                .filter(p -> p.getNextReviewAt() == null || !p.getNextReviewAt().isAfter(now))
                .count();

        List<ExpressionProgress> expressionProgresses = expressionProgressRepository.findByUser(user);
        int expressionsDue = (int) expressionProgresses.stream()
                .filter(p -> p.getMasteryLevel() != ExpressionMasteryLevel.MASTERED)
                .filter(p -> p.getNextReviewAt() == null || !p.getNextReviewAt().isAfter(now))
                .count();

        boolean dailyWordsAllLearned = !todaysWords.isEmpty() && todaysWords.stream().allMatch(DailyWordResponse::learned);
        boolean grammarAllLearned = overview.grammar().total() > 0 && overview.grammar().learned() >= overview.grammar().total();
        boolean readingAllLearned = overview.reading().total() > 0 && overview.reading().learned() >= overview.reading().total();

        ContinueLearningDto continueLearning = resolveContinueLearning(
                user, level, todaysWords, dailyWordsAllLearned, wordsDue, grammarLessons, overview, expressionsDue);

        TodaysPlanDto todaysPlan = buildTodaysPlan(todaysWords, dailyWordsAllLearned, wordsDue, grammarAllLearned, readingAllLearned);

        CurrentFocusDto focus = resolveCurrentFocus(overview, vocabPool.size(),
                (int) vocabProgresses.stream().filter(p -> p.getMasteryLevel() == VocabularyMasteryLevel.MASTERED).count());

        WeekSummaryDto week = buildWeekSummary(user);

        int wordsMastered = (int) vocabularyProgressRepository.countByUserAndMasteryLevel(user, VocabularyMasteryLevel.MASTERED);
        MilestoneDto milestone = resolveMilestone(wordsMastered);

        NewContentDto newContent = resolveNewContent(streak.lastActiveDate());

        return new DashboardResponse(
                new DashboardUserDto(user.getDisplayName(), level.name()),
                streak.currentStreak(),
                continueLearning,
                todaysPlan,
                new ReviewNeededDto(wordsDue, expressionsDue),
                focus,
                week,
                milestone,
                newContent
        );
    }

    /** null when there's no last-active day yet (new user - everything is "new" to them anyway,
     * which the onboarding empty states already cover) or nothing was published since then. */
    private NewContentDto resolveNewContent(LocalDate lastActiveDate) {
        if (lastActiveDate == null) return null;

        LocalDateTime since = lastActiveDate.plusDays(1).atStartOfDay();
        int grammarLessons = (int) grammarLessonRepository.countByStatusAndCreatedAtAfter(GrammarLessonStatus.PUBLISHED, since);
        int readingArticles = (int) readingArticleRepository.countByCreatedAtAfter(since);
        int expressions = (int) expressionRepository.countByStatusAndCreatedAtAfter(ExpressionStatus.PUBLISHED, since);
        int total = grammarLessons + readingArticles + expressions;

        if (total == 0) return null;
        return new NewContentDto(grammarLessons, readingArticles, expressions, total);
    }

    private ContinueLearningDto resolveContinueLearning(User user, LearningLevel level,
                                                          List<DailyWordResponse> todaysWords, boolean dailyWordsAllLearned,
                                                          int wordsDue, List<GrammarLessonResponse> grammarLessons,
                                                          OverviewResponse overview, int expressionsDue) {
        if (!todaysWords.isEmpty() && !dailyWordsAllLearned) {
            long learned = todaysWords.stream().filter(DailyWordResponse::learned).count();
            return new ContinueLearningDto("DAILY_WORDS", null,
                    (int) Math.round(learned * 100.0 / todaysWords.size()), (int) learned, todaysWords.size(),
                    "/dashboard/daily-words");
        }

        if (wordsDue > 0) {
            return new ContinueLearningDto("VOCAB_REVIEW", null, null, 0, wordsDue, "/dashboard/vocabulary/practice");
        }

        GrammarLessonResponse nextLesson = grammarLessons.stream()
                .filter(l -> l.learningProgresses().isEmpty() || !l.learningProgresses().get(0).learned())
                .sorted((a, b) -> Boolean.compare(!level.name().equals(a.level()), !level.name().equals(b.level())))
                .findFirst().orElse(null);
        if (nextLesson != null) {
            return new ContinueLearningDto("GRAMMAR", nextLesson.title(), null, overview.grammar().learned(),
                    overview.grammar().total(), "/dashboard/grammar/lesson?id=" + nextLesson.id());
        }

        ReadingArticle nextArticle = findNextUnlearnedReadingArticle(user, level);
        if (nextArticle != null) {
            return new ContinueLearningDto("READING", nextArticle.getTitle(), null, overview.reading().learned(),
                    overview.reading().total(), "/dashboard/reading/article?id=" + nextArticle.getId());
        }

        if (expressionsDue > 0 || overview.expressions().learned() < overview.expressions().total()) {
            return new ContinueLearningDto("EXPRESSIONS", null, null, overview.expressions().learned(),
                    overview.expressions().total(), "/dashboard/expressions");
        }

        return new ContinueLearningDto("START", null, null, 0, 0, "/dashboard/daily-words");
    }

    private ReadingArticle findNextUnlearnedReadingArticle(User user, LearningLevel level) {
        List<ReadingArticle> articles = readingArticleRepository.findByLevel(level);
        if (articles.isEmpty()) {
            articles = readingArticleRepository.findAll();
        }
        if (articles.isEmpty()) return null;

        List<LearningProgress> progresses = learningProgressRepository.findByUserAndReadingIn(user, articles);
        Set<String> learnedIds = progresses.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsLearned()))
                .map(p -> p.getReading().getId())
                .collect(Collectors.toSet());

        return articles.stream().filter(a -> !learnedIds.contains(a.getId())).findFirst().orElse(null);
    }

    private TodaysPlanDto buildTodaysPlan(List<DailyWordResponse> todaysWords, boolean dailyWordsAllLearned,
                                           int wordsDue, boolean grammarAllLearned, boolean readingAllLearned) {
        List<PlanActivityDto> activities = new ArrayList<>();
        activities.add(new PlanActivityDto("DAILY_WORDS", !todaysWords.isEmpty() && dailyWordsAllLearned, "/dashboard/daily-words"));
        activities.add(new PlanActivityDto("VOCAB_REVIEW", wordsDue == 0, "/dashboard/vocabulary/practice"));
        activities.add(new PlanActivityDto("GRAMMAR", grammarAllLearned, "/dashboard/grammar"));
        activities.add(new PlanActivityDto("READING", readingAllLearned, "/dashboard/reading"));

        int completed = (int) activities.stream().filter(PlanActivityDto::completed).count();
        return new TodaysPlanDto(completed, activities.size(), activities);
    }

    private CurrentFocusDto resolveCurrentFocus(OverviewResponse overview, int vocabTotal, int vocabMastered) {
        record Candidate(String area, double ratio, String route) {}
        List<Candidate> candidates = new ArrayList<>();
        if (vocabTotal > 0) candidates.add(new Candidate("VOCABULARY", vocabMastered / (double) vocabTotal, "/dashboard/vocabulary"));
        if (overview.grammar().total() > 0) candidates.add(new Candidate("GRAMMAR", overview.grammar().learned() / (double) overview.grammar().total(), "/dashboard/grammar"));
        if (overview.reading().total() > 0) candidates.add(new Candidate("READING", overview.reading().learned() / (double) overview.reading().total(), "/dashboard/reading"));
        if (overview.expressions().total() > 0) candidates.add(new Candidate("EXPRESSIONS", overview.expressions().learned() / (double) overview.expressions().total(), "/dashboard/expressions"));

        return candidates.stream()
                .min((a, b) -> Double.compare(a.ratio(), b.ratio()))
                .map(c -> new CurrentFocusDto(c.area(), c.route()))
                .orElse(new CurrentFocusDto(null, null));
    }

    private WeekSummaryDto buildWeekSummary(User user) {
        List<LocalDate> learnedDates = learningProgressRepository.findDistinctLearnedDatesByUser(user);
        Set<LocalDate> learnedSet = new HashSet<>(learnedDates);

        LocalDate today = LocalDate.now();
        List<Boolean> days = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            days.add(learnedSet.contains(today.minusDays(i)));
        }
        int learningDays = (int) days.stream().filter(Boolean::booleanValue).count();

        return new WeekSummaryDto(days, learningDays, 7);
    }

    private MilestoneDto resolveMilestone(int wordsMastered) {
        if (wordsMastered <= 0) return null;

        int next = MILESTONE_THRESHOLDS[MILESTONE_THRESHOLDS.length - 1] + 1;
        for (int threshold : MILESTONE_THRESHOLDS) {
            if (wordsMastered < threshold) {
                next = threshold;
                break;
            }
        }
        boolean reachedAny = wordsMastered >= MILESTONE_THRESHOLDS[0];
        if (!reachedAny) return null;

        return new MilestoneDto(wordsMastered, next);
    }
}
