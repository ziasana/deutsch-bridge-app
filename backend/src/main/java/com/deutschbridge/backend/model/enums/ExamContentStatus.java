package com.deutschbridge.backend.model.enums;

import java.util.EnumSet;
import java.util.Set;

/**
 * Editorial lifecycle of an exam exercise. Imported content always starts as DRAFT; only PUBLISHED
 * exercises are visible to learners.
 */
public enum ExamContentStatus {
    DRAFT,
    REVIEW,
    APPROVED,
    PUBLISHED,
    REJECTED,
    ARCHIVED;

    /** The statuses an exercise currently in this status may be moved to by an admin. */
    public Set<ExamContentStatus> allowedTargets() {
        return switch (this) {
            case DRAFT -> EnumSet.of(REVIEW, APPROVED, REJECTED, ARCHIVED);
            case REVIEW -> EnumSet.of(DRAFT, APPROVED, REJECTED, ARCHIVED);
            case APPROVED -> EnumSet.of(DRAFT, REVIEW, PUBLISHED, ARCHIVED);
            case PUBLISHED -> EnumSet.of(APPROVED, DRAFT, ARCHIVED);
            case REJECTED -> EnumSet.of(DRAFT, ARCHIVED);
            case ARCHIVED -> EnumSet.of(DRAFT);
        };
    }

    public boolean canMoveTo(ExamContentStatus target) {
        return allowedTargets().contains(target);
    }
}
