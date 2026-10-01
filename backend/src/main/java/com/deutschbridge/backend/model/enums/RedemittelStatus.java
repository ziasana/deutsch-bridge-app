package com.deutschbridge.backend.model.enums;

/** Learning state of a Redemittel for one user. "New" is the absence of a progress row. */
public enum RedemittelStatus {
    NEW,
    LEARNING,
    REVIEW,
    MASTERED
}
