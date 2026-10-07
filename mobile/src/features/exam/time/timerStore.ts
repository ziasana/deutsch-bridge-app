import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ExamSection } from '@/types/exam';
import type {
  ExamPracticeScope,
  ExamPracticeSession,
  ExamPracticeSessionResult,
  ExamTimeMode,
} from '@/types/examTime';
import type { TimerClock, WarningStage } from './examTime';

export const EXAM_TIMER_STORAGE_KEY = 'exam-timer-storage';

/** The one timed run in progress. Persisted, so it survives app restarts and navigation. */
export interface ActiveExamTimer extends TimerClock {
  sessionId: string;
  scope: ExamPracticeScope;
  mode: ExamTimeMode;
  section: ExamSection;
  level: string | null;
  teil: number | null;
  exerciseId: string | null;
  /** Null when there is nothing to measure against (practice mode or no configuration). */
  targetSeconds: number | null;
  /** Warning stages already shown, so each is announced once. */
  announced: WarningStage[];
  /** Stages whose message the learner closed. */
  dismissed: WarningStage[];
}

type ExamTimerState = {
  active: ActiveExamTimer | null;
  /** Latest finished run: the Zeit-Check on a Teil's list. */
  lastResult: ExamPracticeSessionResult | null;
  /** Bumped by "Erneut üben" so the exercise timer begins a fresh run. Not persisted. */
  restartSignal: number;
  hasHydrated: boolean;
  start: (session: ExamPracticeSession, nowMs?: number) => void;
  pause: (nowMs?: number) => void;
  resume: (nowMs?: number) => void;
  markAnnounced: (stages: WarningStage[]) => void;
  dismissWarning: (stage: WarningStage) => void;
  clear: () => void;
  setLastResult: (result: ExamPracticeSessionResult | null) => void;
  requestRestart: () => void;
  setHasHydrated: (value: boolean) => void;
};

const union = <T>(a: T[], b: T[]) => Array.from(new Set([...a, ...b]));

export const useExamTimerStore = create<ExamTimerState>()(
  persist(
    (set) => ({
      active: null,
      lastResult: null,
      restartSignal: 0,
      hasHydrated: false,

      // The UI clock starts when the response arrives; the server keeps its own authoritative start.
      start: (session, nowMs = Date.now()) =>
        set({
          active: {
            sessionId: session.id,
            scope: session.scope,
            mode: session.mode,
            section: session.section,
            level: session.level,
            teil: session.teil,
            exerciseId: session.exerciseId,
            targetSeconds: session.targetSeconds,
            startedAtMs: nowMs,
            pausedAtMs: null,
            pausedTotalMs: 0,
            announced: [],
            dismissed: [],
          },
        }),

      pause: (nowMs = Date.now()) =>
        set((s) =>
          s.active && s.active.pausedAtMs == null
            ? { active: { ...s.active, pausedAtMs: nowMs } }
            : s,
        ),

      resume: (nowMs = Date.now()) =>
        set((s) =>
          s.active && s.active.pausedAtMs != null
            ? {
                active: {
                  ...s.active,
                  pausedTotalMs: s.active.pausedTotalMs + (nowMs - s.active.pausedAtMs),
                  pausedAtMs: null,
                },
              }
            : s,
        ),

      markAnnounced: (stages) =>
        set((s) =>
          s.active ? { active: { ...s.active, announced: union(s.active.announced, stages) } } : s,
        ),
      dismissWarning: (stage) =>
        set((s) =>
          s.active ? { active: { ...s.active, dismissed: union(s.active.dismissed, [stage]) } } : s,
        ),
      clear: () => set({ active: null }),
      setLastResult: (lastResult) => set({ lastResult }),
      requestRestart: () => set((s) => ({ restartSignal: s.restartSignal + 1 })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: EXAM_TIMER_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ active: s.active, lastResult: s.lastResult }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
