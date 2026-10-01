import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ExamSection } from "@/types/exam";
import { ExamPracticeScope, ExamPracticeSession, ExamPracticeSessionResult, ExamTimeMode } from "@/types/examTime";
import { TimerClock, WarningStage } from "@/lib/examTime";

/** The one timed run in progress. Persisted, so it survives reloads and navigation. */
export interface ActiveExamTimer extends TimerClock {
    sessionId: string;
    scope: ExamPracticeScope;
    mode: ExamTimeMode;
    section: ExamSection;
    level: string | null;
    teil: number | null;
    exerciseId: string | null;
    /** Null when there is nothing to measure against: practice mode or no configuration. */
    targetSeconds: number | null;
    /** Warning stages already shown, so each is only announced once. */
    announced: WarningStage[];
    /** Stages whose message the learner closed. */
    dismissed: WarningStage[];
}

interface ExamTimerState {
    active: ActiveExamTimer | null;
    /** The most recently finished run, shown as the Zeit-Check above a Teil's Übungen. */
    lastResult: ExamPracticeSessionResult | null;
    /** Bumped when the learner restarts an exercise ("Erneut üben") so its timer starts a fresh run. Not persisted. */
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
}

const useExamTimerStore = create<ExamTimerState>()(
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
                set((state) =>
                    state.active && state.active.pausedAtMs == null
                        ? { active: { ...state.active, pausedAtMs: nowMs } }
                        : state,
                ),

            resume: (nowMs = Date.now()) =>
                set((state) =>
                    state.active && state.active.pausedAtMs != null
                        ? {
                              active: {
                                  ...state.active,
                                  pausedTotalMs: state.active.pausedTotalMs + (nowMs - state.active.pausedAtMs),
                                  pausedAtMs: null,
                              },
                          }
                        : state,
                ),

            markAnnounced: (stages) =>
                set((state) =>
                    state.active
                        ? { active: { ...state.active, announced: Array.from(new Set([...state.active.announced, ...stages])) } }
                        : state,
                ),

            dismissWarning: (stage) =>
                set((state) =>
                    state.active
                        ? { active: { ...state.active, dismissed: Array.from(new Set([...state.active.dismissed, stage])) } }
                        : state,
                ),

            clear: () => set({ active: null }),
            setLastResult: (lastResult) => set({ lastResult }),
            requestRestart: () => set((state) => ({ restartSignal: state.restartSignal + 1 })),
            setHasHydrated: (hasHydrated) => set({ hasHydrated }),
        }),
        {
            name: "exam-timer-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ active: state.active, lastResult: state.lastResult }),
            onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
        },
    ),
);

export default useExamTimerStore;
