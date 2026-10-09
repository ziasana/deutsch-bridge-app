"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExamExercisePublicResponse } from "@/types/exam";
import ExamExerciseTimer from "./ExamExerciseTimer";
import { LessonAccent, lessonThemeVars } from "./lessonTheme";

/** The task text as short steps: one per sentence, so a two-sentence instruction reads as "1. ... 2. ...". */
export const instructionSteps = (text: string): string[] => text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

interface ExerciseTopHeaderProps {
    exercise: ExamExercisePublicResponse;
    accent: LessonAccent;
    icon: LucideIcon;
    /** Badge text, e.g. "Teil 1 · Einander kennenlernen". */
    kicker: string;
    /** Small grey section name next to the chips. */
    sectionLabel: string;
    /** The title without the parts that are already shown as chips. */
    title: string;
    /** False for sections without a Teil timer (Hörverstehen is paced by the audio). */
    showTimer?: boolean;
    /** "steps" (default): one numbered line per sentence. "paragraph": the whole text as one paragraph. */
    descriptionAs?: "steps" | "paragraph";
    bookmarked: boolean;
    bookmarkPending: boolean;
    onToggleBookmark: () => void;
}

/**
 * Top of an exercise as ONE card instead of three stacked boxes: title with Teil badge, the timer as a
 * progress ring, and the task description as a collapsible speech bubble with numbered steps.
 */
export default function ExerciseTopHeader({ exercise, accent, icon: Icon, kicker, sectionLabel, title, showTimer = true, descriptionAs = "steps", bookmarked, bookmarkPending, onToggleBookmark }: Readonly<ExerciseTopHeaderProps>) {
    const [open, setOpen] = useState(true);
    const steps = exercise.teilDescription ? instructionSteps(exercise.teilDescription) : [];

    return (
        <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-card shadow-card" style={lessonThemeVars(accent)}>
            <span aria-hidden="true" className="pointer-events-none absolute -end-10 -top-12 size-44 rounded-full bg-gradient-to-br from-(--lesson-from)/20 to-(--lesson-to)/20" />
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 start-1/3 size-40 rounded-full bg-amber-400/10" />

            <div className={cn("relative grid gap-5 p-5 sm:p-6 lg:items-center", showTimer && "lg:grid-cols-[1fr_auto]")}>
                <div className="flex min-w-0 items-start gap-4">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) text-white shadow-md sm:size-16">
                        <Icon className="size-7 sm:size-8" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">{kicker}</span>
                            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{exercise.level ?? "Alle Niveaus"}</span>
                            <span className="text-xs font-medium text-foreground/50">{sectionLabel}</span>
                        </div>
                        <h1 className="mt-1.5 text-xl font-extrabold leading-tight text-foreground sm:text-2xl">{title}</h1>
                        <button
                            type="button"
                            disabled={bookmarkPending}
                            onClick={onToggleBookmark}
                            aria-pressed={bookmarked}
                            className={cn(
                                "mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-60",
                                bookmarked ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-primary text-primary-foreground hover:bg-primary/90",
                            )}
                        >
                            {bookmarked ? <BookmarkCheck className="size-3.5" aria-hidden="true" /> : <Bookmark className="size-3.5" aria-hidden="true" />}
                            {bookmarked ? "Gemerkt" : "Merken"}
                        </button>
                    </div>
                </div>

                {showTimer && (
                    <div className="rounded-2xl bg-accent/50 p-4 lg:min-w-80">
                        <ExamExerciseTimer exercise={exercise} variant="ring" />
                    </div>
                )}
            </div>

            {steps.length > 0 && (
                <div className="relative border-t border-border/60 px-5 pb-5 pt-4 sm:px-6">
                    <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpen((v) => !v)}
                        className="flex w-full cursor-pointer items-center justify-between gap-2 text-start text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        <span className="inline-flex items-center gap-2"><span aria-hidden="true">💬</span>Aufgabenstellung</span>
                        <ChevronDown className={cn("size-4 text-foreground/50 transition-transform", open && "rotate-180")} aria-hidden="true" />
                    </button>
                    {open && descriptionAs === "paragraph" && (
                        <p className="anim-fade-up mt-3 rounded-2xl rounded-ss-sm bg-gradient-to-r from-(--lesson-from)/10 to-(--lesson-to)/10 p-4 text-sm leading-relaxed text-foreground/85">
                            {exercise.teilDescription?.replace(/\s*\n+\s*/g, " ").trim()}
                        </p>
                    )}
                    {open && descriptionAs === "steps" && (
                        <ol className="anim-fade-up mt-3 space-y-2">
                            {steps.map((step, index) => (
                                <li key={step} className="flex items-start gap-3 rounded-2xl rounded-ss-sm bg-gradient-to-r from-(--lesson-from)/10 to-(--lesson-to)/10 p-3 text-sm leading-relaxed text-foreground/85">
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) text-xs font-bold text-white" aria-hidden="true">
                                        {index + 1}
                                    </span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            )}
        </section>
    );
}
