import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    CEFRLevel,
    ExamType,
    ExplanationLanguage,
    LearningFocus,
    LearningReason,
} from "@/types/onboarding";

export type OnboardingStepId =
    | "language"
    | "reason"
    | "currentLevel"
    | "targetLevel"
    | "dailyWords"
    | "focus"
    | "exam";

export const BASE_STEPS: OnboardingStepId[] = [
    "language",
    "reason",
    "currentLevel",
    "targetLevel",
    "dailyWords",
    "focus",
];

interface OnboardingState {
    // Which account this in-progress wizard state belongs to. The store persists to
    // localStorage so a mid-flow refresh can resume — but without this, a brand-new signup
    // (or a different account logging in on the same browser) would inherit whatever step/
    // answers were left behind by the previous account. ensureOwner() resets the wizard
    // whenever the logged-in email doesn't match.
    ownerEmail: string | null;
    currentStepId: OnboardingStepId;

    explanationLanguage?: ExplanationLanguage;
    learningReasons: LearningReason[];
    currentLevel?: CEFRLevel;
    currentLevelUnknown: boolean;
    targetLevel?: CEFRLevel;
    dailyGoalWords?: number;
    focusAreas: LearningFocus[];

    examType?: ExamType;
    examLevel?: CEFRLevel;
    examDate?: string;
    hasExamDate: boolean;

    setStep: (step: OnboardingStepId) => void;
    setExplanationLanguage: (v: ExplanationLanguage) => void;
    toggleLearningReason: (v: LearningReason) => void;
    setCurrentLevel: (v: CEFRLevel | undefined, unknown?: boolean) => void;
    setTargetLevel: (v: CEFRLevel) => void;
    setDailyGoalWords: (v: number) => void;
    toggleFocusArea: (v: LearningFocus) => void;
    setExamType: (v: ExamType) => void;
    setExamLevel: (v: CEFRLevel) => void;
    setExamDate: (v: string | undefined) => void;
    setHasExamDate: (v: boolean) => void;
    reset: () => void;
    ensureOwner: (email: string | null | undefined) => void;
}

const initialState = {
    ownerEmail: null as string | null,
    currentStepId: "language" as OnboardingStepId,
    explanationLanguage: undefined,
    learningReasons: [] as LearningReason[],
    currentLevel: undefined,
    currentLevelUnknown: false,
    targetLevel: undefined,
    dailyGoalWords: 5,
    focusAreas: [] as LearningFocus[],
    examType: undefined,
    examLevel: undefined,
    examDate: undefined,
    hasExamDate: false,
};

const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            ...initialState,

            setStep: (currentStepId) => set({ currentStepId }),

            setExplanationLanguage: (explanationLanguage) => set({ explanationLanguage }),

            toggleLearningReason: (reason) =>
                set((state) => ({
                    learningReasons: state.learningReasons.includes(reason)
                        ? state.learningReasons.filter((r) => r !== reason)
                        : [...state.learningReasons, reason],
                })),

            setCurrentLevel: (currentLevel, unknown = false) =>
                set({ currentLevel, currentLevelUnknown: unknown }),

            setTargetLevel: (targetLevel) => set({ targetLevel }),

            setDailyGoalWords: (dailyGoalWords) => set({ dailyGoalWords }),

            toggleFocusArea: (area) =>
                set((state) => ({
                    focusAreas: state.focusAreas.includes(area)
                        ? state.focusAreas.filter((a) => a !== area)
                        : state.focusAreas.length >= 3
                            ? state.focusAreas
                            : [...state.focusAreas, area],
                })),

            setExamType: (examType) => set({ examType }),
            setExamLevel: (examLevel) => set({ examLevel }),
            setExamDate: (examDate) => set({ examDate }),
            setHasExamDate: (hasExamDate) => set({ hasExamDate }),

            reset: () => set(initialState),

            ensureOwner: (email) =>
                set((state) => {
                    const normalized = email ?? null;
                    if (state.ownerEmail === normalized) return state;
                    return { ...initialState, ownerEmail: normalized };
                }),
        }),
        {
            name: "onboarding-storage",
        }
    )
);

export default useOnboardingStore;
