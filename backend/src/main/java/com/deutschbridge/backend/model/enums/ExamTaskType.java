package com.deutschbridge.backend.model.enums;

/**
 * Leseverstehen-specific task types (real Telc exam parts). Kept scoped to this section rather
 * than shared - Sprachbausteine/Hoerverstehen will likely need their own task-type values later.
 */
public enum ExamTaskType {
    MATCHING,
    MULTIPLE_CHOICE,
    TRUE_FALSE_NOT_GIVEN
}
