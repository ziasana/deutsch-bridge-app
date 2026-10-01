"use client";

import { useExamTimeConfiguration } from "@/hooks/exam/useExamTimeConfiguration";
import useExamTimerStore from "@/store/useExamTimerStore";
import { formatClock, formatDifference } from "@/lib/examTime";
import { ExamSection } from "@/types/exam";

const STATUS_CHIP = {
    within: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    over: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
} as const;

function Stat({ label, value }: Readonly<{ label: string; value: string }>) {
    return (
        <div>
            <div className="text-xs text-foreground/50">{label}</div>
            <div className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{value}</div>
        </div>
    );
}

/**
 * Time card in the same style as "Dein Fortschritt": the recommended time per Übung, and - once an
 * Übung of this Teil has been finished - the Zeit-Check of the most recent one.
 */
export default function TeilTimeCard({
    section,
    level,
    teil,
    showLastResult = true,
}: Readonly<{ section: ExamSection; level: string; teil: number; showLastResult?: boolean }>) {
    const { minutes } = useExamTimeConfiguration(level, section, teil);
    const lastResult = useExamTimerStore((s) => s.lastResult);
    const hasHydrated = useExamTimerStore((s) => s.hasHydrated);

    const result =
        showLastResult && hasHydrated && lastResult?.section === section && lastResult.level === level && lastResult.teil === teil
            ? lastResult
            : null;
    if (minutes == null && !result) return null;

    const target = result?.targetSeconds ?? null;
    const difference = result?.differenceSeconds ?? null;
    const within = difference != null && difference <= 0;

    return (
        <div className="rounded-[10px] bg-card shadow-card p-4 sm:p-5">
            <div className="text-sm font-semibold text-foreground">Zeit-Check</div>
            {minutes != null && (
                <p className="mt-1 text-sm text-foreground/60">
                    Empfohlene Zeit pro Übung: {minutes} Min. Die Zeit startet automatisch, sobald du eine Übung öffnest.
                </p>
            )}
            {result && (
                <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-border pt-4">
                    <Stat label="Deine Zeit" value={formatClock(result.elapsedSeconds)} />
                    {target != null && <Stat label="Empfohlen" value={formatClock(target)} />}
                    {difference != null && <Stat label="Unterschied" value={formatDifference(difference)} />}
                    {difference != null && (
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_CHIP[within ? "within" : "over"]}`}>
                            {within ? "Innerhalb der Vorgabe" : "Über der empfohlenen Zeit"}
                        </span>
                    )}
                    <span className="text-xs text-foreground/40">Letzte Übung</span>
                </div>
            )}
        </div>
    );
}
