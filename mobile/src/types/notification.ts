export type NotificationCategory = 'LEARNING' | 'REMINDER' | 'PROGRESS' | 'SYSTEM' | 'PREMIUM';

export interface NotificationItem {
  id: string;
  type: string;
  category: NotificationCategory;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  /** In-app destination chosen by the backend (a *web* path; see toMobileHref). */
  actionUrl: string | null;
  read: boolean;
  status: string;
  createdAt: string;
}

export interface NotificationPage {
  items: NotificationItem[];
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
