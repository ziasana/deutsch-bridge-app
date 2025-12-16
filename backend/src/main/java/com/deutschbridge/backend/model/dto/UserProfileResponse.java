package com.deutschbridge.backend.model.dto;

public record UserProfileResponse(
         String displayName,
         String email,
         String learningLevel,
         Integer dailyGoalWords,
         boolean notificationsEnabled
) {
}
