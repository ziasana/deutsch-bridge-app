"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Bookmark, BookmarkCheck, Check, ChevronRight, Clock, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/examTime";
import { ExamExerciseSummaryResponse } from "@/types/exam";
import { ExamExerciseLastTime } from "@/types/examTime";
import { useExamBookmark } from "@/hooks/exam/useExamBookmark";
import { effectiveScore } from "../examData";
import { lessonThemeVars } from "../lessonTheme";
import ExamTimeTile from "../ExamTimeTile";

type Filter = "ALL" | "OPEN" | "COMPLETED";
const PAGE_SIZE = 8;
const FILTERS: { value: Filter; label: string }[] = [
    { value: "ALL", label: "Alle" },
    { value: "OPEN", label: "Offen" },
    { value: "COMPLETED", label: "Abgeschlossen" },
];

/** "B1 Schriftlicher Ausdruck – E-Mail an eine Freundin" -> "E-Mail an eine Freundin". */
const shortTitle = (title: string) => title.replace(/^.*?Schriftlicher Ausdruck\s*[–-]\s*/i, "").trim() || title;

interface WritingTaskListProps {
    items: ExamExerciseSummaryResponse[];
    level: string;
    lastTimes?: Record<string, ExamExerciseLastTime>;
}

/** The Schreibaufgaben of a level: a "learn first" tile next to the Zeit-Check, then the tasks as cards with status, last time and bookmark. */
export default function WritingTaskList({ items, level, lastTimes }: Readonly<WritingTaskListProps>) {
    const router = useRouter();
    const { toggle: toggleBookmark, pendingId } = useExamBookmark();
    const [filter, setFilter] = useState<Filter>("ALL");
    const [visible, setVisible] = useState(PAGE_SIZE);

    const isDone = (i: ExamExerciseSummaryResponse) => effectiveScore(i) >= 100;
    const counts: Record<Filter, number> = { ALL: items.length, OPEN: items.filter((i) => !isDone(i)).length, COMPLETED: items.filter(isDone).length };
    const filtered = items.filter((i) => filter === "ALL" || (filter === "COMPLETED" ? isDone(i) : !isDone(i)));
    const open = (id: string) => router.push(`/dashboard/exam-prep/exercise?id=${id}`);

    return (
        <div className="space-y-5" style={lessonThemeVars("writing")}>
            <div className="grid gap-4 md:grid-cols-2 md:[&>*:only-child]:col-span-2">
                <ExamTimeTile section="SCHRIFTLICHER_AUSDRUCK" level={level} teil={1} showLastResult={false} />
                <Link
                    href={`/dashboard/exam-prep/schreiben/lernen?level=${encodeURIComponent(level)}`}
                    className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-(--lesson-from)/10 via-card to-(--lesson-to)/10 p-4 shadow-card ring-1 ring-primary/20 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:p-5"
                >
                    <span aria-hidden="true" className="pointer-events-none absolute -bottom-8 -end-6 text-7xl opacity-10 transition group-hover:rotate-6 group-hover:opacity-20">📚</span>
                    <span className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) text-white shadow-md transition group-hover:scale-105">
                        <BookOpen className="size-8" aria-hidden="true" />
                    </span>
                    <span className="relative min-w-0 flex-1">
                        <span className="block text-base font-bold text-foreground">Erst lernen: So löst du eine Schreibaufgabe</span>
                        <span className="block text-sm text-foreground/65">Methode, Textaufbau und Redemittel in kleinen Lektionen</span>
                        <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-primary transition-all group-hover:gap-2">
                            Zum Lernbereich <ChevronRight className="size-3.5" aria-hidden="true" />
                        </span>
                    </span>
                </Link>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-foreground">✍️ Schreibaufgaben</h2>
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

            <ul className="space-y-3">
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
                                <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl text-lg", done ? "bg-emerald-500 text-white" : "bg-gradient-to-br from-(--lesson-from)/20 to-(--lesson-to)/20")}>
                                    {done ? <Check className="size-5" aria-hidden="true" /> : <span aria-hidden="true">✉️</span>}
                                </span>
                                <div className="min-w-0 flex-1 basis-48">
                                    <p className="font-semibold leading-snug text-foreground">{shortTitle(item.title)}</p>
                                    <p className="mt-0.5 text-xs text-foreground/50">{done ? "Erledigt ✓" : retry ? `Wiederholen (${Math.round(item.lastScore ?? 0)}%)` : item.completed ? "Begonnen" : "Noch offen"}</p>
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
                                    {done || retry ? "Überarbeiten" : "Schreiben"} <ChevronRight className="size-4" aria-hidden="true" />
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
            {filtered.length === 0 && <p className="py-8 text-center text-sm text-foreground/50">Keine Übungen für diesen Filter gefunden.</p>}
            {filtered.length > visible && (
                <div className="text-center">
                    <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="cursor-pointer rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-accent">
                        Mehr anzeigen ({filtered.length - visible})
                    </button>
                </div>
            )}
        </div>
    );
}
