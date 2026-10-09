"use client";

import { Pause, Play } from "lucide-react";
import { ActiveExamTimer } from "@/store/useExamTimerStore";
import { useExamTimer } from "@/hooks/exam/useExamTimer";
import { formatClock, TIME_THRESHOLDS } from "@/lib/examTime";
import { cn } from "@/lib/utils";
import ExamTimeWarning from "./ExamTimeWarning";

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const TONES = {
    ON_TRACK: { stroke: "stroke-emerald-500", text: "text-emerald-600 dark:text-emerald-400", label: "Im Plan" },
    TARGET_REACHED: { stroke: "stroke-amber-500", text: "text-amber-600 dark:text-amber-400", label: "Empfohlene Zeit erreicht" },
    OVER_TIME: { stroke: "stroke-red-500", text: "text-red-600 dark:text-red-400", label: "Über der empfohlenen Zeit" },
} as const;

/**
 * Same clock as {@link ExamTimerBar} (same store, same thresholds) drawn as a progress ring: it fills towards the recommended
 * time and turns amber and red as the target is reached and passed. Without a target it is a plain stopwatch.
 */
export default function ExamTimerRing({ active, actions }: Readonly<{ active: ActiveExamTimer; actions?: React.ReactNode }>) {
    const { elapsedSeconds, targetSeconds, isPaused, status, pause, resume } = useExamTimer(active);
    const tone = status ? TONES[status.status] : null;
    const ratio = targetSeconds ? Math.min(1, elapsedSeconds / targetSeconds) : 0;

    let caption = tone?.label ?? "Zeitmessung";
    if (status?.status === "ON_TRACK" && targetSeconds && elapsedSeconds >= targetSeconds * TIME_THRESHOLDS.approaching) {
        caption = `Noch ${Math.max(1, Math.ceil((targetSeconds - elapsedSeconds) / 60))} Min.`;
    }
    if (isPaused) caption = "Pausiert";

    return (
        <div aria-label="Zeitmessung">
        <div className="flex items-center gap-4">
            <div className="relative size-28 shrink-0">
                <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
                    <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="8" className="stroke-foreground/10" />
                    <circle
                        cx="50"
                        cy="50"
                        r={RADIUS}
                        fill="none"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className={cn("transition-all duration-1000 ease-linear", isPaused ? "stroke-foreground/30" : (tone?.stroke ?? "stroke-primary"))}
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-mono text-xl font-bold tabular-nums text-foreground" aria-live="off">
                        {formatClock(elapsedSeconds)}
                    </span>
                    {targetSeconds != null && <span className="text-[11px] font-medium tabular-nums text-foreground/50">von {formatClock(targetSeconds)}</span>}
                </div>
            </div>
            <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/50">Zeit für diese Übung</p>
                <p className={cn("mt-0.5 flex items-center gap-1.5 text-sm font-semibold", isPaused ? "text-foreground/60" : (tone?.text ?? "text-foreground/70"))}>
                    {!isPaused && tone && <span className={cn("size-2 rounded-full bg-current", status?.status === "ON_TRACK" && "animate-pulse")} aria-hidden="true" />}
                    {caption}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={isPaused ? resume : pause}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground/80 transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        {isPaused ? <Play className="size-3" /> : <Pause className="size-3" />}
                        {isPaused ? "Fortsetzen" : "Pause"}
                    </button>
                    {actions}
                </div>
            </div>
        </div>
            {targetSeconds != null && active.mode === "TIME_TRAINING" && !isPaused && (
                <ExamTimeWarning elapsedSeconds={elapsedSeconds} targetSeconds={targetSeconds} announced={active.announced} dismissed={active.dismissed} />
            )}
        </div>
    );
}
