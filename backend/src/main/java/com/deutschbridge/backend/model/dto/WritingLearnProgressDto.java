package com.deutschbridge.backend.model.dto;

/** One finished station (used for both requests and responses; station/level come from the URL on write). */
public record WritingLearnProgressDto(String station, int correct, int total) {
}
