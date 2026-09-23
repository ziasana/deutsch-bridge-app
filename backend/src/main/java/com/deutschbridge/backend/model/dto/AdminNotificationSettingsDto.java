package com.deutschbridge.backend.model.dto;

import java.util.List;
import java.util.Map;

/**
 * Global notification configuration as edited on the admin Notifications page. Times are "HH:mm".
 * Test mode lets "Run evaluation now" ignore timing rules, and only for the listed test learners.
 */
public record AdminNotificationSettingsDto(
        boolean enabled,
        int maxLearningPerDay,
        int maxReminderPerDay,
        String defaultReminderTime,
        String quietHoursStart,
        String quietHoursEnd,
        Map<String, Boolean> types,
        int minGapMinutes,
        boolean testModeEnabled,
        List<String> testUserEmails
) {
}
