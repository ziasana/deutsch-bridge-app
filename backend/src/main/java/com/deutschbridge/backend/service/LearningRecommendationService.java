package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.recommendation.ActivityRef;
import com.deutschbridge.backend.model.dto.recommendation.DailyWordsSnapshot;
import com.deutschbridge.backend.model.dto.recommendation.LearningRecommendation;
import com.deutschbridge.backend.model.dto.recommendation.LearningState;
import com.deutschbridge.backend.model.dto.recommendation.RecommendationType;
import com.deutschbridge.backend.model.entity.DailyWord;
import com.deutschbridge.backend.model.entity.ExamAttempt;
import com.deutschbridge.backend.model.entity.GrammarLesson;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.ReadingArticle;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.entity.UserArticleAttempt;
import com.deutschbridge.backend.model.entity.UserProfile;
import com.deutschbridge.backend.model.enums.ExpressionMasteryLevel;
import com.deutschbridge.backend.model.enums.ExpressionStatus;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.LearningReason;
import com.deutschbridge.backend.model.enums.NotificationPriority;
import com.deutschbridge.backend.model.enums.VocabularyMasteryLevel;
import com.deutschbridge.backend.repository.DailyWordRepository;
import com.deutschbridge.backend.repository.ExamAttemptRepository;
import com.deutschbridge.backend.repository.ExpressionProgressRepository;
import com.deutschbridge.backend.repository.ExpressionRepository;
import com.deutschbridge.backend.repository.GrammarLessonRepository;
import com.deutschbridge.backend.repository.LearningProgressRepository;
import com.deutschbridge.backend.repository.ReadingArticleRepository;
import com.deutschbridge.backend.repository.UserArticleAttemptRepository;
import com.deutschbridge.backend.repository.VocabularyProgressRepository;
import com.deutschbridge.backend.service.cache.ContentCacheService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Answers "what is the most useful learning action for this learner right now?" - the single source of
 * truth for both the Dashboard's Continue Learning card and the notification rules, so the two never
 * disagree about what the learner should do.
 *
 * Unlike the request-scoped services, everything here takes an explicit {@link User}, so the
 * notification scheduler can evaluate learners outside an HTTP request. It never triggers AI daily-word
 * generation: when today's words don't exist yet they're reported as "ready" at the learner's goal size.
 *
 * Ranking lives in {@link #RANKING}: reorder that list to change priorities. "Today's plan incomplete"
 * is intentionally not a recommendation (on the Dashboard the plan is already on screen); it's a
 * notification-only rule built from {@link LearningState#todaysPlan()}.
 */
@Service
public class LearningRecommendationService {

    /** Unfinished attempts older than this are treated as abandoned, not "continue where you left off". */
    private static final int UNFINISHED_ACTIVITY_WINDOW_DAYS = 7;
    private static final double MINUTES_PER_REVIEW_WORD = 0.6;

    public static final String ENTITY_VOCABULARY_REVIEW = "VOCABULARY_REVIEW";
    public static final String ENTITY_DAILY_WORDS = "DAILY_WORDS";
    public static final String ENTITY_DAILY_PLAN = "DAILY_PLAN";
    public static final String ENTITY_GRAMMAR_LESSON = "GRAMMAR_LESSON";
    public static final String ENTITY_READING_ARTICLE = "READING_ARTICLE";
    public static final String ENTITY_EXAM_EXERCISE = "EXAM_EXERCISE";
    public static final String ENTITY_EXAM_PREP = "EXAM_PREP";
    public static final String ENTITY_EXPRESSIONS = "EXPRESSIONS";

    /** Initial decision order (plan section 15). Each step returns empty when it doesn't apply. */
    private static final List<Function<LearningState, Optional<LearningRecommendation>>> RANKING = List.of(
            LearningRecommendationService::reviewDue,
            LearningRecommendationService::continueUnfinished,
            LearningRecommendationService::examPractice,
            LearningRecommendationService::dailyWords,
            LearningRecommendationService::grammar,
            LearningRecommendationService::reading,
            LearningRecommendationService::expressions
    );

    private final VocabularyProgressRepository vocabularyProgressRepository;
    private final ExpressionProgressRepository expressionProgressRepository;
    private final ExpressionRepository expressionRepository;
    private final DailyWordRepository dailyWordRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final GrammarLessonRepository grammarLessonRepository;
    private final ReadingArticleRepository readingArticleRepository;
    private final UserArticleAttemptRepository userArticleAttemptRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final ContentCacheService contentCacheService;

    public LearningRecommendationService(VocabularyProgressRepository vocabularyProgressRepository,
                                         ExpressionProgressRepository expressionProgressRepository,
                                         ExpressionRepository expressionRepository,
                                         DailyWordRepository dailyWordRepository,
                                         LearningProgressRepository learningProgressRepository,
                                         GrammarLessonRepository grammarLessonRepository,
                                         ReadingArticleRepository readingArticleRepository,
                                         UserArticleAttemptRepository userArticleAttemptRepository,
                                         ExamAttemptRepository examAttemptRepository,
                                         ContentCacheService contentCacheService) {
        this.vocabularyProgressRepository = vocabularyProgressRepository;
        this.expressionProgressRepository = expressionProgressRepository;
        this.expressionRepository = expressionRepository;
        this.dailyWordRepository = dailyWordRepository;
        this.learningProgressRepository = learningProgressRepository;
        this.grammarLessonRepository = grammarLessonRepository;
        this.readingArticleRepository = readingArticleRepository;
        this.userArticleAttemptRepository = userArticleAttemptRepository;
        this.examAttemptRepository = examAttemptRepository;
        this.contentCacheService = contentCacheService;
    }

    public LearningRecommendation getNextRecommendation(User user) {
        return getNextRecommendation(buildState(user));
    }

    public LearningRecommendation getNextRecommendation(LearningState state) {
        return getRecommendations(state).get(0);
    }

    /** Every applicable recommendation, best first; always ends with START so the list is never empty. */
    public List<LearningRecommendation> getRecommendations(LearningState state) {
        List<LearningRecommendation> result = new ArrayList<>();
        for (Function<LearningState, Optional<LearningRecommendation>> step : RANKING) {
            step.apply(state).ifPresent(result::add);
        }
        result.add(new LearningRecommendation(RecommendationType.START, null, null, 0, 0, 5,
                NotificationPriority.MEDIUM, ENTITY_DAILY_WORDS, null, LearningState.ROUTE_DAILY_WORDS));
        return result;
    }

    /** Builds state for background use: reads today's daily words without generating them. */
    @Transactional(readOnly = true)
    public LearningState buildState(User user) {
        return buildState(user, readDailyWords(user, LocalDate.now()));
    }

    /** Builds state when the caller already has today's daily words (the Dashboard generates them on load). */
    @Transactional(readOnly = true)
    public LearningState buildState(User user, DailyWordsSnapshot dailyWords) {
        UserProfile profile = user.getProfile();
        LearningLevel level = profile != null && profile.getLearningLevel() != null
                ? profile.getLearningLevel() : LearningLevel.A1;

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDateTime startOfToday = today.atStartOfDay();

        int wordsDue = (int) vocabularyProgressRepository.countDueForReview(user, now);
        int expressionsDue = (int) expressionProgressRepository.countDueForReview(user, now);

        int grammarLearned = (int) learningProgressRepository.countByUserAndLessonIsNotNullAndIsLearnedTrue(user);
        int readingLearned = (int) learningProgressRepository.countByUserAndReadingIsNotNullAndIsLearnedTrue(user);
        int expressionsLearned = (int) expressionProgressRepository.countByUserAndMasteryLevelIn(
                user, List.of(ExpressionMasteryLevel.ACTIVE, ExpressionMasteryLevel.MASTERED));
        int grammarTotal = (int) grammarLessonRepository.count();
        int readingTotal = (int) readingArticleRepository.count();
        int expressionsTotal = (int) expressionRepository.countByStatus(ExpressionStatus.PUBLISHED);

        int wordsMastered = (int) vocabularyProgressRepository.countByUserAndMasteryLevel(user, VocabularyMasteryLevel.MASTERED);
        int itemsLearnedToday = (int) learningProgressRepository.countByUserAndIsLearnedTrueAndLearnedAtBetween(
                user, startOfToday, startOfToday.plusDays(1));

        boolean examPrepActive = profile != null
                && (profile.getExamType() != null || profile.getLearningReasons().contains(LearningReason.EXAM));
        boolean examPracticedToday = examPrepActive && examAttemptRepository.existsByUserAndCompletedAtAfter(user, startOfToday);

        return new LearningState(
                now,
                wordsDue,
                expressionsDue,
                dailyWords.total(),
                dailyWords.learned(),
                grammarLearned,
                grammarTotal,
                readingLearned,
                readingTotal,
                expressionsLearned,
                expressionsTotal,
                wordsMastered,
                currentStreak(user, today),
                itemsLearnedToday,
                findUnfinishedActivity(user, now),
                findNextGrammarLesson(user, level),
                findNextReadingArticle(user, level),
                examPrepActive,
                examPracticedToday
        );
    }

    // ---------------------------------------------------------------
    // Ranking steps
    // ---------------------------------------------------------------

    static Optional<LearningRecommendation> reviewDue(LearningState s) {
        if (s.wordsDue() <= 0) return Optional.empty();
        int minutes = Math.max(2, (int) Math.round(s.wordsDue() * MINUTES_PER_REVIEW_WORD));
        return Optional.of(new LearningRecommendation(RecommendationType.VOCAB_REVIEW, null, null, 0, s.wordsDue(),
                minutes, NotificationPriority.HIGH, ENTITY_VOCABULARY_REVIEW, null, LearningState.ROUTE_VOCAB_REVIEW));
    }

    static Optional<LearningRecommendation> continueUnfinished(LearningState s) {
        ActivityRef activity = s.unfinishedActivity();
        if (activity == null) return Optional.empty();
        RecommendationType type = ENTITY_EXAM_EXERCISE.equals(activity.entityType())
                ? RecommendationType.CONTINUE_EXAM : RecommendationType.CONTINUE_READING;
        return Optional.of(new LearningRecommendation(type, activity.title(), null, 0, 0, 10,
                NotificationPriority.HIGH, activity.entityType(), activity.id(), activity.actionUrl()));
    }

    static Optional<LearningRecommendation> examPractice(LearningState s) {
        if (!s.examPrepActive() || s.examPracticedToday()) return Optional.empty();
        return Optional.of(new LearningRecommendation(RecommendationType.EXAM_PRACTICE, null, null, 0, 0, 15,
                NotificationPriority.HIGH, ENTITY_EXAM_PREP, null, LearningState.ROUTE_EXAM_PREP));
    }

    static Optional<LearningRecommendation> dailyWords(LearningState s) {
        if (s.dailyWordsTotal() <= 0 || s.dailyWordsAllLearned()) return Optional.empty();
        int percent = (int) Math.round(s.dailyWordsLearned() * 100.0 / s.dailyWordsTotal());
        return Optional.of(new LearningRecommendation(RecommendationType.DAILY_WORDS, null, percent,
                s.dailyWordsLearned(), s.dailyWordsTotal(), Math.max(3, s.dailyWordsTotal()),
                NotificationPriority.MEDIUM, ENTITY_DAILY_WORDS, null, LearningState.ROUTE_DAILY_WORDS));
    }

    static Optional<LearningRecommendation> grammar(LearningState s) {
        ActivityRef lesson = s.nextGrammarLesson();
        if (lesson == null) return Optional.empty();
        return Optional.of(new LearningRecommendation(RecommendationType.GRAMMAR, lesson.title(), null,
                s.grammarLearned(), s.grammarTotal(), 10, NotificationPriority.MEDIUM,
                lesson.entityType(), lesson.id(), lesson.actionUrl()));
    }

    static Optional<LearningRecommendation> reading(LearningState s) {
        ActivityRef article = s.nextReadingArticle();
        if (article == null) return Optional.empty();
        return Optional.of(new LearningRecommendation(RecommendationType.READING, article.title(), null,
                s.readingLearned(), s.readingTotal(), 10, NotificationPriority.MEDIUM,
                article.entityType(), article.id(), article.actionUrl()));
    }

    static Optional<LearningRecommendation> expressions(LearningState s) {
        if (s.expressionsDue() <= 0 && s.expressionsLearned() >= s.expressionsTotal()) return Optional.empty();
        return Optional.of(new LearningRecommendation(RecommendationType.EXPRESSIONS, null, null,
                s.expressionsLearned(), s.expressionsTotal(), 5, NotificationPriority.LOW,
                ENTITY_EXPRESSIONS, null, LearningState.ROUTE_EXPRESSIONS));
    }

    // ---------------------------------------------------------------
    // State helpers
    // ---------------------------------------------------------------

    private DailyWordsSnapshot readDailyWords(User user, LocalDate today) {
        List<DailyWord> words = dailyWordRepository.findByAssignedToAndAssignedDate(user, today);
        int goal = DailyWordService.resolveWordGoal(user.getProfile());
        if (words.isEmpty()) {
            return new DailyWordsSnapshot(goal, 0);
        }
        List<DailyWord> todays = words.size() > goal ? words.subList(0, goal) : words;
        int learned = (int) learningProgressRepository.findByUserAndDailyWordIn(user, todays).stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsLearned()))
                .count();
        return new DailyWordsSnapshot(todays.size(), learned);
    }

    /** Most recent unfinished reading or exam attempt from the last few days, whichever started later. */
    private ActivityRef findUnfinishedActivity(User user, LocalDateTime now) {
        LocalDateTime since = now.minusDays(UNFINISHED_ACTIVITY_WINDOW_DAYS);

        ActivityRef reading = userArticleAttemptRepository
                .findFirstByUserAndCompletedAtIsNullAndStartedAtAfterOrderByStartedAtDesc(user, since)
                .filter(a -> a.getArticle() != null)
                .map(LearningRecommendationService::toActivity)
                .orElse(null);
        ActivityRef exam = examAttemptRepository
                .findFirstByUserAndCompletedAtIsNullAndStartedAtAfterOrderByStartedAtDesc(user, since)
                .filter(a -> a.getExercise() != null)
                .map(LearningRecommendationService::toActivity)
                .orElse(null);

        if (reading == null) return exam;
        if (exam == null) return reading;
        return exam.startedAt().isAfter(reading.startedAt()) ? exam : reading;
    }

    private static ActivityRef toActivity(UserArticleAttempt attempt) {
        ReadingArticle article = attempt.getArticle();
        return new ActivityRef(ENTITY_READING_ARTICLE, article.getId(), article.getTitle(),
                "/dashboard/reading/article?id=" + article.getId(), attempt.getStartedAt());
    }

    private static ActivityRef toActivity(ExamAttempt attempt) {
        return new ActivityRef(ENTITY_EXAM_EXERCISE, attempt.getExercise().getId(), attempt.getExercise().getTitle(),
                "/dashboard/exam-prep/exercise?id=" + attempt.getExercise().getId(), attempt.getStartedAt());
    }

    /** First unlearned published lesson, preferring the learner's own level. */
    private ActivityRef findNextGrammarLesson(User user, LearningLevel level) {
        List<GrammarLesson> lessons = contentCacheService.getPublishedGrammarLessons();
        if (lessons.isEmpty()) return null;

        Set<String> learnedIds = learningProgressRepository.findByUserAndLessonIn(user, lessons).stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsLearned()))
                .map(p -> p.getLesson().getId())
                .collect(Collectors.toSet());

        return lessons.stream()
                .filter(l -> !learnedIds.contains(l.getId()))
                .min(Comparator.comparing((GrammarLesson l) -> l.getLevel() != level))
                .map(l -> new ActivityRef(ENTITY_GRAMMAR_LESSON, l.getId(), l.getTitle(),
                        "/dashboard/grammar/lesson?id=" + l.getId(), null))
                .orElse(null);
    }

    private ActivityRef findNextReadingArticle(User user, LearningLevel level) {
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

        return articles.stream()
                .filter(a -> !learnedIds.contains(a.getId()))
                .findFirst()
                .map(a -> new ActivityRef(ENTITY_READING_ARTICLE, a.getId(), a.getTitle(),
                        "/dashboard/reading/article?id=" + a.getId(), null))
                .orElse(null);
    }

    /** Consecutive learning days ending today or yesterday - same rule as LearningProgressService#getStreak. */
    private int currentStreak(User user, LocalDate today) {
        List<LocalDate> learnedDates = learningProgressRepository.findDistinctLearnedDatesByUser(user);
        if (learnedDates.isEmpty()) return 0;

        LocalDate last = learnedDates.get(0);
        if (!last.equals(today) && !last.equals(today.minusDays(1))) return 0;

        int streak = 0;
        LocalDate expected = last;
        for (LocalDate date : learnedDates) {
            if (!date.equals(expected)) break;
            streak++;
            expected = expected.minusDays(1);
        }
        return streak;
    }
}
