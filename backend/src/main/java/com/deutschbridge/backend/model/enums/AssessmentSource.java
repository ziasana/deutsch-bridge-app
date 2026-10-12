package com.deutschbridge.backend.model.enums;

/** Only MANUAL assessments are official; an AI estimate is stored separately and never counted. */
public enum AssessmentSource {
    MANUAL, AI_ESTIMATE
}
