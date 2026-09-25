"use client";

import { ExamSection } from "@/types/exam";
import { EXAM_TYPE_META } from "./examMeta";
import LearningProgressBar from "@/componenets/learning/LearningProgressBar";
import { cn } from "@/lib/utils";

export interface ExamTypeCardProps {
    section: ExamSection;
    partsCount: number;
    mastered: number;
    total: number;
    avgScore: number;
    active: boolean;
    onClick: () => void;
    className?: string;
}

export default function ExamTypeCard({ section, partsCount, mastered, total, avgScore, active, onClick, className }: ExamTypeCardProps) {
    const meta = EXAM_TYPE_META[section];
    const Icon = meta.icon;

    return (
        <button
            type="button"
            role="tab"
            onClick={onClick}
            aria-selected={active}
            style={{ "--hover-color": meta.color } as React.CSSProperties}
            className={cn(
                "group flex min-w-0 flex-col gap-3 rounded-2xl border bg-card p-4 text-left transition-all duration-200 cursor-pointer",
                active
                    ? "border-[var(--hover-color)] bg-[var(--hover-color)]/[0.05]"
                    : "border-border/60 shadow-card hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--hover-color)]/40 hover:bg-[var(--hover-color)]/[0.06]",
                className,
            )}
        >
            <div className="flex items-center gap-2.5">
                <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${meta.color}1a` }}
                >
                    <Icon className="size-4.5" style={{ color: meta.color }} />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground leading-tight break-words">{meta.label}</div>
                    <div className="text-xs text-foreground/50">
                        {meta.informational ? "Informationen" : `${partsCount} Teil${partsCount === 1 ? "" : "e"}`}
                    </div>
                </div>
            </div>

            {meta.informational ? (
                <p className="text-xs text-foreground/50 leading-snug">{meta.description}</p>
            ) : (
                <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                        <span className="text-foreground/55">
                            {mastered} / {total}
                        </span>
                        <span className="font-medium text-foreground/70">{avgScore}%</span>
                    </div>
                    <LearningProgressBar value={avgScore} color={meta.color} ariaLabel={`${meta.label} progress`} />
                </div>
            )}
        </button>
    );
}
