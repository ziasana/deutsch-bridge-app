package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.PreferredLanguage;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record UserProfileResponse(
         String displayName,
         String email,
         String learningLevel,
         Integer dailyGoalWords,
         boolean notificationsEnabled,
         PreferredLanguage preferredLanguage,
         String role,
         String avatarUrl,
         Instant createdAt,
         boolean onboardingCompleted,
         List<String> learningReasons,
         boolean currentLevelUnknown,
         String targetLevel,
         List<String> focusAreas,
         String examType,
         String examLevel,
         LocalDate examDate
) {
}
