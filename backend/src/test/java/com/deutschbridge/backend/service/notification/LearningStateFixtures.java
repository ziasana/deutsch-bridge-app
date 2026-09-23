package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.dto.recommendation.ActivityRef;
import com.deutschbridge.backend.model.dto.recommendation.LearningState;

import java.time.LocalDateTime;

/** Readable LearningState construction for tests - every field defaults to "nothing to do". */
final class LearningStateFixtures {

    static final LocalDateTime NOW = LocalDateTime.of(2026, 9, 23, 19, 0);

    int wordsDue;
    int dailyWordsTotal = 5;
    int dailyWordsLearned = 5;
    // Plan activities complete by default so only what a test sets up counts as "to do".
    int grammarLearned = 1;
    int grammarTotal = 1;
    int readingLearned = 1;
    int readingTotal = 1;
    int wordsMastered;
    int streak;
    int itemsLearnedToday;
    ActivityRef unfinished;
    ActivityRef nextGrammar;
    boolean examPrepActive;

    static LearningStateFixtures state() {
        return new LearningStateFixtures();
    }

    LearningStateFixtures wordsDue(int v) { wordsDue = v; return this; }
    LearningStateFixtures dailyWords(int learned, int total) { dailyWordsLearned = learned; dailyWordsTotal = total; return this; }
    LearningStateFixtures grammar(int learned, int total) { grammarLearned = learned; grammarTotal = total; return this; }
    LearningStateFixtures reading(int learned, int total) { readingLearned = learned; readingTotal = total; return this; }
    LearningStateFixtures wordsMastered(int v) { wordsMastered = v; return this; }
    LearningStateFixtures streak(int v) { streak = v; return this; }
    LearningStateFixtures itemsLearnedToday(int v) { itemsLearnedToday = v; return this; }
    LearningStateFixtures nextGrammar(ActivityRef v) { nextGrammar = v; return this; }
    LearningStateFixtures examPrepActive(boolean v) { examPrepActive = v; return this; }

    LearningStateFixtures unfinishedReading(String id, String title, LocalDateTime startedAt) {
        unfinished = new ActivityRef("READING_ARTICLE", id, title, "/dashboard/reading/article?id=" + id, startedAt);
        return this;
    }

    LearningState build() {
        return new LearningState(NOW, wordsDue, 0, dailyWordsTotal, dailyWordsLearned,
                grammarLearned, grammarTotal, readingLearned, readingTotal, 0, 0,
                wordsMastered, streak, itemsLearnedToday, unfinished, nextGrammar, null,
                examPrepActive, false);
    }
}
