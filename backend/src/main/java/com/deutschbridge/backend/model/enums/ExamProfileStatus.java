package com.deutschbridge.backend.model.enums;

/** Lifecycle of an exam profile version. Only DRAFT versions are editable; only PUBLISHED versions can start attempts. */
public enum ExamProfileStatus {
    DRAFT, PUBLISHED, DEACTIVATED, ARCHIVED
}
