package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.LearningLevel;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * The exam parts that can carry a timing configuration, plus the training defaults used for
 * seeding and "Reset to defaults". The defaults are application training targets, not official
 * per-Teil telc limits - telc only publishes a combined time for the reading block.
 */
public final class ExamTimeDefaults {

    private ExamTimeDefaults() {
    }

    public record Part(ExamSection section, int teil) {
    }

    /** Parts the app supports today, in display order. Hörverstehen is audio-paced, so it has no Teil timer. */
    public static final List<Part> SUPPORTED_PARTS = List.of(
            new Part(ExamSection.LESEVERSTEHEN, 1),
            new Part(ExamSection.LESEVERSTEHEN, 2),
            new Part(ExamSection.LESEVERSTEHEN, 3),
            new Part(ExamSection.SPRACHBAUSTEINE, 1),
            new Part(ExamSection.SPRACHBAUSTEINE, 2),
            new Part(ExamSection.SCHRIFTLICHER_AUSDRUCK, 1));

    /**
     * Sections that are NOT part of the exam's total-duration block. Schriftlicher Ausdruck is
     * written in its own timed slot, so it is excluded from the "sum of Teile vs total" check.
     */
    public static final Set<ExamSection> OUTSIDE_TOTAL_DURATION = Set.of(ExamSection.SCHRIFTLICHER_AUSDRUCK);

    public static boolean isSupported(ExamSection section, int teil) {
        return SUPPORTED_PARTS.contains(new Part(section, teil));
    }

    /** Defaults exist for B1 only; other levels start unconfigured. */
    public static final Map<LearningLevel, Map<Part, Integer>> DEFAULT_MINUTES = Map.of(
            LearningLevel.B1, Map.of(
                    new Part(ExamSection.LESEVERSTEHEN, 1), 15,
                    new Part(ExamSection.LESEVERSTEHEN, 2), 20,
                    new Part(ExamSection.LESEVERSTEHEN, 3), 20,
                    new Part(ExamSection.SPRACHBAUSTEINE, 1), 15,
                    new Part(ExamSection.SPRACHBAUSTEINE, 2), 15,
                    new Part(ExamSection.SCHRIFTLICHER_AUSDRUCK, 1), 30));

    public static final Map<LearningLevel, Integer> DEFAULT_TOTAL_MINUTES = Map.of(LearningLevel.B1, 90);
}
