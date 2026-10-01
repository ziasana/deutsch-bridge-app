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
        ExamSection section = exercise.getSection();
        if (section == null) return null;
        return switch (section) {
            case LESEVERSTEHEN, HOERVERSTEHEN -> exercise.getPartNumber() != null ? exercise.getPartNumber() : 1;
            case SPRACHBAUSTEINE -> sprachbausteineTeil(exercise);
            case SCHRIFTLICHER_AUSDRUCK -> 1;
            case TESTFORMAT_INFORMATION -> null;
        };
    }

    private static Integer sprachbausteineTeil(ExamExercise exercise) {
        ExamTaskType taskType = exercise.getTaskType();
        if (taskType == ExamTaskType.MULTIPLE_CHOICE) return 1;
        if (taskType == ExamTaskType.WORD_BANK_CLOZE) return 2;
        return exercise.getPartNumber();
    }
}
