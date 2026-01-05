package com.deutschbridge.backend.model.dto;

import com.deutschbridge.backend.model.enums.PreferredLanguage;

public record UserProfileResponse(
         String displayName,
         String email,
         String learningLevel,
         Integer dailyGoalWords,
         boolean notificationsEnabled,
         PreferredLanguage preferredLanguage
) {
}
