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

/** First choice on the Prüfungsvorbereitung page: which exam the learner prepares for (Telc B1 or DTZ A2–B1). */
export default function ExamTypeSwitch({ selected, onSelect, className }: Readonly<ExamTypeSwitchProps>) {
    return (
        <div role="tablist" aria-label="Prüfung auswählen" className={cn("grid gap-3 sm:grid-cols-2", className)}>
            {EXAM_TYPES.map((exam) => {
                const active = exam.code === selected;
                return (
                    <button
                        key={exam.code}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onSelect(exam.code)}
                        className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                            active
                                ? "border-primary bg-primary/[0.06] shadow-card"
                                : "border-border/60 bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card",
                        )}
                    >
                        <span
                            aria-hidden="true"
                            className={cn(
                                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                                active ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25",
                            )}
                        >
                            {active && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                            <span className="block font-bold text-foreground">{exam.label}</span>
                            <span className="mt-0.5 block text-xs leading-snug text-foreground/55">{exam.description}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
