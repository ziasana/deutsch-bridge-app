"use client";

import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock, formatDifference } from "@/lib/examTime";
import { ExamSection } from "@/types/exam";
import { useExamTimeConfiguration } from "@/hooks/exam/useExamTimeConfiguration";
import useExamTimerStore from "@/store/useExamTimerStore";

/**
 * "Zeit-Check" tile: the recommended time per Übung as a ring, and (when asked for) the result of the latest finished Übung.
 * Colours follow the surrounding theme (`--lesson-from` / `--lesson-to`).
 */
export default function ExamTimeTile({ section, level, teil, showLastResult = true }: Readonly<{ section: ExamSection; level: string; teil: number; showLastResult?: boolean }>) {
    const { minutes } = useExamTimeConfiguration(level, section, teil);
    const lastResult = useExamTimerStore((s) => s.lastResult);
    const hydrated = useExamTimerStore((s) => s.hasHydrated);
    const result = showLastResult && hydrated && lastResult?.section === section && lastResult.level === level && lastResult.teil === teil ? lastResult : null;
    if (minutes == null && !result) return null;

    const difference = result?.differenceSeconds ?? null;
    const within = difference != null && difference <= 0;
    const ratio = result?.targetSeconds ? Math.min(1.25, result.elapsedSeconds / result.targetSeconds) : null;

    return (
        <section aria-label="Zeit-Check" className="relative flex flex-col justify-center overflow-hidden rounded-2xl bg-card p-4 shadow-card sm:p-5">
            <span aria-hidden="true" className="pointer-events-none absolute -end-6 -top-8 size-28 rounded-full bg-gradient-to-br from-(--lesson-from)/15 to-(--lesson-to)/15" />
            <div className="relative flex items-center gap-4">
                {minutes != null ? (
                    <span className="flex size-16 shrink-0 flex-col items-center justify-center rounded-full border-[5px] border-primary/80 bg-card leading-none shadow-sm" aria-hidden="true">
                        <span className="text-xl font-extrabold tabular-nums text-foreground">{minutes}</span>
                        <span className="text-[10px] font-bold uppercase text-foreground/50">Min.</span>
                    </span>
                ) : (
                    <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary" aria-hidden="true">
                        <Timer className="size-7" />
                    </span>
                )}
                <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-foreground">Zeit-Check</h2>
                    {minutes != null && (
                        <p className="text-sm text-foreground/65">
                            Empfohlen: <span className="font-semibold text-foreground">{minutes} Min.</span> pro Übung. Die Zeit startet automatisch, sobald du eine Übung öffnest.
                        </p>
                    )}
                </div>
            </div>
            {result && (
                <div className="relative mt-4 border-t border-border/60 pt-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                        <span className="text-xs font-semibold uppercase tracking-wide text-foreground/45">Letzte Übung</span>
                        <span>Deine Zeit <b className="tabular-nums">{formatClock(result.elapsedSeconds)}</b></span>
                        {result.targetSeconds != null && <span>Empfohlen <b className="tabular-nums">{formatClock(result.targetSeconds)}</b></span>}
                        {difference != null && <span>Unterschied <b className="tabular-nums">{formatDifference(difference)}</b></span>}
                        {difference != null && (
                            <span className={cn("rounded-full px-3 py-0.5 text-xs font-semibold", within ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/15 text-amber-700 dark:text-amber-300")}>
                                {within ? "Innerhalb der Vorgabe" : "Über der empfohlenen Zeit"}
                            </span>
                        )}
                    </div>
                    {ratio != null && (
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-accent" aria-hidden="true">
                            <div className={cn("h-full rounded-full", within ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${Math.min(100, (ratio / 1.25) * 100)}%` }} />
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
