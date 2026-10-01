"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Square, Timer } from "lucide-react";
import { toast } from "@/lib/toast";
import useExamTimerStore from "@/store/useExamTimerStore";
import { useExamSession } from "@/hooks/exam/useExamSession";
import { TIMED_SECTIONS } from "@/lib/examTime";
import { showTimerStartedToast, showZeitCheckToast } from "@/lib/examTimeToast";
import { ExamExercisePublicResponse } from "@/types/exam";
import ExamTimerBar from "./ExamTimerBar";

/**
 * Stops the timer of the exercise on this page (if it is running) and returns its Zeit-Check, which
 * is also remembered for the Teil page. Called when the result page appears, so the learner never
 * has to stop the clock themselves. Returns null if there was nothing to stop.
 */
export function useStopExerciseTimer() {
    const exerciseId = useSearchParams().get("id");
    const { finish } = useExamSession();

    return useCallback(async () => {
        const active = useExamTimerStore.getState().active;
        if (active?.scope !== "EXERCISE" || active.exerciseId !== exerciseId) return null;
        const result = await finish();
        if (result) useExamTimerStore.getState().setLastResult(result);
        return result;
    }, [exerciseId, finish]);
}

/**
 * Timer strip on an exercise page. The clock starts as soon as the exercise opens, pauses when the
 * learner leaves (back button, any navigation, reload) and carries on from where it stopped when
 * the same exercise is opened again. Opening a different exercise starts a fresh run.
 */
export default function ExamExerciseTimer({ exercise }: Readonly<{ exercise: ExamExercisePublicResponse }>) {
    const { active, hasHydrated, busy, start, finish } = useExamSession();
    const restartSignal = useExamTimerStore((s) => s.restartSignal);

    const eligible = TIMED_SECTIONS.includes(exercise.section) && exercise.teil != null;
    const mounted = useRef(false);
    const starting = useRef(false);
    const seenRestartSignal = useRef(restartSignal);

    const startRun = useCallback(async () => {
        if (starting.current) return;
        starting.current = true;
        try {
            await start({ scope: "EXERCISE", mode: "TIME_TRAINING", exerciseId: exercise.id });
            // The learner may have left while the request was in flight - do not let the clock run unseen.
            if (mounted.current) showTimerStartedToast();
            else useExamTimerStore.getState().pause();
        } catch {
            toast.error("Die Zeitmessung konnte nicht gestartet werden.");
        } finally {
            starting.current = false;
        }
    }, [exercise.id, start]);

    // Open: continue this exercise's run if it is still the active one, otherwise begin a new run.
    useEffect(() => {
        mounted.current = true;
        if (!eligible || !hasHydrated) return;

        const current = useExamTimerStore.getState().active;
        if (current?.scope === "EXERCISE" && current.exerciseId === exercise.id) {
            useExamTimerStore.getState().resume();
            showTimerStartedToast();
        } else {
            startRun();
        }

        // Leave: pause this exercise's run, also when the page is reloaded or closed.
        const pauseThisRun = () => {
            const run = useExamTimerStore.getState().active;
            if (run?.scope === "EXERCISE" && run.exerciseId === exercise.id) useExamTimerStore.getState().pause();
        };
        window.addEventListener("pagehide", pauseThisRun);
        return () => {
            mounted.current = false;
            window.removeEventListener("pagehide", pauseThisRun);
            pauseThisRun();
        };
    }, [eligible, hasHydrated, exercise.id, startRun]);

    // "Erneut üben": the previous run ended on the result page, so begin a new one.
    useEffect(() => {
        if (restartSignal === seenRestartSignal.current) return;
        seenRestartSignal.current = restartSignal;
        if (eligible && !useExamTimerStore.getState().active) startRun();
    }, [restartSignal, eligible, startRun]);

    if (!eligible || !hasHydrated) return null;

    if (active?.scope === "EXERCISE" && active.exerciseId === exercise.id) {
        return (
            <ExamTimerBar
                active={active}
                title="Zeit für diese Übung"
                actions={
                    <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                            const result = await finish();
                            if (result) {
                                useExamTimerStore.getState().setLastResult(result);
                                showZeitCheckToast(result);
                            }
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground/70 hover:bg-accent disabled:opacity-50"
                    >
                        <Square className="size-3" />
                        Stopp
                    </button>
                }
            />
        );
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-card shadow-card px-4 py-3">
            <p className="text-xs text-foreground/60">Die Zeitmessung ist gestoppt.</p>
            <button
                type="button"
                disabled={busy}
                onClick={startRun}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-foreground/70 hover:bg-accent disabled:opacity-50"
            >
                <Timer className="size-3.5" />
                Zeit starten
            </button>
        </div>
    );
}
