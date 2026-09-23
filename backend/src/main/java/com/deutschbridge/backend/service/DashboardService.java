package com.deutschbridge.backend.service;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.model.dto.ContinueLearningDto;
import com.deutschbridge.backend.model.dto.CurrentFocusDto;
import com.deutschbridge.backend.model.dto.DailyWordResponse;
import com.deutschbridge.backend.model.dto.DashboardResponse;
import com.deutschbridge.backend.model.dto.DashboardUserDto;
import com.deutschbridge.backend.model.dto.MilestoneDto;
import com.deutschbridge.backend.model.dto.NewContentDto;
import com.deutschbridge.backend.model.dto.ReviewNeededDto;
import com.deutschbridge.backend.model.dto.StreakResponse;
import com.deutschbridge.backend.model.dto.WeekSummaryDto;
import com.deutschbridge.backend.model.dto.recommendation.DailyWordsSnapshot;
import com.deutschbridge.backend.model.dto.recommendation.LearningRecommendation;
import com.deutschbridge.backend.model.dto.recommendation.LearningState;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import com.deutschbridge.backend.model.enums.GrammarLessonStatus;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.ExpressionRepository;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import com.deutschbridge.backend.repository.VocabularyItemRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Composes the "what should I do now" dashboard entirely from data other services/repositories
 * already compute (overview, streak, daily words, vocab/expression SRS due dates, grammar
 * progress) - see the dashboard redesign plan. No new learning logic or content lives here.
 *
 * "What should I do next" (the Continue Learning card) and today's plan come from
 * LearningRecommendationService, the same source the notification rules use.
 */
@Service
public class DashboardService {

    private static final int[] MILESTONE_THRESHOLDS = {10, 50, 100, 250, 500, 1000};

    private final RequestContext requestContext;
    private final UserService userService;
    private final LearningProgressService learningProgressService;
    private final DailyWordService dailyWordService;
    private final LearningRecommendationService learningRecommendationService;
    private final VocabularyItemRepository vocabularyItemRepository;
    private final ExpressionRepository expressionRepository;
    private final ReadingArticleRepository readingArticleRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final GrammarLessonRepository grammarLessonRepository;

    public DashboardService(RequestContext requestContext,
                             UserService userService,
                             LearningProgressService learningProgressService,
                             DailyWordService dailyWordService,
                             LearningRecommendationService learningRecommendationService,
                             VocabularyItemRepository vocabularyItemRepository,
                             ExpressionRepository expressionRepository,
                             ReadingArticleRepository readingArticleRepository,
                             LearningProgressRepository learningProgressRepository,
                             GrammarLessonRepository grammarLessonRepository) {
        this.requestContext = requestContext;
        this.userService = userService;
        this.learningProgressService = learningProgressService;
        this.dailyWordService = dailyWordService;
        this.learningRecommendationService = learningRecommendationService;
        this.vocabularyItemRepository = vocabularyItemRepository;
        this.expressionRepository = expressionRepository;
        this.readingArticleRepository = readingArticleRepository;
        this.learningProgressRepository = learningProgressRepository;
        this.grammarLessonRepository = grammarLessonRepository;
    }

    public DashboardResponse getDashboard() {
        User user = userService.findByEmail(requestContext.getUserEmail());
        UserProfile profile = user.getProfile();
        LearningLevel level = profile != null && profile.getLearningLevel() != null
                ? profile.getLearningLevel() : LearningLevel.A1;

        StreakResponse streak = learningProgressService.getStreak();
        // Loading the dashboard is what generates today's words, so pass them in rather than letting
        // the recommendation service report them as "not generated yet".
        List<DailyWordResponse> todaysWords = dailyWordService.getTodaysWordsForCurrentUser();
        DailyWordsSnapshot dailyWords = new DailyWordsSnapshot(todaysWords.size(),
                (int) todaysWords.stream().filter(DailyWordResponse::learned).count());

        LearningState state = learningRecommendationService.buildState(user, dailyWords);
        ContinueLearningDto continueLearning = toContinueLearning(learningRecommendationService.getNextRecommendation(state));

        CurrentFocusDto focus = resolveCurrentFocus(state, (int) vocabularyItemRepository.countByUser(user));

        WeekSummaryDto week = buildWeekSummary(user);

        MilestoneDto milestone = resolveMilestone(state.wordsMastered());

        NewContentDto newContent = resolveNewContent(streak.lastActiveDate());

        return new DashboardResponse(
                new DashboardUserDto(user.getDisplayName(), level.name()),
                streak.currentStreak(),
                continueLearning,
                state.todaysPlan(),
                new ReviewNeededDto(state.wordsDue(), state.expressionsDue()),
                focus,
                week,
                milestone,
                newContent
        );
    }

    private ContinueLearningDto toContinueLearning(LearningRecommendation rec) {
        return new ContinueLearningDto(rec.type().getDashboardType(), rec.title(), rec.progressPercent(),
                rec.completed(), rec.total(), rec.actionUrl());
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

    private CurrentFocusDto resolveCurrentFocus(LearningState state, int vocabTotal) {
        record Candidate(String area, double ratio, String route) {}
        List<Candidate> candidates = new ArrayList<>();
        if (vocabTotal > 0) candidates.add(new Candidate("VOCABULARY", state.wordsMastered() / (double) vocabTotal, "/dashboard/vocabulary"));
        if (state.grammarTotal() > 0) candidates.add(new Candidate("GRAMMAR", state.grammarLearned() / (double) state.grammarTotal(), "/dashboard/grammar"));
        if (state.readingTotal() > 0) candidates.add(new Candidate("READING", state.readingLearned() / (double) state.readingTotal(), "/dashboard/reading"));
        if (state.expressionsTotal() > 0) candidates.add(new Candidate("EXPRESSIONS", state.expressionsLearned() / (double) state.expressionsTotal(), "/dashboard/expressions"));

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
