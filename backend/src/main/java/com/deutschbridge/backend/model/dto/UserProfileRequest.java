package com.deutschbridge.backend.model.dto;

/** notificationsEnabled is optional (null = unchanged); it's now mirrored from NotificationPreference. */
public record UserProfileRequest(
         String displayName,
         String learningLevel,
         Integer dailyGoalWords,
         Boolean notificationsEnabled,
         String preferredLanguage
) {
}
