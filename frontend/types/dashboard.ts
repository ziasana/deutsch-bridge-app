export type ContinueLearningType =
    | "DAILY_WORDS"
    | "VOCAB_REVIEW"
    | "GRAMMAR"
    | "READING"
    | "EXPRESSIONS"
    | "START";

export interface ContinueLearningDto {
    type: ContinueLearningType;
    title: string | null;
    progressPercent: number | null;
    completed: number;
    total: number;
    route: string;
}

export type PlanActivityType = "DAILY_WORDS" | "VOCAB_REVIEW" | "GRAMMAR" | "READING";

export interface PlanActivityDto {
    type: PlanActivityType;
    completed: boolean;
    route: string;
}

export interface TodaysPlanDto {
    completed: number;
    total: number;
    activities: PlanActivityDto[];
}

export interface ReviewNeededDto {
    wordsDue: number;
    expressionsDue: number;
}

export type FocusArea = "VOCABULARY" | "GRAMMAR" | "READING" | "EXPRESSIONS" | null;

export interface CurrentFocusDto {
    area: FocusArea;
    route: string | null;
}

export interface WeekSummaryDto {
    days: boolean[];
    learningDays: number;
    totalDays: number;
}

export interface MilestoneDto {
    wordsMastered: number;
    nextThreshold: number;
}

export interface NewContentDto {
    grammarLessons: number;
    readingArticles: number;
    expressions: number;
    total: number;
}

export interface DashboardUserDto {
    displayName: string;
    learningLevel: string;
}

export interface DashboardResponse {
    user: DashboardUserDto;
    currentStreak: number;
    continueLearning: ContinueLearningDto;
    today: TodaysPlanDto;
    review: ReviewNeededDto;
    focus: CurrentFocusDto;
    week: WeekSummaryDto;
    milestone: MilestoneDto | null;
    newContent: NewContentDto | null;
}
