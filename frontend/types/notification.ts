export type NotificationCategory = "LEARNING" | "REMINDER" | "PROGRESS" | "SYSTEM" | "PREMIUM";

export interface NotificationItemDto {
    id: string;
    type: string;
    category: NotificationCategory;
    title: string;
    body: string | null;
    entityType: string | null;
    entityId: string | null;
    /** Structured in-app destination chosen by the backend - never derived from the text. */
    actionUrl: string | null;
    read: boolean;
    status: string;
    createdAt: string;
}

export interface NotificationPage {
    items: NotificationItemDto[];
    page: number;
    size: number;
    totalElements: number;
    hasNext: boolean;
}

export interface NotificationPreferences {
    learningRemindersEnabled: boolean;
    reviewRemindersEnabled: boolean;
    dailyPlanRemindersEnabled: boolean;
    examRemindersEnabled: boolean;
    progressNotificationsEnabled: boolean;
    milestoneNotificationsEnabled: boolean;
    weeklyProgressEnabled: boolean;
    quietHoursEnabled: boolean;
    /** "HH:mm" in the learner's timezone */
    quietHoursStart: string;
    quietHoursEnd: string;
    preferredReminderTime: string;
    timezone: string | null;
}

export interface AdminNotificationSettings {
    enabled: boolean;
    maxLearningPerDay: number;
    maxReminderPerDay: number;
    defaultReminderTime: string;
    quietHoursStart: string;
    quietHoursEnd: string;
    types: Record<string, boolean>;
    minGapMinutes: number;
    testModeEnabled: boolean;
    testUserEmails: string[];
}

export interface NotificationTemplate {
    templateKey: string;
    language: "de" | "en" | "fa";
    title: string;
    body: string | null;
    placeholders: string[];
    defaultTitle: string | null;
    defaultBody: string | null;
}

export interface FunnelRow {
    type: string;
    sent: number;
    opened: number;
    clicked: number;
    completed: number;
    clickRate: number;
    conversionRate: number;
}

export interface NotificationAnalytics {
    days: number;
    totals: FunnelRow;
    byType: FunnelRow[];
}
