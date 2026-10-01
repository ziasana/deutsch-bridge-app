package com.deutschbridge.backend.model.enums;

/** How a learner is timed while practising. Real Exam (one continuous countdown) is not built yet. */
public enum ExamTimeMode {
    /** Stopwatch only: no target, no warnings. */
    PRACTICE,
    /** Count up against the configured Teil target, with subtle threshold feedback. */
    TIME_TRAINING
}
