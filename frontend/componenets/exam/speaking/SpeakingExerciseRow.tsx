"use client";

import { Bookmark, BookmarkCheck, Check, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/examTime";
import { ExamExerciseSummaryResponse } from "@/types/exam";
import { ExamExerciseLastTime } from "@/types/examTime";
import { effectiveScore } from "../examData";
import { shortSpeakingTitle } from "./SpeakingTopHeader";

export const TEIL_EMOJI: Record<number, string> = { 1: "👋", 2: "💭", 3: "🤝" };

interface SpeakingExerciseRowProps {
    item: ExamExerciseSummaryResponse;
    teil: number;
    index: number;
    time?: ExamExerciseLastTime;
    bookmarkPending: boolean;
    onOpen: (id: string) => void;
    onToggleBookmark: (id: string, bookmarked: boolean) => void;
}

/** One Übung of Mündlicher Ausdruck as a full-width row: status, title, last time against the recommendation, action and bookmark. */
export default function SpeakingExerciseRow({ item, teil, index, time, bookmarkPending, onOpen, onToggleBookmark }: Readonly<SpeakingExerciseRowProps>) {
    const done = effectiveScore(item) >= 100;
    const within = time?.targetSeconds != null && time.elapsedSeconds <= time.targetSeconds;
    return (
        <li className="anim-fade-up" style={{ animationDelay: `${index * 40}ms` }}>
            <div
                role="button"
                tabIndex={0}
                onClick={() => onOpen(item.id)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpen(item.id);
                    }
                }}
                className={cn(
                    "group flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    done ? "border-emerald-500/40" : "border-transparent hover:border-pink-500/40",
                )}
            >
                <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold", done ? "bg-emerald-500 text-white" : "bg-gradient-to-br from-pink-500/20 to-orange-400/20 text-pink-700 dark:text-pink-300")}>
                    {done ? <Check className="size-5" aria-hidden="true" /> : <span aria-hidden="true">{TEIL_EMOJI[teil] ?? "🎤"}</span>}
                </span>
                <div className="min-w-0 flex-1 basis-48">
                    <p className="font-semibold leading-snug text-foreground">{shortSpeakingTitle(item.title)}</p>
                    <p className="mt-0.5 text-xs text-foreground/50">{done ? "Erledigt ✓" : item.completed ? "Begonnen" : "Noch offen"}</p>
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
                <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-pink-600 transition group-hover:gap-1.5 dark:text-pink-300">
                    {done ? "Wiederholen" : "Öffnen"} <ChevronRight className="size-4" aria-hidden="true" />
                </span>
                <button
                    type="button"
                    disabled={bookmarkPending}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(item.id, item.bookmarked);
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
}
