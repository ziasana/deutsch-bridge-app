"use client";

import { Check, ChevronRight, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExamSection } from "@/types/exam";
import { useExamTimeConfiguration } from "@/hooks/exam/useExamTimeConfiguration";
import { ExamPartGroup, PartState } from "./examData";
import { LessonAccent, lessonThemeVars } from "./lessonTheme";

const ACTION: Record<PartState, { label: string; chip: string; chipClass: string }> = {
    not_started: { label: "Starten", chip: "Neu", chipClass: "bg-accent text-foreground/60" },
    in_progress: { label: "Weiter", chip: "Unterwegs", chipClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
    completed: { label: "Review", chip: "Geschafft ✓", chipClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
};

interface ExamPartListProps {
    section: ExamSection;
    level: string;
    accent: LessonAccent;
    groups: ExamPartGroup[];
    onOpen: (group: ExamPartGroup) => void;
}

/** Recommended time of a Teil as a small chip (nothing while unknown, so the card never shows a placeholder). */
function MinutesChip({ section, level, teil }: Readonly<{ section: ExamSection; level: string; teil: number | null }>) {
    const { minutes } = useExamTimeConfiguration(level, section, teil);
    if (minutes == null) return null;
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Timer className="size-3" aria-hidden="true" /> {minutes} Min.
        </span>
    );
}

/** The Teile of a section as a journey: numbered path, one card per Teil with progress, recommended time and a clear next action. */
export default function ExamPartList({ section, level, accent, groups, onOpen }: Readonly<ExamPartListProps>) {
    const nextKey = groups.find((g) => g.state !== "completed")?.key ?? null;

    return (
        <ol className="relative space-y-4" style={lessonThemeVars(accent)}>
            <span aria-hidden="true" className="absolute bottom-10 start-6 top-10 hidden w-0.5 bg-gradient-to-b from-(--lesson-from)/40 via-(--lesson-to)/40 to-transparent sm:block" />
            {groups.map((group, index) => {
                const state = group.state;
                const isNext = group.key === nextKey && groups.some((g) => g.state !== "not_started");
                const teil = group.items[0]?.teil ?? null;
                const percent = Math.round(group.avgScore);
                return (
                    <li key={group.key} className="anim-fade-up relative sm:ps-16" style={{ animationDelay: `${index * 70}ms` }}>
                        <span
                            aria-hidden="true"
                            className={cn(
                                "absolute start-0 top-5 hidden size-12 items-center justify-center rounded-full text-lg font-extrabold text-white shadow-md ring-4 ring-background sm:flex",
                                state === "completed" ? "bg-emerald-500" : "bg-primary",
                            )}
                        >
                            {state === "completed" ? <Check className="size-6" /> : index + 1}
                        </span>
                        <button
                            type="button"
                            onClick={() => onOpen(group)}
                            className={cn(
                                "group flex w-full cursor-pointer flex-col gap-4 rounded-2xl border bg-card p-4 text-start shadow-card transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:p-5 md:flex-row md:items-center",
                                state === "completed" ? "border-emerald-500/40" : isNext ? "border-primary/40" : "border-transparent hover:border-primary/40",
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-primary">Teil {teil ?? index + 1}</span>
                                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", ACTION[state].chipClass)}>{ACTION[state].chip}</span>
                                    <MinutesChip section={section} level={level} teil={teil} />
                                </div>
                                <h3 className="mt-2 text-lg font-bold leading-tight text-foreground">{group.subheading ?? group.label}</h3>
                                <p className="mt-0.5 text-sm text-foreground/60">
                                    {group.total} {group.total === 1 ? "Übung" : "Übungen"} · {group.mastered} erledigt
                                </p>
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-label={`${group.label} Fortschritt`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
                                        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${percent}%` }} />
                                    </div>
                                    <span className="shrink-0 text-xs font-bold tabular-nums text-foreground/60">{percent}%</span>
                                </div>
                            </div>
                            <span className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition group-hover:bg-primary/90 group-hover:shadow-md">
                                {ACTION[state].label}
                                <ChevronRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                            </span>
                        </button>
                    </li>
                );
            })}
        </ol>
    );
}
