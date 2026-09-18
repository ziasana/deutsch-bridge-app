"use client";

import { ArrowRight, LucideIcon, Target } from "lucide-react";
import { PartState } from "./examData";
import LearningProgressBar from "@/componenets/learning/LearningProgressBar";

export interface ContinueLearningCardProps {
    typeLabel: string;
    typeIcon: LucideIcon;
    partLabel: string;
    mastered: number;
    total: number;
    avgScore: number;
    state: PartState;
    onNavigate: () => void;
}

const ACTION_LABEL: Record<PartState, string> = {
    not_started: "Starten",
    in_progress: "Weiter",
    completed: "Review",
};

export default function ContinueLearningCard({
    typeLabel,
    typeIcon: TypeIcon,
    partLabel,
    mastered,
    total,
    avgScore,
    state,
    onNavigate,
}: ContinueLearningCardProps) {

    return (
        <div className="rounded-[10px] bg-card shadow-card p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Target className="size-5 text-primary" />
                    </span>
                    <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground">Weiterlernen</div>
                        <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                            <TypeIcon className="size-4 text-foreground/50 shrink-0" />
                            {typeLabel} – {partLabel}
                        </div>
                        <p className="text-sm text-foreground/55 mt-0.5">
                            {state === "completed"
                                ? `${total} von ${total} Übungen gemeistert`
                                : `${mastered} von ${total} Übungen gemeistert`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 sm:shrink-0">
                    <div className="flex items-center gap-2 w-40">
                        <LearningProgressBar value={avgScore} className="flex-1" ariaLabel="Weiterlernen progress" />
                        <span className="text-xs font-medium text-foreground/60 shrink-0">{avgScore}%</span>
                    </div>
                    <button
                        type="button"
                        onClick={onNavigate}
                        className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 shrink-0"
                    >
                        {ACTION_LABEL[state]}
                        <ArrowRight className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
