"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, ChevronRight, Play, RotateCw, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock, formatDifference } from "@/lib/examTime";
import { ExamExerciseSummaryResponse } from "@/types/exam";
import { ExamExerciseLastTime } from "@/types/examTime";
import { useExamBookmark } from "@/hooks/exam/useExamBookmark";
import { useExamTimeConfiguration } from "@/hooks/exam/useExamTimeConfiguration";
import useExamTimerStore from "@/store/useExamTimerStore";
import { effectiveScore } from "../examData";
import { learnHref, SPEAKING_PARTS } from "./speakingMeta";
import SpeakingExerciseRow, { TEIL_EMOJI } from "./SpeakingExerciseRow";
import { shortSpeakingTitle } from "./SpeakingTopHeader";

type Filter = "ALL" | "OPEN" | "COMPLETED";
const PAGE_SIZE = 8;
const FILTERS: { value: Filter; label: string }[] = [
    { value: "ALL", label: "Alle" },
    { value: "OPEN", label: "Offen" },
    { value: "COMPLETED", label: "Abgeschlossen" },
];

interface SpeakingTeilOverviewProps {
    items: ExamExerciseSummaryResponse[];
    level: string;
    teil: number;
    heading: string;
    subheading?: string;
    backHref: string;
    backLabel: string;
    lastTimes?: Record<string, ExamExerciseLastTime>;
}

function ProgressRing({ done, total }: Readonly<{ done: number; total: number }>) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const ratio = total === 0 ? 0 : done / total;
    return (
        <div className="relative size-24 shrink-0 sm:size-28" role="img" aria-label={`Dein Fortschritt: ${done} von ${total}`}>
            <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" className="stroke-white/25" />
                <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-white transition-all duration-700" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white" aria-hidden="true">
                <span className="text-2xl font-extrabold tabular-nums">{done}/{total}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">geschafft</span>
            </div>
        </div>
    );
}

/** Recommended time per Übung and, once one was finished, the Zeit-Check of the latest Übung of this Teil. */
function TimeStrip({ level, teil }: Readonly<{ level: string; teil: number }>) {
    const { minutes } = useExamTimeConfiguration(level, "MUENDLICHER_AUSDRUCK", teil);
    const lastResult = useExamTimerStore((s) => s.lastResult);
    const hydrated = useExamTimerStore((s) => s.hasHydrated);
    const result = hydrated && lastResult?.section === "MUENDLICHER_AUSDRUCK" && lastResult.level === level && lastResult.teil === teil ? lastResult : null;
    if (minutes == null && !result) return null;

    const difference = result?.differenceSeconds ?? null;
    const within = difference != null && difference <= 0;
    const ratio = result?.targetSeconds ? Math.min(1.25, result.elapsedSeconds / result.targetSeconds) : null;

    return (
        <section aria-label="Zeit-Check" className="relative flex flex-col justify-center overflow-hidden rounded-2xl bg-card p-4 shadow-card sm:p-5">
            <span aria-hidden="true" className="pointer-events-none absolute -end-6 -top-8 size-28 rounded-full bg-gradient-to-br from-pink-500/15 to-orange-400/15" />
            <div className="relative flex items-center gap-4">
                {minutes != null ? (
                    <span className="flex size-16 shrink-0 flex-col items-center justify-center rounded-full border-[5px] border-pink-500/80 border-e-orange-400/80 bg-card leading-none shadow-sm" aria-hidden="true">
                        <span className="text-xl font-extrabold tabular-nums text-foreground">{minutes}</span>
                        <span className="text-[10px] font-bold uppercase text-foreground/50">Min.</span>
                    </span>
                ) : (
                    <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-pink-500/15 text-pink-600" aria-hidden="true">
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

/**
 * Teil page of Mündlicher Ausdruck: a hero with the progress ring and one big "continue" button, the Zeit-Check, a shortcut to the
 * Lernbereich and the Übungen as cards (status, last time against the recommendation, bookmark).
 */
export default function SpeakingTeilOverview({ items, level, teil, heading, subheading, backHref, backLabel, lastTimes }: Readonly<SpeakingTeilOverviewProps>) {
    const router = useRouter();
    const { toggle: toggleBookmark, pendingId } = useExamBookmark();
    const [filter, setFilter] = useState<Filter>("ALL");
    const [visible, setVisible] = useState(PAGE_SIZE);

    const part = SPEAKING_PARTS.find((p) => p.part === teil);
    const mastered = items.filter((i) => effectiveScore(i) >= 100).length;
    const openIndex = items.findIndex((i) => effectiveScore(i) < 100);
    const next = items[openIndex === -1 ? 0 : openIndex];
    const allDone = items.length > 0 && mastered === items.length;
    const started = items.some((i) => i.completed);
    const cta = allDone ? "Nochmal üben" : started ? "Weiter üben" : "Jetzt starten";

    const open = (id: string) => router.push(`/dashboard/exam-prep/exercise?id=${id}`);
    const counts: Record<Filter, number> = { ALL: items.length, OPEN: items.filter((i) => effectiveScore(i) < 100).length, COMPLETED: mastered };
    const filtered = items.filter((i) => filter === "ALL" || (filter === "COMPLETED" ? effectiveScore(i) >= 100 : effectiveScore(i) < 100));

    return (
        <div className="space-y-5">
            <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition hover:text-foreground">
                <ArrowLeft className="size-4" aria-hidden="true" />
                {backLabel}
            </Link>

            <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 p-5 text-white shadow-md sm:p-7">
                <span aria-hidden="true" className="absolute -end-10 -top-12 size-48 rounded-full bg-white/10" />
                <span aria-hidden="true" className="absolute -bottom-16 start-1/3 size-40 rounded-full bg-white/10" />
                <span aria-hidden="true" className="absolute end-6 top-4 text-7xl opacity-20 sm:text-8xl">{TEIL_EMOJI[teil] ?? "🎤"}</span>
                <div className="relative flex flex-wrap items-center justify-between gap-5">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-white/80">Mündlicher Ausdruck · {level}</p>
                        <h1 className="mt-1 text-3xl font-extrabold">{heading}</h1>
                        {(subheading ?? part?.title) && <p className="mt-0.5 text-lg font-medium text-white/90">{subheading ?? part?.title}</p>}
                        {part && <p className="mt-1 text-sm text-white/80">{part.description}</p>}
                        <ul className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                            <li className="rounded-full bg-white/20 px-3 py-1">{items.length} {items.length === 1 ? "Übung" : "Übungen"}</li>
                        </ul>
                    </div>
                    <ProgressRing done={mastered} total={items.length} />
                </div>
                {next && (
                    <button
                        type="button"
                        onClick={() => open(next.id)}
                        className="group relative mt-5 flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-white p-3 text-start text-foreground shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pink-500 sm:p-4"
                    >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-white transition group-hover:scale-110">
                            {allDone ? <RotateCw className="size-5" aria-hidden="true" /> : <Play className="size-5" fill="currentColor" aria-hidden="true" />}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-xs font-bold uppercase tracking-wide text-pink-600">{cta}</span>
                            <span className="block truncate text-sm font-semibold sm:text-base">{shortSpeakingTitle(next.title)}</span>
                        </span>
                        <ChevronRight className="size-5 shrink-0 text-foreground/40 transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </button>
                )}
            </header>

            <div className="grid gap-4 md:grid-cols-2 md:[&>*:only-child]:col-span-2">
                <TimeStrip level={level} teil={teil} />

                <Link
                    href={learnHref(level, teil)}
                    className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500/10 via-card to-orange-400/10 p-4 shadow-card ring-1 ring-pink-500/20 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-pink-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 sm:p-5"
                >
                    <span aria-hidden="true" className="pointer-events-none absolute -bottom-8 -end-6 text-7xl opacity-10 transition group-hover:rotate-6 group-hover:opacity-20">📖</span>
                    <span className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 text-white shadow-md transition group-hover:scale-105">
                        <BookOpen className="size-8" aria-hidden="true" />
                    </span>
                    <span className="relative min-w-0 flex-1">
                        <span className="block text-base font-bold text-foreground">Erst lernen, dann sprechen</span>
                        <span className="block text-sm text-foreground/65">Ablauf, Tipps und Redemittel für Teil {teil} im Lernbereich</span>
                        <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-pink-600 transition-all group-hover:gap-2 dark:text-pink-300">
                            Zum Lernbereich <ChevronRight className="size-3.5" aria-hidden="true" />
                        </span>
                    </span>
                </Link>
            </div>

            <section aria-label="Übungen">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-foreground">Übungen</h2>
                    <div role="group" aria-label="Filter" className="inline-flex gap-1 rounded-full bg-card p-1 shadow-card ring-1 ring-pink-500/10">
                        {FILTERS.map((f) => (
                            <button
                                key={f.value}
                                type="button"
                                aria-pressed={filter === f.value}
                                onClick={() => { setFilter(f.value); setVisible(PAGE_SIZE); }}
                                className={cn(
                                    "cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    filter === f.value ? "bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-sm" : "text-foreground/60 hover:bg-pink-500/10 hover:text-foreground",
                                )}
                            >
                                {f.label}
                                <span className={cn("ms-1.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums", filter === f.value ? "bg-white/25 text-white" : "bg-accent text-foreground/50")}>{counts[f.value]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <ul className="mt-4 space-y-3">
                    {filtered.slice(0, visible).map((item, index) => {
                        return (
                            <SpeakingExerciseRow key={item.id} item={item} teil={teil} index={index} time={lastTimes?.[item.id]} bookmarkPending={pendingId === item.id} onOpen={open} onToggleBookmark={toggleBookmark} />
                        );
                    })}
                </ul>
                {filtered.length === 0 && <p className="py-10 text-center text-sm text-foreground/50">Keine Übungen für diesen Filter gefunden.</p>}
                {filtered.length > visible && (
                    <div className="mt-4 text-center">
                        <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="cursor-pointer rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-accent">
                            Mehr anzeigen ({filtered.length - visible})
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
