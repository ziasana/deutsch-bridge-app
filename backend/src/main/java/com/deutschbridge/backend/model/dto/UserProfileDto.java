package com.deutschbridge.backend.model.dto;

public record UserProfileDto(
         String displayName,
         String password,
         String username,
         String email,
         String learningLevel,
         Integer dailyGoalWords,
         boolean notificationsEnabled
) {
}
