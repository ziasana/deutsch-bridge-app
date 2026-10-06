import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  MAX_FOCUS,
  initialPlan,
  type Focus,
  type PlanState,
  type Reason,
  type StepId,
} from './plan';

type OnboardingState = PlanState & {
  /** Which account the stored answers belong to — a different account starts from scratch. */
  ownerEmail: string | null;
  step: StepId;
  hydrated: boolean;
  setStep: (step: StepId) => void;
  patch: (update: Partial<PlanState>) => void;
  toggleReason: (reason: Reason) => void;
  toggleFocus: (focus: Focus) => void;
  reset: () => void;
  ensureOwner: (email: string | null | undefined) => void;
};

const fresh = { ...initialPlan, ownerEmail: null as string | null, step: 'language' as StepId };

/**
 * Wizard answers survive an app restart (like the web wizard's persisted store), so a half-finished
 * setup resumes where the learner stopped. They are cleared once the plan is saved.
 */
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...fresh,
      hydrated: false,
      setStep: (step) => set({ step }),
      patch: (update) => set(update),
      toggleReason: (reason) =>
        set((s) => ({
          reasons: s.reasons.includes(reason)
            ? s.reasons.filter((r) => r !== reason)
            : [...s.reasons, reason],
        })),
      toggleFocus: (focus) =>
        set((s) => ({
          focus: s.focus.includes(focus)
            ? s.focus.filter((f) => f !== focus)
            : s.focus.length >= MAX_FOCUS
              ? s.focus
              : [...s.focus, focus],
        })),
      reset: () => set(fresh),
      ensureOwner: (email) =>
        set((s) => {
          const owner = email ?? null;
          return s.ownerEmail === owner ? s : { ...fresh, ownerEmail: owner };
        }),
    }),
    {
      name: 'onboarding-wizard',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        ownerEmail: s.ownerEmail,
        step: s.step,
        language: s.language,
        reasons: s.reasons,
        currentLevel: s.currentLevel,
        currentLevelUnknown: s.currentLevelUnknown,
        targetLevel: s.targetLevel,
        dailyWords: s.dailyWords,
        focus: s.focus,
        examType: s.examType,
        examLevel: s.examLevel,
        hasExamDate: s.hasExamDate,
        examDateText: s.examDateText,
      }),
      onRehydrateStorage: () => () => useOnboardingStore.setState({ hydrated: true }),
    },
  ),
);
