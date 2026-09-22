export type ExplanationLanguage = "EN" | "PR";

export type LearningReason =
    | "WORK"
    | "EVERYDAY_LIFE"
    | "STUDY"
    | "COMMUNICATION"
    | "EXAM"
    | "LIVING_IN_GERMANY"
    | "PERSONAL_INTEREST";

export type LearningFocus =
    | "VOCABULARY"
    | "GRAMMAR"
    | "SPEAKING"
    | "LISTENING"
    | "READING"
    | "WRITING"
    | "EXPRESSIONS"
    | "EXAM";

export type ExamType = "TELC" | "GOETHE" | "TESTDAF" | "DSH" | "OTHER";

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface OnboardingRequest {
    preferredLanguage: ExplanationLanguage;
    learningReasons: LearningReason[];
    currentLevel: CEFRLevel | null;
    currentLevelUnknown: boolean;
    targetLevel: CEFRLevel;
    dailyGoalWords: number;
    focusAreas: LearningFocus[];
    examType: ExamType | null;
    examLevel: CEFRLevel | null;
    examDate: string | null;
}
