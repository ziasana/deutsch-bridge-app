package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.recommendation.ActivityRef;
import com.deutschbridge.backend.model.dto.recommendation.LearningRecommendation;
import com.deutschbridge.backend.model.dto.recommendation.LearningState;
import com.deutschbridge.backend.model.dto.recommendation.RecommendationType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class LearningRecommendationServiceTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 9, 23, 19, 0);

    private final LearningRecommendationService service = new LearningRecommendationService(
            null, null, null, null, null, null, null, null, null, null);

    private static LearningState state(int wordsDue, int dailyLearned, ActivityRef unfinished, ActivityRef nextGrammar) {
        return new LearningState(NOW, wordsDue, 0, 5, dailyLearned, 0, 3, 0, 0, 0, 0,
                0, 0, 0, unfinished, nextGrammar, null, false, false);
    }

    @Test
    @DisplayName("priority -> review due beats unfinished activity, daily words and grammar")
    void reviewFirst() {
        ActivityRef reading = new ActivityRef("READING_ARTICLE", "a1", "Im Café", "/dashboard/reading/article?id=a1", NOW.minusHours(3));
        ActivityRef grammar = new ActivityRef("GRAMMAR_LESSON", "g1", "Perfekt", "/dashboard/grammar/lesson?id=g1", null);

        List<LearningRecommendation> recs = service.getRecommendations(state(8, 0, reading, grammar));

        assertEquals(List.of(RecommendationType.VOCAB_REVIEW, RecommendationType.CONTINUE_READING,
                        RecommendationType.DAILY_WORDS, RecommendationType.GRAMMAR, RecommendationType.START),
                recs.stream().map(LearningRecommendation::type).toList());
        assertEquals(5, recs.get(0).durationMinutes());
    }

    @Test
    @DisplayName("dashboard mapping -> an unfinished reading shows as the dashboard's READING card with its deep link")
    void continueReadingMapsToDashboardType() {
        ActivityRef reading = new ActivityRef("READING_ARTICLE", "a1", "Im Café", "/dashboard/reading/article?id=a1", NOW.minusHours(3));

        LearningRecommendation next = service.getNextRecommendation(state(0, 5, reading, null));

        assertEquals("READING", next.type().getDashboardType());
        assertEquals("Im Café", next.title());
        assertEquals("/dashboard/reading/article?id=a1", next.actionUrl());
    }

    @Test
    @DisplayName("nothing to do -> START fallback")
    void startFallback() {
        LearningRecommendation next = service.getNextRecommendation(state(0, 5, null, null));
        assertEquals(RecommendationType.START, next.type());
    }
}
