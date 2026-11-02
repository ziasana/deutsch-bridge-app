"use client";

import { Check } from "lucide-react";
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

/** One exam part (Lesen, Hören ...): coloured icon tile, the full name on one line, parts and progress. The selected card gets a ring and a check in its colour. */
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
                "group relative flex min-w-0 flex-col gap-3 rounded-2xl border-2 bg-card p-4 text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d8bff] focus-visible:ring-offset-2",
                active
                    ? "border-[var(--hover-color)] bg-[var(--hover-color)]/[0.07] shadow-card"
                    : "border-transparent shadow-card hover:-translate-y-0.5 hover:border-[var(--hover-color)]/40",
                className,
            )}
        >
            {active && (
                <span
                    aria-hidden="true"
                    className="absolute end-3 top-3 flex size-5 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: meta.color }}
                >
                    <Check className="size-3" strokeWidth={3.5} />
                </span>
            )}
            <div className="flex items-center gap-3">
                <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${meta.color}22` }}
                >
                    <Icon className="size-6" style={{ color: meta.color }} />
                </span>
                <div className="min-w-0 flex-1 pe-5">
                    <div className="text-[15px] font-bold leading-tight text-foreground [overflow-wrap:normal] [hyphens:none]">{meta.label}</div>
                    <div className="mt-0.5 text-xs text-foreground/55">
                        {meta.informational ? "Informationen" : `${partsCount} Teil${partsCount === 1 ? "" : "e"}`}
                    </div>
                </div>
            </div>

            {meta.informational ? (
                <p className="text-xs leading-snug text-foreground/55">{meta.description}</p>
            ) : (
                <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                        <span className="text-foreground/60">{mastered} von {total} gemeistert</span>
                        <span className="font-semibold text-foreground/75">{avgScore}%</span>
                    </div>
                    <LearningProgressBar value={avgScore} color={meta.color} ariaLabel={`${meta.label} progress`} />
                </div>
            )}
        </button>
    );
}
