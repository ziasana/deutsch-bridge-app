package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.dto.ExamContentDtos.Issue;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Request / response shapes of the "Mündlicher Ausdruck lernen" content (learner read, admin edit). */
public final class SpeakingGuideDtos {

    private SpeakingGuideDtos() {
    }

    public record GuideResponse(String level, int part, Map<String, Object> content, LocalDateTime updatedAt) {
    }

    /** One finished learning station of a Teil with the learner's best first-try quiz result. */
    public record LearnProgress(int part, String station, int correct, int total) {
    }

    public record SaveRequest(Map<String, Object> content, Boolean dryRun) {
    }

    /** {@code saved} is false when the content has errors (or on a dry run); the issues say what to fix. */
    public record SaveResult(boolean saved, List<Issue> issues, GuideResponse guide) {
    }
}
