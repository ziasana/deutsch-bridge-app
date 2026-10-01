import { useCallback, useEffect, useState } from "react";
import useExamTimerStore from "@/store/useExamTimerStore";
import { completeExamPracticeSession, startExamPracticeSession } from "@/services/examTimeService";
import { isTimerStale, pausedSecondsAt } from "@/lib/examTime";
import { ExamPracticeSessionResult, ExamPracticeSessionStartRequest } from "@/types/examTime";

/** Starts and finishes timed practice runs: the server records them, the store keeps the UI clock. */
export function useExamSession() {
    const active = useExamTimerStore((s) => s.active);
    const hasHydrated = useExamTimerStore((s) => s.hasHydrated);
    const [busy, setBusy] = useState(false);

    // A timer left over from a browser that was closed long ago is dropped rather than resumed.
    useEffect(() => {
        const current = useExamTimerStore.getState().active;
        if (hasHydrated && current && isTimerStale(current, Date.now())) {
            useExamTimerStore.getState().clear();
        }
    }, [hasHydrated]);

    const start = useCallback(async (request: ExamPracticeSessionStartRequest) => {
        setBusy(true);
        try {
            const res = await startExamPracticeSession(request);
            useExamTimerStore.getState().start(res.data);
        } finally {
            setBusy(false);
        }
    }, []);

    /**
     * Ends the active run. The timer is cleared even if the request fails, so a network error
     * never leaves the learner stuck with a running clock; the result is null in that case.
     */
    const finish = useCallback(async (): Promise<ExamPracticeSessionResult | null> => {
        const store = useExamTimerStore.getState();
        const current = store.active;
        if (!current) return null;
        setBusy(true);
        try {
            const res = await completeExamPracticeSession(current.sessionId, pausedSecondsAt(current, Date.now()));
            return res.data;
        } catch {
            return null;
        } finally {
            useExamTimerStore.getState().clear();
            setBusy(false);
        }
    }, []);

    return { active: hasHydrated ? active : null, hasHydrated, busy, start, finish };
}
