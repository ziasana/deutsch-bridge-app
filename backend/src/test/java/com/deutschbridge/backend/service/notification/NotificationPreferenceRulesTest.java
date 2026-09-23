package com.deutschbridge.backend.service.notification;

import com.deutschbridge.backend.model.entity.NotificationPreference;
import com.deutschbridge.backend.model.enums.NotificationType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class NotificationPreferenceRulesTest {

    @Test
    @DisplayName("defaults -> every MVP notification type is allowed")
    void defaultsAllowEverything() {
        NotificationPreference pref = new NotificationPreference();
        for (NotificationType type : NotificationSettingsService.MANAGED_TYPES) {
            assertTrue(NotificationPreferenceService.allows(pref, type), type.name());
        }
    }

    @Test
    @DisplayName("review reminders disabled -> REVIEW_DUE blocked, other learning types still allowed")
    void reviewReminderDisabled() {
        NotificationPreference pref = new NotificationPreference();
        pref.setReviewRemindersEnabled(false);

        assertFalse(NotificationPreferenceService.allows(pref, NotificationType.REVIEW_DUE));
        assertTrue(NotificationPreferenceService.allows(pref, NotificationType.DAILY_WORDS_READY));
    }

    @Test
    @DisplayName("learning reminders (master) disabled -> all learning/reminder types blocked, progress kept")
    void masterSwitchDisabled() {
        NotificationPreference pref = new NotificationPreference();
        pref.setLearningRemindersEnabled(false);

        assertFalse(NotificationPreferenceService.allows(pref, NotificationType.REVIEW_DUE));
        assertFalse(NotificationPreferenceService.allows(pref, NotificationType.DAILY_PLAN_INCOMPLETE));
        assertFalse(NotificationPreferenceService.allows(pref, NotificationType.CONTINUE_LEARNING));
        assertTrue(NotificationPreferenceService.allows(pref, NotificationType.MILESTONE_REACHED));
    }

    @Test
    @DisplayName("milestones disabled -> MILESTONE_REACHED blocked")
    void milestonesDisabled() {
        NotificationPreference pref = new NotificationPreference();
        pref.setMilestoneNotificationsEnabled(false);

        assertFalse(NotificationPreferenceService.allows(pref, NotificationType.MILESTONE_REACHED));
    }

    @Test
    @DisplayName("system notifications ignore learning-reminder settings entirely")
    void systemAlwaysAllowed() {
        NotificationPreference pref = new NotificationPreference();
        pref.setLearningRemindersEnabled(false);
        pref.setProgressNotificationsEnabled(false);

        assertTrue(NotificationPreferenceService.allows(pref, NotificationType.SYSTEM_MESSAGE));
        assertTrue(NotificationPreferenceService.allows(pref, NotificationType.ACCOUNT_UPDATE));
    }
}
