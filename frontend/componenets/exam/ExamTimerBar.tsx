"use client";

import { Pause, Play, Timer } from "lucide-react";
import { ActiveExamTimer } from "@/store/useExamTimerStore";
import { useExamTimer } from "@/hooks/exam/useExamTimer";
import { formatClock, TIME_THRESHOLDS } from "@/lib/examTime";
import ExamTimeWarning from "./ExamTimeWarning";

const DOT: Record<string, string> = {
    ON_TRACK: "bg-green-500",
    TARGET_REACHED: "bg-amber-500",
    OVER_TIME: "bg-red-500",
};

function StatusLine({
    active,
    elapsedSeconds,
    status,
    isPaused,
}: Readonly<{
    active: ActiveExamTimer;
    elapsedSeconds: number;
    status: ReturnType<typeof useExamTimer>["status"];
    isPaused: boolean;
}>) {
    if (isPaused) return <span className="text-foreground/60">Pausiert</span>;

    if (active.mode === "PRACTICE") return <span className="text-foreground/60">Übungsmodus – ohne Zeitdruck</span>;

    if (!status) return <span className="text-foreground/60">Zeitangaben sind für diese Übung nicht verfügbar.</span>;

    let label = "Im Plan";
    if (status.status === "OVER_TIME") label = "Über der empfohlenen Zeit";
    else if (status.status === "TARGET_REACHED") label = "Empfohlene Zeit erreicht";
    else if (elapsedSeconds >= status.targetSeconds * TIME_THRESHOLDS.approaching) {
        const minutesLeft = Math.max(1, Math.ceil((status.targetSeconds - elapsedSeconds) / 60));
        label = `Noch ${minutesLeft} Min.`;
    }

    return (
        <span className="inline-flex items-center gap-1.5 text-foreground/80">
            <span className={`size-2 rounded-full ${DOT[status.status]}`} aria-hidden />
            {label}
        </span>
    );
}

/**
 * Compact, deliberately quiet timer: the exercise stays the focus. Elapsed time counts up and is
 * shown against the recommended time when there is one.
 */
export default function ExamTimerBar({
    active,
    title,
    actions,
}: Readonly<{
    active: ActiveExamTimer;
    title: string;
    actions?: React.ReactNode;
}>) {
    const { elapsedSeconds, targetSeconds, isPaused, status, pause, resume } = useExamTimer(active);

    return (
        <div className="rounded-[10px] bg-card shadow-card px-4 py-3" aria-label="Zeitmessung">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <span className="text-sm font-semibold text-foreground">{title}</span>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 font-mono text-sm text-foreground tabular-nums" aria-live="off">
                        <Timer className="size-4 text-foreground/50" aria-hidden />
                        {formatClock(elapsedSeconds)}
                        {targetSeconds != null && <span className="text-foreground/50"> / {formatClock(targetSeconds)}</span>}
                    </span>
                    <button
                        type="button"
                        onClick={isPaused ? resume : pause}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground/70 hover:bg-accent"
                    >
                        {isPaused ? <Play className="size-3" /> : <Pause className="size-3" />}
                        {isPaused ? "Fortsetzen" : "Pause"}
                    </button>
                    {actions}
                </div>
            </div>
            <div className="mt-1 text-xs">
                <StatusLine active={active} elapsedSeconds={elapsedSeconds} status={status} isPaused={isPaused} />
            </div>
            {targetSeconds != null && active.mode === "TIME_TRAINING" && !isPaused && (
                <ExamTimeWarning elapsedSeconds={elapsedSeconds} targetSeconds={targetSeconds} announced={active.announced} dismissed={active.dismissed} />
            )}
        </div>
    );
}
