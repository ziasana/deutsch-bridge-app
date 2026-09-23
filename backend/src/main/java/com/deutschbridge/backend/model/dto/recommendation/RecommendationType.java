package com.deutschbridge.backend.model.dto.recommendation;

import lombok.Getter;

/** {@code dashboardType} is the ContinueLearningDto.type the dashboard's hero card renders for this recommendation. */
@Getter
public enum RecommendationType {
    VOCAB_REVIEW("VOCAB_REVIEW"),
    CONTINUE_READING("READING"),
    CONTINUE_EXAM("EXAM"),
    EXAM_PRACTICE("EXAM"),
    DAILY_WORDS("DAILY_WORDS"),
    GRAMMAR("GRAMMAR"),
    READING("READING"),
    EXPRESSIONS("EXPRESSIONS"),
    START("START");

    private final String dashboardType;

    RecommendationType(String dashboardType) {
        this.dashboardType = dashboardType;
    }
}
