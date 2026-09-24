export interface AdminDashboardUsersOverview {
    total: number;
    newToday: number;
}

export interface AdminDashboardContentSummary {
    total: number;
    newThisWeek: number;
}

export interface AdminDashboardPremiumOverview {
    premiumUsers: number;
    totalUsers: number;
    percentage: number;
}

export interface AdminDashboardAiOverview {
    requestsToday: number;
    usagePercentToday: number;
}

export interface AdminDashboardOverview {
    users: AdminDashboardUsersOverview;
    content: AdminDashboardContentSummary;
    premium: AdminDashboardPremiumOverview;
    ai: AdminDashboardAiOverview;
}

export type AttentionItemType = "content" | "user" | "system" | "ai";
export type AttentionPriority = "high" | "medium" | "low";

export interface AttentionItem {
    id: string;
    type: AttentionItemType;
    title: string;
    count: number;
    description?: string;
    href: string;
    priority: AttentionPriority;
}

export interface DailyActivityPoint {
    date: string;
    activeUsers: number;
}

export interface UserActivity {
    today: number;
    thisWeek: number;
    thisMonth: number;
    series: DailyActivityPoint[];
}

export interface ContentOverview {
    grammar: number;
    expressions: number;
    reading: number;
    examExercises: number;
    dailyWords: number;
}

export interface LearningActivityItem {
    key: string;
    label: string;
    value: number;
}

export interface RecentActivity {
    id: string;
    type: string;
    title: string;
    description?: string;
    createdAt: string;
    href?: string;
}

export interface AdminDashboardResponse {
    overview: AdminDashboardOverview;
    attention: AttentionItem[];
    userActivity: UserActivity;
    contentOverview: ContentOverview;
    learningActivity: LearningActivityItem[];
    recentActivity: RecentActivity[];
}
