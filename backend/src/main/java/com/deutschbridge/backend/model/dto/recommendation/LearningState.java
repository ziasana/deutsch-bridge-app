package com.deutschbridge.backend.model.dto.recommendation;

import com.deutschbridge.backend.model.dto.PlanActivityDto;
import com.deutschbridge.backend.model.dto.TodaysPlanDto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Snapshot of a learner's current learning situation, built once by LearningRecommendationService and
 * shared by the Dashboard and the notification rule engine so both read the same facts.
 *
 * @param unfinishedActivity a reading/exam attempt the learner started recently but didn't finish, or null
 * @param itemsLearnedToday  learning-progress items marked learned today (signals the day's plan has started)
 */
public record LearningState(
        LocalDateTime now,
        int wordsDue,
        int expressionsDue,
        int dailyWordsTotal,
        int dailyWordsLearned,
        int grammarLearned,
        int grammarTotal,
        int readingLearned,
        int readingTotal,
        int expressionsLearned,
        int expressionsTotal,
        int wordsMastered,
        int currentStreakDays,
        int itemsLearnedToday,
        ActivityRef unfinishedActivity,
        ActivityRef nextGrammarLesson,
        ActivityRef nextReadingArticle,
        boolean examPrepActive,
        boolean examPracticedToday
) {

    public static final String ROUTE_DASHBOARD = "/dashboard";
    public static final String ROUTE_DAILY_WORDS = "/dashboard/daily-words";
    public static final String ROUTE_VOCAB_REVIEW = "/dashboard/vocabulary/practice";
    public static final String ROUTE_GRAMMAR = "/dashboard/grammar";
    public static final String ROUTE_READING = "/dashboard/reading";
    public static final String ROUTE_EXPRESSIONS = "/dashboard/expressions";
    public static final String ROUTE_EXAM_PREP = "/dashboard/exam-prep";

    public boolean dailyWordsAllLearned() {
        return dailyWordsTotal > 0 && dailyWordsLearned >= dailyWordsTotal;
    }

    public boolean grammarAllLearned() {
        return grammarTotal > 0 && grammarLearned >= grammarTotal;
    }

    public boolean readingAllLearned() {
        return readingTotal > 0 && readingLearned >= readingTotal;
    }

    /** Started = the learner did at least one learning action today. */
    public boolean planStarted() {
        return itemsLearnedToday > 0 || dailyWordsLearned > 0;
    }

    public TodaysPlanDto todaysPlan() {
        List<PlanActivityDto> activities = List.of(
                new PlanActivityDto("DAILY_WORDS", dailyWordsAllLearned(), ROUTE_DAILY_WORDS),
                new PlanActivityDto("VOCAB_REVIEW", wordsDue == 0, ROUTE_VOCAB_REVIEW),
                new PlanActivityDto("GRAMMAR", grammarAllLearned(), ROUTE_GRAMMAR),
                new PlanActivityDto("READING", readingAllLearned(), ROUTE_READING)
        );
        int completed = (int) activities.stream().filter(PlanActivityDto::completed).count();
        return new TodaysPlanDto(completed, activities.size(), activities);
    }
}
