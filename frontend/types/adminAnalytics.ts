export type AnalyticsRange = "7d" | "30d" | "90d";
export type AnalyticsLevel = "ALL" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface AnalyticsPeriod {
    from: string;
    to: string;
}

export interface DailyActivityEntry {
    date: string;
    activeLearners: number;
    activities: number;
}

export interface LearnerActivity {
    dailyActiveLearners: number;
    weeklyActiveLearners: number;
    monthlyActiveLearners: number;
    totalActivities: number;
    daily: DailyActivityEntry[];
}

export interface FeatureUsageEntry {
    module: string;
    uniqueLearners: number;
    activities: number;
    reachPercentage: number;
}

export interface AdminAnalyticsResponse {
    period: AnalyticsPeriod;
    learnerActivity: LearnerActivity;
    featureUsage: FeatureUsageEntry[];
}
