package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.examsim.ExamTimerConfig;
import com.deutschbridge.backend.model.examsim.StageState;

import java.util.ArrayList;
import java.util.List;

/**
 * Pure server-side timer logic. Stages run one after another in timer order. A stage ends when the learner completes it
 * (the next stage starts right then) or when its deadline passes (the next stage starts at that deadline, so time spent
 * away from the exam is not given back). Nothing here reads a clock: callers pass the time.
 */
public final class ExamStageClock {

    private ExamStageClock() {
    }

    public static List<StageState> start(List<ExamTimerConfig> timers, long nowMs) {
        List<StageState> stages = new ArrayList<>();
        stages.add(stage(timers.get(0), nowMs));
        return stages;
    }

    /**
     * Applies every deadline that has passed. The last stage is marked EXPIRED at its deadline but the exam itself is
     * only over once {@link #examOver} says so, which leaves room for the save grace period.
     */
    public static List<StageState> advance(List<ExamTimerConfig> timers, List<StageState> stages, long nowMs) {
        List<StageState> result = new ArrayList<>(stages);
        while (true) {
            StageState current = result.get(result.size() - 1);
            if (!current.isRunning() || nowMs < current.deadlineAtMs()) return result;
            result.set(result.size() - 1, current.ended(current.deadlineAtMs(), StageState.EXPIRED));
            if (result.size() >= timers.size()) return result;
            result.add(stage(timers.get(result.size()), current.deadlineAtMs()));
        }
    }

    /** Learner finishes the current stage early; the next one (if any) starts now. */
    public static List<StageState> completeCurrent(List<ExamTimerConfig> timers, List<StageState> stages, long nowMs) {
        List<StageState> result = new ArrayList<>(stages);
        StageState current = result.get(result.size() - 1);
        if (current.isRunning()) {
            result.set(result.size() - 1, current.ended(nowMs, StageState.COMPLETED));
            if (result.size() < timers.size()) result.add(stage(timers.get(result.size()), nowMs));
        }
        return result;
    }

    /** Moves the running stage's deadline later by {@code deltaMs} (the exam was paused); ended stages stay as they are. */
    public static List<StageState> shiftRunning(List<StageState> stages, long deltaMs) {
        List<StageState> result = new ArrayList<>(stages);
        StageState current = result.get(result.size() - 1);
        if (current.isRunning()) result.set(result.size() - 1, current.shifted(deltaMs));
        return result;
    }

    /** True when all stages have been used up (the last one ended). */
    public static boolean allStagesEnded(List<ExamTimerConfig> timers, List<StageState> stages) {
        return stages.size() >= timers.size() && !stages.get(stages.size() - 1).isRunning();
    }

    /** The exam is over once the last stage ended and the grace period for late saves has passed. */
    public static boolean examOver(List<ExamTimerConfig> timers, List<StageState> stages, long nowMs, long graceMs) {
        if (!allStagesEnded(timers, stages)) return false;
        StageState last = stages.get(stages.size() - 1);
        return StageState.COMPLETED.equals(last.endReason()) || nowMs >= last.endedAtMs() + graceMs;
    }

    /** Latest moment at which the exam can still be running: the current deadline plus all stages not yet started. */
    public static long finalDeadlineMs(List<ExamTimerConfig> timers, List<StageState> stages) {
        StageState last = stages.get(stages.size() - 1);
        long end = last.isRunning() ? last.deadlineAtMs() : last.endedAtMs();
        for (int i = stages.size(); i < timers.size(); i++) end += timers.get(i).minutes() * 60_000L;
        return end;
    }

    public static StageState current(List<StageState> stages) {
        return stages.get(stages.size() - 1);
    }

    private static StageState stage(ExamTimerConfig timer, long startMs) {
        return new StageState(timer.key(), startMs, startMs + timer.minutes() * 60_000L, null, null);
    }
}
