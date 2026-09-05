export interface RecentVocabularyType {
    id: string,
    word: string;
    meaning: string,
    status: string;
}

export interface CategoryProgress {
    learned: number;
    total: number;
}

export interface OverviewResponse {
    dailyGoalWords: number | null;
    itemsLearnedToday: number;
    dailyWords: CategoryProgress;
    grammar: CategoryProgress;
    nomenVerb: CategoryProgress;
    totalLearned: number;
    totalAvailable: number;
}

export interface StreakResponse {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
}
