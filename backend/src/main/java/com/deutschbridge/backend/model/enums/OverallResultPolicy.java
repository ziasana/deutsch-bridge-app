package com.deutschbridge.backend.model.enums;

public enum OverallResultPolicy {
    /** Overall pass needs a passed written AND a passed, assessed oral examination. */
    WRITTEN_AND_ORAL_REQUIRED,
    /** The overall result equals the written result (oral is informational). */
    WRITTEN_ONLY
}
