package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamType;
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

    /** Telc parts the app supports, in display order. Hörverstehen is audio-paced, so it has no Teil timer. */
    public static final List<Part> SUPPORTED_PARTS = List.of(
            new Part(ExamSection.LESEVERSTEHEN, 1),
            new Part(ExamSection.LESEVERSTEHEN, 2),
            new Part(ExamSection.LESEVERSTEHEN, 3),
            new Part(ExamSection.SPRACHBAUSTEINE, 1),
            new Part(ExamSection.SPRACHBAUSTEINE, 2),
            new Part(ExamSection.SCHRIFTLICHER_AUSDRUCK, 1),
            new Part(ExamSection.MUENDLICHER_AUSDRUCK, 1),
            new Part(ExamSection.MUENDLICHER_AUSDRUCK, 2),
            new Part(ExamSection.MUENDLICHER_AUSDRUCK, 3));

    /**
     * Sections that are NOT part of the exam's total-duration block. Schriftlicher Ausdruck is
     * written in its own timed slot and Mündlicher Ausdruck is a separate oral exam, so both are
     * excluded from the "sum of Teile vs total" check.
     */
    public static final Set<ExamSection> OUTSIDE_TOTAL_DURATION = Set.of(ExamSection.SCHRIFTLICHER_AUSDRUCK, ExamSection.MUENDLICHER_AUSDRUCK);

    /**
     * DTZ A2-B1 parts, in display order: Lesen Teil 1-5, Schreiben (Aufgabe A or B, one Teil) and the three Teile of the Mündliche
     * Prüfung. Hören is paced by the audio and Sprachbausteine do not exist in the DTZ.
     */
    public static final List<Part> DTZ_SUPPORTED_PARTS = List.of(
            new Part(ExamSection.LESEVERSTEHEN, 1),
            new Part(ExamSection.LESEVERSTEHEN, 2),
            new Part(ExamSection.LESEVERSTEHEN, 3),
            new Part(ExamSection.LESEVERSTEHEN, 4),
            new Part(ExamSection.LESEVERSTEHEN, 5),
            new Part(ExamSection.SCHRIFTLICHER_AUSDRUCK, 1),
            new Part(ExamSection.MUENDLICHER_AUSDRUCK, 1),
            new Part(ExamSection.MUENDLICHER_AUSDRUCK, 2),
            new Part(ExamSection.MUENDLICHER_AUSDRUCK, 3));

    /** The exams that can carry a timing configuration. */
    public static final Set<ExamType> TIMED_EXAMS = Set.of(ExamType.TELC, ExamType.DTZ);

    public static List<Part> supportedParts(ExamType examType) {
        return examType == ExamType.DTZ ? DTZ_SUPPORTED_PARTS : SUPPORTED_PARTS;
    }

    public static boolean isSupported(ExamSection section, int teil) {
        return isSupported(ExamType.TELC, section, teil);
    }

    public static boolean isSupported(ExamType examType, ExamSection section, int teil) {
        return supportedParts(examType).contains(new Part(section, teil));
    }

    /** Defaults exist for B1 only; other levels start unconfigured. */
    public static final Map<LearningLevel, Map<Part, Integer>> DEFAULT_MINUTES = Map.of(
            LearningLevel.B1, Map.of(
                    new Part(ExamSection.LESEVERSTEHEN, 1), 15,
                    new Part(ExamSection.LESEVERSTEHEN, 2), 20,
                    new Part(ExamSection.LESEVERSTEHEN, 3), 20,
                    new Part(ExamSection.SPRACHBAUSTEINE, 1), 15,
                    new Part(ExamSection.SPRACHBAUSTEINE, 2), 15,
                    new Part(ExamSection.SCHRIFTLICHER_AUSDRUCK, 1), 30,
                    new Part(ExamSection.MUENDLICHER_AUSDRUCK, 1), 3,
                    new Part(ExamSection.MUENDLICHER_AUSDRUCK, 2), 4,
                    new Part(ExamSection.MUENDLICHER_AUSDRUCK, 3), 5));

    public static final Map<LearningLevel, Integer> DEFAULT_TOTAL_MINUTES = Map.of(LearningLevel.B1, 90);

    /**
     * DTZ training defaults (stored at level B1): the Lesen Teile add up to the 60 minutes of the Lesen block, Schreiben and the oral
     * exam are separate slots. Application targets, editable by the admin.
     */
    public static final Map<LearningLevel, Map<Part, Integer>> DTZ_DEFAULT_MINUTES = Map.of(
            LearningLevel.B1, Map.of(
                    new Part(ExamSection.LESEVERSTEHEN, 1), 8,
                    new Part(ExamSection.LESEVERSTEHEN, 2), 12,
                    new Part(ExamSection.LESEVERSTEHEN, 3), 14,
                    new Part(ExamSection.LESEVERSTEHEN, 4), 12,
                    new Part(ExamSection.LESEVERSTEHEN, 5), 14,
                    new Part(ExamSection.SCHRIFTLICHER_AUSDRUCK, 1), 30,
                    new Part(ExamSection.MUENDLICHER_AUSDRUCK, 1), 2,
                    new Part(ExamSection.MUENDLICHER_AUSDRUCK, 2), 4,
                    new Part(ExamSection.MUENDLICHER_AUSDRUCK, 3), 4));

    public static final Map<LearningLevel, Integer> DTZ_DEFAULT_TOTAL_MINUTES = Map.of(LearningLevel.B1, 60);

    public static Map<LearningLevel, Map<Part, Integer>> defaultMinutes(ExamType examType) {
        return examType == ExamType.DTZ ? DTZ_DEFAULT_MINUTES : DEFAULT_MINUTES;
    }

    public static Map<LearningLevel, Integer> defaultTotalMinutes(ExamType examType) {
        return examType == ExamType.DTZ ? DTZ_DEFAULT_TOTAL_MINUTES : DEFAULT_TOTAL_MINUTES;
    }
}
