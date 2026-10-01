"use client";

import { useEffect, useState } from "react";
import { BookOpen, Check, Compass, Dices, Dumbbell, MessagesSquare, PartyPopper, RefreshCw, Sparkles, Trophy, type LucideIcon } from "lucide-react";
import { RedemittelHub, RedemittelStatus } from "@/types/redemittel";
import { cn } from "@/lib/utils";

type ActionKey = "review" | "learn" | "practice" | "discover";

interface Props {
    hub: RedemittelHub | undefined;
    /** The status filter currently applied to the list below (null = none). */
    status: RedemittelStatus | null;
    onSelectStatus: (status: RedemittelStatus | null) => void;
    onNavigate: (href: string) => void;
    onDiscover: () => void;
    /** Opens a random Redemittel; disabled while there is nothing to pick from. */
    onSurprise: () => void;
    canSurprise: boolean;
}

/** Decorative sample bubbles next to the goal ring (never behind it) - purely visual, hidden from assistive technology. */
const BUBBLES = [
    { text: "Meiner Meinung nach …", className: "left-0 top-2 animate-float", tone: "bg-primary text-primary-foreground" },
    { text: "Da stimme ich dir zu!", className: "right-0 top-[4.25rem] animate-float-slow", tone: "bg-learning-reading text-white" },
    { text: "Wie wäre es mit …?", className: "left-4 bottom-2 animate-float-slow", tone: "bg-learning-vocabulary text-white" },
];

/** The learning journey, in order: new → learning → review → mastered. Colors are the app's learning tokens. */
const STATUS_CHIPS: { status: RedemittelStatus; label: string; icon: LucideIcon; tint: string; text: string; bar: string }[] = [
    { status: "NEW", label: "Neu", icon: Sparkles, tint: "bg-learning-vocabulary/12", text: "text-learning-vocabulary", bar: "bg-learning-vocabulary" },
    { status: "LEARNING", label: "Lernen", icon: BookOpen, tint: "bg-learning-grammar/12", text: "text-learning-grammar", bar: "bg-learning-grammar" },
    { status: "REVIEW", label: "Wiederholen", icon: RefreshCw, tint: "bg-learning-review/12", text: "text-learning-review", bar: "bg-learning-review" },
    { status: "MASTERED", label: "Sicher", icon: Trophy, tint: "bg-learning-reading/12", text: "text-learning-reading", bar: "bg-learning-reading" },
];

const RING_SIZE = 84;
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
                    <PartyPopper className="anim-pop size-7 text-learning-reading" aria-hidden="true" />
                ) : (
                    <>
                        <span className="text-xl font-bold leading-none text-foreground">
                            {Math.min(done, target)}<span className="text-sm font-semibold text-foreground/40">/{target}</span>
                        </span>
                        <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-foreground/50">heute</span>
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * One compact "what now / how am I doing" panel for the Redemittel hub. It recommends the next step
 * (reviews first, then new Redemittel, then practice), offers the four actions, and shows real
 * progress as a bar whose legend doubles as the list's status filter.
 */
export default function RedemittelHubPanel({ hub, status, onSelectStatus, onNavigate, onDiscover, onSurprise, canSurprise }: Readonly<Props>) {
    const loading = !hub;
    const { dueCount, newToday, dailyTarget, learnedToday, savedCount, summary } = hub ?? {
        dueCount: 0, newToday: 0, dailyTarget: 3, learnedToday: 0, savedCount: 0,
        summary: { learned: 0, mastered: 0, review: 0, learning: 0, fresh: 0 },
    };
    const canPractice = summary.learned + savedCount > 0;
    const total = summary.learned + summary.fresh;
    const percent = total > 0 ? Math.round((summary.learned / total) * 100) : 0;

    const recommended: ActionKey = dueCount > 0 ? "review" : newToday > 0 ? "learn" : canPractice ? "practice" : "discover";

    let headline: string;
    if (dueCount > 0) headline = `${dueCount} Redemittel warten auf dich`;
    else if (newToday > 0) headline = newToday === 1 ? "1 neues Redemittel wartet auf dich" : `${newToday} neue Redemittel warten auf dich`;
    else if (canPractice) headline = "Alles erledigt für heute";
    else headline = "Starte mit deinen ersten Redemitteln";

    // Tapping the goal ring jumps to the next sensible step.
    const ringHint = newToday > 0 ? "Jetzt neue Redemittel lernen" : canPractice ? "Jetzt üben" : "Redemittel entdecken";
    const ringAction = () => (newToday > 0 ? onNavigate("/dashboard/redemittel/learn") : canPractice ? onNavigate("/dashboard/redemittel/practice") : onDiscover());

    const actions: { key: ActionKey; label: string; aria: string; count: number | null; icon: typeof BookOpen; disabled: boolean; run: () => void }[] = [
        { key: "review", label: "Wiederholen", aria: `Wiederholen – ${dueCount} fällig`, count: dueCount, icon: RefreshCw, disabled: dueCount === 0, run: () => onNavigate("/dashboard/redemittel/review") },
        { key: "learn", label: "Lernen", aria: `Lernen – ${newToday} neue`, count: newToday, icon: BookOpen, disabled: newToday === 0, run: () => onNavigate("/dashboard/redemittel/learn") },
        { key: "practice", label: "Üben", aria: "Üben", count: null, icon: Dumbbell, disabled: !canPractice, run: () => onNavigate("/dashboard/redemittel/practice") },
        { key: "discover", label: "Entdecken", aria: "Entdecken", count: null, icon: Compass, disabled: false, run: onDiscover },
    ];

    return (
        <section aria-label="Dein Lernstand">
            <div className="px-4 pt-5 sm:px-6 sm:pt-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                                <MessagesSquare className="size-6" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Redemittel</h1>
                                <p className="mt-0.5 text-sm text-foreground/65">Ausdrücke für Schreiben, Sprechen und Alltag.</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="mt-5 space-y-3" aria-hidden="true">
                                <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-foreground/10" />
                                <div className="h-4 w-1/2 animate-pulse rounded bg-foreground/10" />
                            </div>
                        ) : (
                            <div className="mt-5">
                                <h2 className="inline-block rounded-2xl rounded-bl-sm bg-primary px-4 py-2.5 text-base font-bold leading-snug text-primary-foreground shadow-md sm:text-lg">
                                    {headline}
                                </h2>
                                <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-foreground/65">
                                    <span className="inline-flex items-center gap-1">
                                        {dueCount > 0 ? (
                                            <>
                                                <RefreshCw className="size-3.5 text-learning-review" aria-hidden="true" />
                                                {dueCount} zur Wiederholung
                                            </>
                                        ) : (
                                            <>
                                                <Check className="size-3.5 text-learning-reading" aria-hidden="true" />
                                                Keine Wiederholungen
                                            </>
                                        )}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        {newToday > 0 ? (
                                            <>
                                                <BookOpen className="size-3.5 text-learning-grammar" aria-hidden="true" />
                                                {newToday === 1 ? "1 neues Redemittel" : `${newToday} neue Redemittel`}
                                            </>
                                        ) : (
                                            <>
                                                <PartyPopper className="size-3.5 text-learning-vocabulary" aria-hidden="true" />
                                                Heute alles gelernt
                                            </>
                                        )}
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-6">
                        {loading ? (
                            <div className="size-[84px] animate-pulse rounded-full bg-foreground/10" aria-hidden="true" />
                        ) : (
                            <button
                                type="button"
                                onClick={ringAction}
                                title={ringHint}
                                className="group rounded-full shadow-card transition duration-200 hover:scale-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-95 cursor-pointer"
                            >
                                <GoalRing done={learnedToday} target={dailyTarget} />
                                <span className="sr-only">{ringHint}</span>
                            </button>
                        )}
                        <div className="pointer-events-none relative hidden h-44 w-60 lg:block" aria-hidden="true">
                            {BUBBLES.map((b) => (
                                <span key={b.text} className={cn("absolute rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm font-semibold shadow-lg", b.tone, b.className)}>
                                    {b.text}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 pb-4" role="group" aria-label="Aktionen">
                    {actions.map((a) => {
                        const Icon = a.icon;
                        const isRecommended = !loading && a.key === recommended;
                        return (
                            <button
                                key={a.key}
                                type="button"
                                onClick={a.run}
                                disabled={loading || a.disabled}
                                aria-label={a.aria}
                                className={cn(
                                    "group inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer",
                                    isRecommended
                                        ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg"
                                        : "border border-border/70 bg-card/90 text-foreground backdrop-blur hover:border-primary/40 hover:bg-card",
                                )}
                            >
                                <Icon className={cn("size-4 transition-transform group-hover:scale-110", !isRecommended && "text-primary")} aria-hidden="true" />
                                {a.label}
                                {a.count !== null && a.count > 0 && (
                                    <span
                                        aria-hidden="true"
                                        className={cn("rounded-full px-1.5 text-xs font-bold leading-5", isRecommended ? "bg-white/25" : "bg-primary/10 text-primary")}
                                    >
                                        {a.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={onSurprise}
                        disabled={!canSurprise}
                        className="group inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary transition hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    >
                        <Dices className="size-4 transition-transform group-hover:rotate-12 group-hover:scale-110" aria-hidden="true" />
                        Überrasch mich
                    </button>
                </div>
            </div>

            <div className="px-4 pb-5 sm:px-6">
                {loading ? (
                    <div className="space-y-3" aria-hidden="true">
                        <div className="h-4 w-1/3 animate-pulse rounded bg-foreground/10" />
                        <div className="h-2 w-full animate-pulse rounded-full bg-foreground/10" />
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, n) => (
                                <div key={n} className="h-[58px] animate-pulse rounded-2xl bg-foreground/10" />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-foreground/70">Meine Redemittel</span>
                    <span className="text-foreground/55">
                        {summary.learned} von {total} gelernt · {percent}%
                    </span>
                </div>
                <div
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Gelernte Redemittel"
                    className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-foreground/10"
                >
                    {[
                        { n: summary.mastered, cls: "bg-learning-reading" },
                        { n: summary.review, cls: "bg-learning-review" },
                        { n: summary.learning, cls: "bg-learning-grammar" },
                    ].map((seg) =>
                        seg.n > 0 ? (
                            <div key={seg.cls} className={cn("h-full transition-all duration-700", seg.cls)} style={{ width: `${(seg.n / total) * 100}%`, minWidth: 4 }} />
                        ) : null,
                    )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4" role="group" aria-label="Nach Lernstatus filtern">
                    {STATUS_CHIPS.map((chip) => {
                        const count = chip.status === "MASTERED" ? summary.mastered : chip.status === "REVIEW" ? summary.review : chip.status === "LEARNING" ? summary.learning : summary.fresh;
                        const active = status === chip.status;
                        const Icon = chip.icon;
                        return (
                            <button
                                key={chip.status}
                                type="button"
                                aria-pressed={active}
                                onClick={() => onSelectStatus(active ? null : chip.status)}
                                className={cn(
                                    "group flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer",
                                    active
                                        ? "border-primary bg-primary/[0.06]"
                                        : "border-border/60 bg-card shadow-card hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.06] hover:shadow-lg",
                                )}
                            >
                                <span
                                    className={cn(
                                        "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
                                        active ? cn(chip.bar, "text-white") : cn(chip.tint, chip.text),
                                    )}
                                    aria-hidden="true"
                                >
                                    <Icon className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className={cn("block truncate text-sm font-semibold leading-tight", active ? "text-primary" : "text-foreground")}>{chip.label}</span>
                                    <span className="block truncate text-xs text-foreground/55">{count} Redemittel</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
                    </>
                )}
            </div>
        </section>
    );
}
