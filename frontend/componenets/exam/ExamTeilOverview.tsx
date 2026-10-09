"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, BookmarkCheck, Check, ChevronRight, Clock, Play, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/examTime";
import { ExamExerciseSummaryResponse, ExamSection } from "@/types/exam";
import { ExamExerciseLastTime } from "@/types/examTime";
import { useExamBookmark } from "@/hooks/exam/useExamBookmark";
import { effectiveScore } from "./examData";
import ExamTimeTile from "./ExamTimeTile";
import { LessonAccent, lessonThemeVars } from "./lessonTheme";

type Filter = "ALL" | "OPEN" | "COMPLETED";
const PAGE_SIZE = 8;
const FILTERS: { value: Filter; label: string }[] = [
    { value: "ALL", label: "Alle" },
    { value: "OPEN", label: "Offen" },
    { value: "COMPLETED", label: "Abgeschlossen" },
];

interface ExamTeilOverviewProps {
    section: ExamSection;
    accent: LessonAccent;
    /** Section name above the heading, e.g. "Lesen". */
    sectionLabel: string;
    emoji: string;
    items: ExamExerciseSummaryResponse[];
    level: string;
    teil: number;
    heading: string;
    subheading?: string;
    backHref: string;
    lastTimes?: Record<string, ExamExerciseLastTime>;
}

function Ring({ done, total }: Readonly<{ done: number; total: number }>) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    return (
        <div className="relative size-24 shrink-0 sm:size-28" role="img" aria-label={`Dein Fortschritt: ${done} von ${total}`}>
            <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" className="stroke-white/25" />
                <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-white transition-all duration-700" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - (total === 0 ? 0 : done / total))} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white" aria-hidden="true">
                <span className="text-2xl font-extrabold tabular-nums">{done}/{total}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">geschafft</span>
            </div>
        </div>
    );
}

/**
 * Teil page of a timed section (used for Lesen): hero with progress ring and one big "continue" button, the Zeit-Check
 * and the Übungen as full-width rows (status, questions, last time against the recommendation, bookmark).
 */
export default function ExamTeilOverview({ section, accent, sectionLabel, emoji, items, level, teil, heading, subheading, backHref, lastTimes }: Readonly<ExamTeilOverviewProps>) {
    const router = useRouter();
    const { toggle: toggleBookmark, pendingId } = useExamBookmark();
    const [filter, setFilter] = useState<Filter>("ALL");
    const [visible, setVisible] = useState(PAGE_SIZE);

    const isDone = (i: ExamExerciseSummaryResponse) => effectiveScore(i) >= 100;
    const mastered = items.filter(isDone).length;
    const openIndex = items.findIndex((i) => !isDone(i));
    const next = items[openIndex === -1 ? 0 : openIndex];
    const allDone = items.length > 0 && mastered === items.length;
    const started = items.some((i) => i.completed);
    const totalQuestions = items.reduce((sum, i) => sum + i.questionsCount, 0);
    const cta = allDone ? "Nochmal üben" : started ? "Weiter üben" : "Jetzt starten";

    const open = (id: string) => router.push(`/dashboard/exam-prep/exercise?id=${id}`);
    const counts: Record<Filter, number> = { ALL: items.length, OPEN: items.filter((i) => !isDone(i)).length, COMPLETED: mastered };
    const filtered = items.filter((i) => filter === "ALL" || (filter === "COMPLETED" ? isDone(i) : !isDone(i)));

    return (
        <div className="space-y-5" style={lessonThemeVars(accent)}>
            <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition hover:text-foreground">
                <ArrowLeft className="size-4" aria-hidden="true" />
                {sectionLabel}
            </Link>

            <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) p-5 text-white shadow-md sm:p-7">
                <span aria-hidden="true" className="absolute -end-10 -top-12 size-48 rounded-full bg-white/10" />
                <span aria-hidden="true" className="absolute -bottom-16 start-1/3 size-40 rounded-full bg-white/10" />
                <span aria-hidden="true" className="absolute end-6 top-4 text-7xl opacity-20 sm:text-8xl">{emoji}</span>
                <div className="relative flex flex-wrap items-center justify-between gap-5">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-white/80">{sectionLabel} · {level}</p>
                        <h1 className="mt-1 text-3xl font-extrabold">{heading}</h1>
                        {subheading && <p className="mt-0.5 text-lg font-medium text-white/90">{subheading}</p>}
                        <ul className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                            <li className="rounded-full bg-white/20 px-3 py-1">{items.length} {items.length === 1 ? "Übung" : "Übungen"}</li>
                            {totalQuestions > 0 && <li className="rounded-full bg-white/20 px-3 py-1">{totalQuestions} {totalQuestions === 1 ? "Frage" : "Fragen"}</li>}
                        </ul>
                    </div>
                    <Ring done={mastered} total={items.length} />
                </div>
                {next && (
                    <button
                        type="button"
                        onClick={() => open(next.id)}
                        className="group relative mt-5 flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-white p-3 text-start text-foreground shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--lesson-from) sm:p-4"
                    >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) text-white transition group-hover:scale-110">
                            {allDone ? <RotateCw className="size-5" aria-hidden="true" /> : <Play className="size-5" fill="currentColor" aria-hidden="true" />}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-xs font-bold uppercase tracking-wide text-primary">{cta}</span>
                            <span className="block truncate text-sm font-semibold sm:text-base">{next.title}</span>
                        </span>
                        <ChevronRight className="size-5 shrink-0 text-foreground/40 transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </button>
                )}
            </header>

            <ExamTimeTile section={section} level={level} teil={teil} />

            <section aria-label="Übungen">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-foreground">Übungen</h2>
                    <div role="group" aria-label="Filter" className="inline-flex gap-1 rounded-full bg-card p-1 shadow-card ring-1 ring-primary/10">
                        {FILTERS.map((f) => (
                            <button
                                key={f.value}
                                type="button"
                                aria-pressed={filter === f.value}
                                onClick={() => {
                                    setFilter(f.value);
                                    setVisible(PAGE_SIZE);
                                }}
                                className={cn(
                                    "cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    filter === f.value ? "bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) text-white shadow-sm" : "text-foreground/60 hover:bg-primary/10 hover:text-foreground",
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
                        const done = isDone(item);
                        const retry = item.completed && !done;
                        const time = lastTimes?.[item.id];
                        const within = time?.targetSeconds != null && time.elapsedSeconds <= time.targetSeconds;
                        return (
                            <li key={item.id} className="anim-fade-up" style={{ animationDelay: `${index * 40}ms` }}>
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => open(item.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            open(item.id);
                                        }
                                    }}
                                    className={cn(
                                        "group flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                        done ? "border-emerald-500/40" : "border-transparent hover:border-primary/40",
                                    )}
                                >
                                    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold", done ? "bg-emerald-500 text-white" : "bg-primary/15 text-primary")}>
                                        {done ? <Check className="size-5" aria-hidden="true" /> : <span aria-hidden="true">{(items.indexOf(item) + 1)}</span>}
                                    </span>
                                    <div className="min-w-0 flex-1 basis-48">
                                        <p className="font-semibold leading-snug text-foreground">{item.title}</p>
                                        <p className="mt-0.5 text-xs text-foreground/50">
                                            {done ? "Erledigt ✓" : retry ? `Wiederholen (${Math.round(item.lastScore ?? 0)}%)` : item.completed ? "Begonnen" : "Noch offen"}
                                            {item.questionsCount > 0 && ` · ${item.questionsCount} ${item.questionsCount === 1 ? "Frage" : "Fragen"}`}
                                        </p>
                                    </div>
                                    {time ? (
                                        <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", time.targetSeconds == null ? "bg-accent text-foreground/70" : within ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/15 text-amber-700 dark:text-amber-300")}>
                                            <Clock className="size-3" aria-hidden="true" />
                                            {formatClock(time.elapsedSeconds)}
                                            {time.targetSeconds != null && ` / ${formatClock(time.targetSeconds)}`}
                                        </span>
                                    ) : (
                                        <span className="shrink-0 text-xs text-foreground/40">Noch keine Zeit gemessen</span>
                                    )}
                                    <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary transition group-hover:gap-1.5">
                                        {retry ? <RotateCw className="size-3.5" aria-hidden="true" /> : null}
                                        {done ? "Wiederholen" : retry ? "Nochmal" : "Öffnen"} <ChevronRight className="size-4" aria-hidden="true" />
                                    </span>
                                    <button
                                        type="button"
                                        disabled={pendingId === item.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleBookmark(item.id, item.bookmarked);
                                        }}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        aria-pressed={item.bookmarked}
                                        aria-label={item.bookmarked ? "Merkzeichen entfernen" : "Aufgabe merken"}
                                        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground/45 transition hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {item.bookmarked ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
                                    </button>
                                </div>
                            </li>
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
