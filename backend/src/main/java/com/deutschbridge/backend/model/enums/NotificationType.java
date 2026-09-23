package com.deutschbridge.backend.model.enums;

import lombok.Getter;

/**
 * Every notification the system can produce. Only the MVP types have rules in NotificationRuleEngine
 * (REVIEW_DUE, DAILY_WORDS_READY, DAILY_PLAN_INCOMPLETE, CONTINUE_LEARNING, MILESTONE_REACHED); the rest
 * are declared up front so the domain model doesn't change as rules are added.
 */
@Getter
public enum NotificationType {

    // Learning
    REVIEW_DUE(NotificationCategory.LEARNING, NotificationPriority.HIGH),
    DAILY_WORDS_READY(NotificationCategory.LEARNING, NotificationPriority.MEDIUM),
    DAILY_PLAN_READY(NotificationCategory.LEARNING, NotificationPriority.MEDIUM),
    DAILY_PLAN_INCOMPLETE(NotificationCategory.REMINDER, NotificationPriority.HIGH),
    CONTINUE_LEARNING(NotificationCategory.LEARNING, NotificationPriority.HIGH),
    GRAMMAR_RECOMMENDATION(NotificationCategory.LEARNING, NotificationPriority.MEDIUM),
    READING_RECOMMENDATION(NotificationCategory.LEARNING, NotificationPriority.MEDIUM),
    LISTENING_RECOMMENDATION(NotificationCategory.LEARNING, NotificationPriority.MEDIUM),
    EXPRESSION_REVIEW(NotificationCategory.LEARNING, NotificationPriority.MEDIUM),
    VOCABULARY_REVIEW(NotificationCategory.LEARNING, NotificationPriority.MEDIUM),

    // Exam
    EXAM_PRACTICE_READY(NotificationCategory.LEARNING, NotificationPriority.HIGH),
    EXAM_PLAN_REMINDER(NotificationCategory.REMINDER, NotificationPriority.HIGH),

    // Progress
    MILESTONE_REACHED(NotificationCategory.PROGRESS, NotificationPriority.MEDIUM),
    DAILY_GOAL_REACHED(NotificationCategory.PROGRESS, NotificationPriority.MEDIUM),
    WEEKLY_PROGRESS(NotificationCategory.PROGRESS, NotificationPriority.LOW),
    STREAK_MILESTONE(NotificationCategory.PROGRESS, NotificationPriority.MEDIUM),

    // System
    WELCOME(NotificationCategory.SYSTEM, NotificationPriority.LOW),
    ACCOUNT_UPDATE(NotificationCategory.SYSTEM, NotificationPriority.CRITICAL),
    SYSTEM_MESSAGE(NotificationCategory.SYSTEM, NotificationPriority.CRITICAL),

    // Premium
    AI_LIMIT_REACHED(NotificationCategory.PREMIUM, NotificationPriority.LOW),
    PREMIUM_FEATURE_AVAILABLE(NotificationCategory.PREMIUM, NotificationPriority.LOW),
    PREMIUM_EXPIRING(NotificationCategory.PREMIUM, NotificationPriority.MEDIUM);

    private final NotificationCategory category;
    private final NotificationPriority defaultPriority;

    NotificationType(NotificationCategory category, NotificationPriority defaultPriority) {
        this.category = category;
        this.defaultPriority = defaultPriority;
    }
}
