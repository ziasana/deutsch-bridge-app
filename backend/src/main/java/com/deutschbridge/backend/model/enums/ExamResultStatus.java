package com.deutschbridge.backend.model.enums;

public enum ExamResultStatus {
    PASSED,
    NOT_PASSED,
    /** At least one manual assessment is still outstanding, so the result is not final. */
    AWAITING_ASSESSMENT,
    /** The component is not scored (e.g. oral practice in V1). */
    NOT_ASSESSED,
    /** Overall result cannot be declared because a required component was not assessed. */
    INCOMPLETE
}
