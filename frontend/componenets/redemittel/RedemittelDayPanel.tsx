"use client";

import { ReactNode, useEffect, useState } from "react";
import { BookOpen, Check, Dumbbell, PartyPopper, RefreshCw, type LucideIcon } from "lucide-react";
import { RedemittelHub } from "@/types/redemittel";
import { cn } from "@/lib/utils";
import { ACCENT_TITLE_COLOR } from "@/componenets/learning/levelMeta";

const RING_SIZE = 76;
const RING_STROKE = 8;

/** The daily goal: how many of today's new Redemittel are learned. The arc animates in on load. */
function GoalRing({ done, target }: Readonly<{ done: number; target: number }>) {
    const [shown, setShown] = useState(false);
    useEffect(() => {
        const frame = requestAnimationFrame(() => setShown(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const radius = (RING_SIZE - RING_STROKE) / 2;
    const circumference = 2 * Math.PI * radius;
    const ratio = target > 0 ? Math.min(1, done / target) : 0;
    const reached = target > 0 && done >= target;

    return (
        <div
            role="img"
            aria-label={`Tagesziel: ${Math.min(done, target)} von ${target} neuen Redemitteln gelernt`}
            className="relative shrink-0"
            style={{ width: RING_SIZE, height: RING_SIZE }}
        >
            <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90" aria-hidden="true">
                <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius} fill="none" strokeWidth={RING_STROKE} className="stroke-foreground/10" />
                <circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={RING_STROKE}
                    strokeLinecap="round"
                    className={reached ? "stroke-learning-reading" : "stroke-primary"}
                    strokeDasharray={circumference}
                    strokeDashoffset={shown ? circumference * (1 - ratio) : circumference}
                    style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {reached ? (
                    <PartyPopper className="anim-pop size-6 text-learning-reading" aria-hidden="true" />
                ) : (
                    <>
                        <span className="text-lg font-bold leading-none text-foreground">
                            {Math.min(done, target)}<span className="text-xs font-semibold text-foreground/40">/{target}</span>
                        </span>
                        <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-foreground/50">heute</span>
                    </>
                )}
            </div>
        </div>
    );
}

type StepKey = "review" | "learn" | "practice";

interface Props {
    hub: RedemittelHub | undefined;
    onNavigate: (href: string) => void;
    onDiscover: () => void;
    /** "Heute neu" preview cards shown under the steps. */
    children?: ReactNode;
}

/**
 * "Heute für dich": today as three calm steps instead of a wall of numbers. Exactly one step is marked as the
 * suggested next one; the others are simply there when you want them. Small steps, your own pace.
 */
export default function RedemittelDayPanel({ hub, onNavigate, onDiscover, children }: Readonly<Props>) {
    const loading = !hub;
    const dueCount = hub?.dueCount ?? 0;
    const newToday = hub?.newToday ?? 0;
    const dailyTarget = hub?.dailyTarget ?? 3;
    const learnedToday = hub?.learnedToday ?? 0;
    const summary = hub?.summary ?? { learned: 0, mastered: 0, review: 0, learning: 0, fresh: 0 };
    const canPractice = summary.learned + (hub?.savedCount ?? 0) > 0;
    const allDone = !loading && dueCount === 0 && newToday === 0;

    const recommended: StepKey | null = dueCount > 0 ? "review" : newToday > 0 ? "learn" : canPractice ? "practice" : null;

    // Tapping the goal ring jumps to the next sensible step.
    const ringHint = newToday > 0 ? "Jetzt neue Redemittel lernen" : canPractice ? "Jetzt üben" : "Redemittel entdecken";
    const ringAction = () => (newToday > 0 ? onNavigate("/dashboard/redemittel/learn") : canPractice ? onNavigate("/dashboard/redemittel/practice") : onDiscover());

    const steps: { key: StepKey; label: string; hint: string; aria: string; icon: LucideIcon; tone: string; bg: string; disabled: boolean; run: () => void }[] = [
        {
            key: "review",
            label: "Wiederholen",
            hint: dueCount > 0 ? (dueCount === 1 ? "1 Redemittel auffrischen" : `${dueCount} Redemittel auffrischen`) : "Nichts offen",
            aria: `Wiederholen – ${dueCount} fällig`,
            icon: RefreshCw,
            tone: "text-learning-review",
            bg: "bg-learning-review/12",
            disabled: dueCount === 0,
            run: () => onNavigate("/dashboard/redemittel/review"),
        },
        {
            key: "learn",
            label: "Lernen",
            hint: newToday > 0 ? (newToday === 1 ? "1 neues Redemittel" : `${newToday} neue Redemittel`) : "Heute alles gelernt",
            aria: `Lernen – ${newToday} neue`,
            icon: BookOpen,
            tone: "text-learning-grammar",
            bg: "bg-learning-grammar/12",
            disabled: newToday === 0,
            run: () => onNavigate("/dashboard/redemittel/learn"),
        },
        {
            key: "practice",
            label: "Üben",
            hint: canPractice ? "Frei üben, ohne Druck" : "Lerne zuerst ein Redemittel",
            aria: "Üben",
            icon: Dumbbell,
            tone: "text-learning-expression",
            bg: "bg-learning-expression/12",
            disabled: !canPractice,
            run: () => onNavigate("/dashboard/redemittel/practice"),
        },
    ];

    return (
        <section aria-label="Heute für dich" className="overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-border/60">
            <div className="flex items-center justify-between gap-4 bg-primary/[0.06] px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
                <div className="min-w-0">
                    <h2 className="text-lg font-bold" style={{ color: ACCENT_TITLE_COLOR }}>Heute für dich</h2>
                    <p className="mt-0.5 text-sm text-foreground/60">
                        {allDone ? "Alles erledigt für heute – gut gemacht!" : "Ein Schritt nach dem anderen, in deinem Tempo."}
                    </p>
                </div>
                {loading ? (
                    <div className="size-[76px] animate-pulse rounded-full bg-foreground/10" aria-hidden="true" />
                ) : (
                    <button
                        type="button"
                        onClick={ringAction}
                        title={ringHint}
                        className="group shrink-0 cursor-pointer rounded-full transition duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-95"
                    >
                        <GoalRing done={learnedToday} target={dailyTarget} />
                        <span className="sr-only">{ringHint}</span>
                    </button>
                )}
            </div>

            <div className="grid gap-3 px-5 pb-5 pt-4 sm:grid-cols-3 sm:px-6 sm:pb-6" role="group" aria-label="Aktionen">
                {steps.map((step) => {
                    const Icon = step.icon;
                    const isNext = !loading && recommended === step.key;
                    return (
                        <button
                            key={step.key}
                            type="button"
                            onClick={step.run}
                            disabled={loading || step.disabled}
                            aria-label={step.aria}
                            className={cn(
                                "group relative flex items-center gap-3.5 rounded-3xl p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                "cursor-pointer disabled:cursor-not-allowed",
                                isNext ? "bg-gradient-to-br from-primary/20 to-primary/5 shadow-card ring-2 ring-primary/50 hover:-translate-y-0.5" : "bg-foreground/[0.04] hover:-translate-y-0.5 hover:bg-card hover:shadow-card disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-foreground/[0.04] disabled:hover:shadow-none",
                            )}
                        >
                            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 group-disabled:group-hover:scale-100", step.bg)} aria-hidden="true">
                                {step.disabled && !loading && step.key !== "practice" ? <Check className={cn("size-5", step.tone)} strokeWidth={3} /> : <Icon className={cn("size-5", step.tone)} />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-foreground">{step.label}</span>
                                <span className="block truncate text-xs text-foreground/60">{step.hint}</span>
                            </span>
                            {isNext && <span className="absolute -top-2 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">Als Nächstes</span>}
                        </button>
                    );
                })}
            </div>

            {children}
        </section>
    );
}
