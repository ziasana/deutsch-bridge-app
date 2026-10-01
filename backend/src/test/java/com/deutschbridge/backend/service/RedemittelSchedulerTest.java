package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.RedemittelProgress;
import com.deutschbridge.backend.model.enums.RedemittelExerciseType;
import com.deutschbridge.backend.model.enums.RedemittelStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class RedemittelSchedulerTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 5, 1, 10, 0);

    private RedemittelProgress started() {
        RedemittelProgress p = new RedemittelProgress();
        RedemittelScheduler.start(p, NOW);
        return p;
    }

    @Test
    @DisplayName("start -> first review is due in 1 day")
    void startSchedulesTomorrow() {
        RedemittelProgress p = started();
        assertEquals(RedemittelStatus.LEARNING, p.getStatus());
        assertEquals(NOW.plusDays(1), p.getNextReviewAt());
        assertEquals(NOW, p.getLearnedAt());
    }

    @Test
    @DisplayName("correct reviews -> walk through 3, 7, 14, 30, 60 days, then MASTERED")
    void correctWalksIntervals() {
        RedemittelProgress p = started();
        int[] expected = {3, 7, 14, 30, 60};
        for (int days : expected) {
            RedemittelScheduler.review(p, true, NOW);
            assertEquals(NOW.plusDays(days), p.getNextReviewAt());
        }
        RedemittelScheduler.review(p, true, NOW);
        assertEquals(RedemittelStatus.MASTERED, p.getStatus());
        assertNull(p.getNextReviewAt());
        assertEquals(6, p.getCorrectCount());
        assertEquals(6, p.getReviewCount());
    }

    @Test
    @DisplayName("status -> LEARNING for the short intervals, REVIEW for the longer ones")
    void statusFollowsStage() {
        RedemittelProgress p = started();
        RedemittelScheduler.review(p, true, NOW); // 3 days
        assertEquals(RedemittelStatus.LEARNING, p.getStatus());
        RedemittelScheduler.review(p, true, NOW); // 7 days
        assertEquals(RedemittelStatus.REVIEW, p.getStatus());
    }

    @Test
    @DisplayName("wrong answer -> back to tomorrow and the counters record it")
    void wrongGoesBackToTomorrow() {
        RedemittelProgress p = started();
        RedemittelScheduler.review(p, true, NOW);
        RedemittelScheduler.review(p, true, NOW);
        RedemittelScheduler.review(p, false, NOW);
        assertEquals(0, p.getStage());
        assertEquals(NOW.plusDays(1), p.getNextReviewAt());
        assertEquals(RedemittelStatus.LEARNING, p.getStatus());
        assertEquals(1, p.getIncorrectCount());
    }

    @Test
    @DisplayName("exerciseForStage -> gets harder with the stage and caps at production")
    void exerciseProgression() {
        assertEquals(RedemittelExerciseType.MEANING, RedemittelScheduler.exerciseForStage(0));
        assertEquals(RedemittelExerciseType.FILL_BLANK, RedemittelScheduler.exerciseForStage(1));
        assertEquals(RedemittelExerciseType.SITUATION, RedemittelScheduler.exerciseForStage(2));
        assertEquals(RedemittelExerciseType.PRODUCTION, RedemittelScheduler.exerciseForStage(3));
        assertEquals(RedemittelExerciseType.PRODUCTION, RedemittelScheduler.exerciseForStage(5));
    }
}
