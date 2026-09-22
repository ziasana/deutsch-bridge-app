package com.deutschbridge.backend.model.dto;

import java.time.LocalDate;
import java.util.List;

public record OnboardingRequest(
        String preferredLanguage,
        List<String> learningReasons,
        String currentLevel,
        boolean currentLevelUnknown,
        String targetLevel,
        Integer dailyGoalWords,
        List<String> focusAreas,
        String examType,
        String examLevel,
        LocalDate examDate
) {
}
