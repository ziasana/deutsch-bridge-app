"use client";

import { CheckCircle2, ChevronRight } from "lucide-react";
import { PartState } from "./examData";
import LearningProgressBar from "@/componenets/learning/LearningProgressBar";
import { cn } from "@/lib/utils";

export interface ExamPartCardProps {
    index: number;
    title: string;
    exerciseCount: number;
    mastered: number;
    total: number;
    avgScore: number;
    state: PartState;
    color: string;
    onClick: () => void;
    className?: string;
}

const ACTION_LABEL: Record<PartState, string> = {
    not_started: "Starten",
    in_progress: "Weiter",
    completed: "Review",
};

export default function ExamPartCard({ index, title, exerciseCount, mastered, total, avgScore, state, color, onClick, className }: ExamPartCardProps) {

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 rounded-[10px] bg-card p-4 text-left transition hover:bg-accent/40",
                className,
            )}
        >
            <div className="flex min-w-0 items-center gap-3 sm:w-72 sm:shrink-0">
                {state === "completed" ? (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
                        <CheckCircle2 className="size-4.5 text-white" strokeWidth={2.5} />
                    </span>
                ) : (
                    <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold"
                        style={{ borderColor: color, color }}
                    >
                        {index}
                    </span>
                )}
                <div className="min-w-0">
                    <div className="font-semibold text-foreground leading-tight">{title}</div>
                    <div className="text-xs text-foreground/50">{exerciseCount} {exerciseCount === 1 ? "Übung" : "Übungen"}</div>
                </div>
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-3">
                <LearningProgressBar value={avgScore} color={color} className="flex-1" ariaLabel={`${title} progress`} />
                <span className="shrink-0 text-xs font-medium text-foreground/60 whitespace-nowrap">
                    {mastered} / {total} ({avgScore}%)
                </span>
            </div>

            <div className="flex items-center justify-between gap-2 sm:justify-end sm:w-32 sm:shrink-0">
                {state === "completed" && (
                    <span className="text-xs font-medium" style={{ color }}>
                        Erledigt ✓
                    </span>
                )}
                <span className="flex items-center gap-0.5 text-sm font-medium text-primary shrink-0">
                    {ACTION_LABEL[state]}
                    <ChevronRight className="size-4" />
                </span>
            </div>
        </button>
    );
}
