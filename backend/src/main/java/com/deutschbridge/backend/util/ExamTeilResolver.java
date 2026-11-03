package com.deutschbridge.backend.util;

import com.deutschbridge.backend.model.entity.ExamExercise;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;

/**
 * Which "Teil" an exercise belongs to. Mirrors the grouping the learner UI uses (examData.ts):
 * Lesen/Hören use partNumber, Sprachbausteine derive it from the task type, and Schriftlicher
 * Ausdruck is a single Teil. Returns null for sections without Teile (Testformat).
 */
public final class ExamTeilResolver {

    private ExamTeilResolver() {
    }

    public static Integer teilOf(ExamExercise exercise) {
        return teilOf(exercise.getSection(), exercise.getTaskType(), exercise.getPartNumber());
    }

    /** The same rule from the three columns it depends on (for list rows that do not load the whole exercise). */
    public static Integer teilOf(ExamSection section, ExamTaskType taskType, Integer partNumber) {
        if (section == null) return null;
        return switch (section) {
            case LESEVERSTEHEN, HOERVERSTEHEN -> partNumber != null ? partNumber : 1;
            case SPRACHBAUSTEINE -> sprachbausteineTeil(taskType, partNumber);
            case SCHRIFTLICHER_AUSDRUCK -> 1;
            case MUENDLICHER_AUSDRUCK -> partNumber != null ? partNumber : 1;
            case TESTFORMAT_INFORMATION -> null;
        };
    }

    private static Integer sprachbausteineTeil(ExamTaskType taskType, Integer partNumber) {
        if (taskType == ExamTaskType.MULTIPLE_CHOICE) return 1;
        if (taskType == ExamTaskType.WORD_BANK_CLOZE) return 2;
        return partNumber;
    }
}
