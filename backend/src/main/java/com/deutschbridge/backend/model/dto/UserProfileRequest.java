package com.deutschbridge.backend.model.dto;

public record UserProfileRequest(
         String displayName,
         String learningLevel,
         Integer dailyGoalWords,
         boolean notificationsEnabled
) {
}
