export interface CategoryProgress {
    learned: number;
    total: number;
}

export interface OverviewResponse {
    dailyGoalWords: number | null;
    itemsLearnedToday: number;
    dailyWords: CategoryProgress;
    grammar: CategoryProgress;
    expressions: CategoryProgress;
    reading: CategoryProgress;
    totalLearned: number;
    totalAvailable: number;
}

export interface MasteryBreakdown {
    newCount: number;
    learning: number;
    familiar: number;
    mastered: number;
    total: number;
}

export interface ExpressionMasteryBreakdown {
    newCount: number;
    learning: number;
    familiar: number;
    active: number;
    mastered: number;
    total: number;
}

export interface GrammarMastery {
    lessonsLearned: number;
    lessonsTotal: number;
    categoriesPassed: number;
    categoriesAttempted: number;
    categoriesTotal: number;
}

export interface ExamPerformance {
    averageScore: number | null;
    attemptsCompleted: number;
}

export interface MilestoneLadder {
    wordsMastered: number;
    thresholds: number[];
    reached: boolean[];
    nextThreshold: number | null;
}

export interface ProgressStatsResponse {
    milestones: MilestoneLadder;
    vocabulary: MasteryBreakdown;
    expressions: ExpressionMasteryBreakdown;
    grammar: GrammarMastery;
    reading: CategoryProgress;
    examPerformance: ExamPerformance;
}
