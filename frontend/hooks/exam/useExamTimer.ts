import { useCallback, useEffect, useMemo, useState } from "react";
import useExamTimerStore, { ActiveExamTimer } from "@/store/useExamTimerStore";
import { elapsedSecondsAt, getTimeStatus, TimeStatusResult } from "@/lib/examTime";

export interface ExamTimerView {
    elapsedSeconds: number;
    targetSeconds: number | null;
    isPaused: boolean;
    /** Null when there is no target to measure against. */
    status: TimeStatusResult | null;
    pause: () => void;
    resume: () => void;
}

/**
 * Re-renders the given timer once a second and on tab focus. The displayed time is always
 * derived from the stored timestamps (see elapsedSecondsAt), so the interval is only a repaint
 * trigger - it can be throttled by a background tab without the clock drifting.
 */
export function useExamTimer(active: ActiveExamTimer | null): ExamTimerView {
    const [now, setNow] = useState(() => Date.now());
    const pause = useExamTimerStore((s) => s.pause);
    const resume = useExamTimerStore((s) => s.resume);

    const isRunning = !!active && active.pausedAtMs == null;

    useEffect(() => {
        if (!isRunning) return;
        const tick = () => setNow(Date.now());
        tick();
        const interval = setInterval(tick, 1000);
        document.addEventListener("visibilitychange", tick);
        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", tick);
        };
    }, [isRunning]);

    const onPause = useCallback(() => pause(), [pause]);
    const onResume = useCallback(() => resume(), [resume]);

    return useMemo(() => {
        const elapsedSeconds = active ? elapsedSecondsAt(active, now) : 0;
        const targetSeconds = active?.targetSeconds ?? null;
        return {
            elapsedSeconds,
            targetSeconds,
            isPaused: !!active && active.pausedAtMs != null,
            status: targetSeconds != null ? getTimeStatus(elapsedSeconds, targetSeconds) : null,
            pause: onPause,
            resume: onResume,
        };
    }, [active, now, onPause, onResume]);
}
