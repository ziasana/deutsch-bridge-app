"use client";

import { AlertTriangle, Check, CloudOff, Loader2, Timer } from "lucide-react";
import { formatClock } from "@/lib/examTime";
import { cn } from "@/lib/utils";
import type { AutosaveStatus } from "@/hooks/examSimulation/useExamAutosave";
import type { StageStatus } from "@/types/examSimulation";

interface Props {
    stageLabel: string;
    stageIndex: number;
    stageCount: number;
    remainingSeconds: number;
    /** Length of the section; draws the thin progress line under the header. */
    totalSeconds?: number;
    /** All sections of the exam; drawn as a stepper (done, current, still to come). */
    stages?: StageStatus[];
    autosave: AutosaveStatus;
    actions?: React.ReactNode;
}

/** Sticky exam header: section stepper, the server-driven countdown, the autosave indicator and the exam actions. */
export default function SimTimerBar({ stageLabel, stageIndex, stageCount, remainingSeconds, totalSeconds, stages, autosave, actions }: Readonly<Props>) {
    const urgent = remainingSeconds <= 60;
    const warning = remainingSeconds <= 300;
    const left = totalSeconds && totalSeconds > 0 ? Math.min(100, Math.max(0, (remainingSeconds / totalSeconds) * 100)) : null;
    return (
        <div className="sticky top-0 z-30 -mx-4 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6" role="region" aria-label="Zeitanzeige">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) text-sm font-extrabold tabular-nums text-white shadow-sm">
                        {stageIndex + 1}
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/50">
                            Abschnitt {stageIndex + 1} von {stageCount}
                        </p>
                        <p className="truncate text-sm font-bold text-foreground">{stageLabel}</p>
                    </div>
                    {stages && stages.length > 1 && (
                        <ol className="ms-2 hidden items-center gap-1 p-0 md:flex" aria-label="Abschnitte">
                            {stages.map((s, i) => {
                                const done = i < stageIndex;
                                return (
                                    <li key={s.key} className="list-none" title={`${s.label} · ${s.minutes} Min.`}>
                                        <span
                                            aria-current={i === stageIndex ? "step" : undefined}
                                            className={cn("block h-2 rounded-full transition-all", i === stageIndex ? "w-8 bg-primary" : done ? "w-4 bg-primary/60" : "w-4 bg-foreground/15")}
                                        />
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <span
                        role="timer"
                        aria-label={`Verbleibende Zeit ${formatClock(remainingSeconds)}`}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-lg font-bold tabular-nums transition-colors",
                            urgent ? "animate-pulse bg-red-500/15 text-red-600 dark:text-red-400" : warning ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-primary/10 text-primary",
                        )}
                    >
                        <Timer className="size-4" aria-hidden />
                        {formatClock(remainingSeconds)}
                    </span>
                    <AutosaveBadge status={autosave} />
                    {actions}
                </div>
            </div>
            {left != null && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-foreground/10" aria-hidden>
                    <div
                        className={cn("h-full transition-[width] duration-1000 ease-linear", urgent ? "bg-red-500" : warning ? "bg-amber-500" : "bg-gradient-to-r from-(--lesson-from) to-(--lesson-to)")}
                        style={{ width: `${left}%` }}
                    />
                </div>
            )}
        </div>
    );
}

function AutosaveBadge({ status }: Readonly<{ status: AutosaveStatus }>) {
    if (status === "saving")
        return (
            <span className="inline-flex items-center gap-1.5 text-xs text-foreground/60" aria-live="polite">
                <Loader2 className="size-3.5 animate-spin" aria-hidden /> Speichert …
            </span>
        );
    if (status === "retrying")
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400" aria-live="assertive">
                <CloudOff className="size-3.5" aria-hidden /> Nicht gespeichert – neuer Versuch …
            </span>
        );
    if (status === "saved")
        return (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400" aria-live="polite">
                <Check className="size-3.5" aria-hidden /> Gespeichert
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-foreground/50">
            <AlertTriangle className="size-3.5 opacity-0" aria-hidden /> Automatisch gespeichert
        </span>
    );
}
