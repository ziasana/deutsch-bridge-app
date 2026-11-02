"use client";

import { Check } from "lucide-react";
import { ExamTypeCode } from "@/types/exam";
import { cn } from "@/lib/utils";
import { EXAM_TYPES } from "./examMeta";

interface ExamTypeSwitchProps {
    selected: ExamTypeCode;
    onSelect: (examType: ExamTypeCode) => void;
    className?: string;
}

/**
 * First choice on the Prüfungsvorbereitung page: which exam the learner prepares for (Telc B1 or DTZ A2-B1).
 * Large cards on purpose: the chosen one is filled with Deep Navy, so it is always obvious which exam the page shows.
 */
export default function ExamTypeSwitch({ selected, onSelect, className }: Readonly<ExamTypeSwitchProps>) {
    return (
        <div role="radiogroup" aria-label="Prüfung auswählen" className={cn("grid gap-3 sm:grid-cols-2", className)}>
            {EXAM_TYPES.map((exam) => {
                const active = exam.code === selected;
                return (
                    <button
                        key={exam.code}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onSelect(exam.code)}
                        className={cn(
                            "group relative flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d8bff] focus-visible:ring-offset-2",
                            active
                                ? "border-[#16324f] bg-[#16324f] text-white shadow-card"
                                : "border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-[#16324f]/40 hover:shadow-card",
                        )}
                    >
                        <span
                            aria-hidden="true"
                            className={cn(
                                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition",
                                active ? "border-[#f2b544] bg-[#f2b544] text-[#16324f]" : "border-foreground/25",
                            )}
                        >
                            {active && <Check className="size-4" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2">
                                <span className="text-lg font-bold leading-tight">{exam.label}</span>
                                {(exam.levelLabel ?? exam.fixedLevel) && (
                                <span
                                    className={cn(
                                        "rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                                        active ? "bg-white/15 text-[#f2b544]" : "bg-[#16324f]/10 text-[#16324f] dark:text-foreground",
                                    )}
                                >
                                    {exam.levelLabel ?? exam.fixedLevel}
                                </span>
                                )}
                            </span>
                            <span className={cn("mt-1 block text-sm leading-snug", active ? "text-[#b9c7d6]" : "text-foreground/60")}>{exam.description}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
