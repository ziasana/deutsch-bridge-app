package com.deutschbridge.backend.model.enums;

/** LEARNING and REMINDER are frequency-limited per day; PROGRESS is capped separately; SYSTEM/PREMIUM
 * ignore the learner's reminder preferences entirely (see NotificationPreferenceService#allows). */
public enum NotificationCategory {
    LEARNING,
    REMINDER,
    PROGRESS,
    SYSTEM,
    PREMIUM
}
