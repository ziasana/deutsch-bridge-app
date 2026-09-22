package com.deutschbridge.backend.model.enums;

import lombok.Getter;

@Getter
public enum LearningReason
{
    WORK ("Work & Career"),
    EVERYDAY_LIFE ("Everyday Life"),
    STUDY ("Study & University"),
    COMMUNICATION ("Communication"),
    EXAM ("Exam Preparation"),
    LIVING_IN_GERMANY ("Living in Germany"),
    PERSONAL_INTEREST ("Personal Interest");

    private final String value;

    LearningReason(String value) { this.value = value; }
}
