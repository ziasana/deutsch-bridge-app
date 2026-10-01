package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.RedemittelProgress;
import com.deutschbridge.backend.model.enums.RedemittelExerciseType;
import com.deutschbridge.backend.model.enums.RedemittelStatus;

import java.time.LocalDateTime;

/**
 * The deliberately simple spaced-repetition schedule: new -> 1 -> 3 -> 7 -> 14 -> 30 -> 60 days.
 * A correct review moves to the next interval, a wrong one goes back to tomorrow. Passing the
 * 60-day review means MASTERED. No ease factors - the project's SM-2 lives in the Expressions module.
 */
final class RedemittelScheduler {

    static final int[] INTERVAL_DAYS = {1, 3, 7, 14, 30, 60};

    private RedemittelScheduler() {
    }

    /** First scheduling, when the learner finishes learning an expression. */
    static void start(RedemittelProgress p, LocalDateTime now) {
        p.setStage(0);
        p.setStatus(RedemittelStatus.LEARNING);
        p.setLearnedAt(now);
        p.setNextReviewAt(now.plusDays(INTERVAL_DAYS[0]));
    }

    /** Applies a review result to the schedule and the counters. */
    static void review(RedemittelProgress p, boolean correct, LocalDateTime now) {
        p.setReviewCount(p.getReviewCount() + 1);
        p.setLastReviewedAt(now);
        if (correct) {
            p.setCorrectCount(p.getCorrectCount() + 1);
            p.setStage(p.getStage() + 1);
        } else {
            p.setIncorrectCount(p.getIncorrectCount() + 1);
            p.setStage(0);
        }
        p.setStatus(statusForStage(p.getStage()));
        p.setNextReviewAt(p.getStatus() == RedemittelStatus.MASTERED ? null : now.plusDays(INTERVAL_DAYS[p.getStage()]));
    }

    static RedemittelStatus statusForStage(int stage) {
        if (stage >= INTERVAL_DAYS.length) return RedemittelStatus.MASTERED;
        return stage <= 1 ? RedemittelStatus.LEARNING : RedemittelStatus.REVIEW;
    }

    /** The exercise tier a review at this stage asks for: recognize first, produce once the interval is long. */
    static RedemittelExerciseType exerciseForStage(int stage) {
        return switch (Math.min(stage, 3)) {
            case 0 -> RedemittelExerciseType.MEANING;
            case 1 -> RedemittelExerciseType.FILL_BLANK;
            case 2 -> RedemittelExerciseType.SITUATION;
            default -> RedemittelExerciseType.PRODUCTION;
        };
    }
}
