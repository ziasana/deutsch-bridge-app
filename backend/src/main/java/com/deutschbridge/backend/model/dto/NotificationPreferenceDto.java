package com.deutschbridge.backend.model.dto;

/**
 * Learner-editable notification settings. Every field is optional on update (null = unchanged).
 * Times are "HH:mm" strings in the learner's own timezone; timezone is an IANA id like "Europe/Berlin".
 */
public record NotificationPreferenceDto(
        Boolean learningRemindersEnabled,
        Boolean reviewRemindersEnabled,
        Boolean dailyPlanRemindersEnabled,
        Boolean examRemindersEnabled,
        Boolean progressNotificationsEnabled,
        Boolean milestoneNotificationsEnabled,
        Boolean weeklyProgressEnabled,
        Boolean quietHoursEnabled,
        String quietHoursStart,
        String quietHoursEnd,
        String preferredReminderTime,
        String timezone
) {
}
