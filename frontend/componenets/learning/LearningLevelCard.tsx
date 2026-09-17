"use client";

import { LucideIcon, ChevronRight } from "lucide-react";
import LearningProgressBar from "./LearningProgressBar";
import { getLevelMeta } from "./levelMeta";
import { cn } from "@/lib/utils";

export interface LearningLevelCardProps {
    level: string;
    completed: number;
    total: number;
    unitLabel: string;
    active: boolean;
    isCurrentLevel?: boolean;
    currentLevelLabel?: string;
    icon?: LucideIcon;
    onClick: () => void;
    className?: string;
}

export default function LearningLevelCard({
    level,
    completed,
    total,
    unitLabel,
    active,
    isCurrentLevel,
    currentLevelLabel,
    icon,
    onClick,
    className,
}: LearningLevelCardProps) {
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const meta = getLevelMeta(level);
    const Icon = icon ?? meta.icon;
    const color = meta.color;
    const showBadge = active || isCurrentLevel;

    return (
        <button
            type="button"
            role="tab"
            onClick={onClick}
            aria-selected={active}
            aria-label={`${level}: ${completed} of ${total} ${unitLabel} completed, ${pct}%${showBadge ? `, ${currentLevelLabel ?? "current level"}` : ""}`}
            className={cn(
                "group relative flex shrink-0 flex-col gap-3 rounded-2xl border bg-card p-4 text-left transition-all duration-200 min-w-[176px] sm:min-w-0 sm:flex-1",
                active
                    ? "border-primary bg-primary/[0.05]"
                    : "border-border/60 shadow-card hover:-translate-y-0.5 hover:shadow-lg",
                className,
            )}
        >
            {showBadge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-[10px] font-semibold text-primary-foreground shadow-sm">
                    {currentLevelLabel ?? "Current level"}
                </span>
            )}

            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <Icon className="size-6 shrink-0" style={{ color }} />
                    <span className="font-semibold text-foreground">{level}</span>
                </div>
                <ChevronRight
                    className={cn(
                        "size-4 shrink-0 text-foreground/25 transition-transform",
                        active && "translate-x-0.5 text-primary",
                    )}
                />
            </div>

            <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-xs">
                    <span className="truncate text-foreground/55">
                        {completed} / {total} {unitLabel}
                    </span>
                    <span className="shrink-0 font-medium text-foreground/70">{pct}%</span>
                </div>
                <LearningProgressBar value={pct} color={color} ariaLabel={`${level} progress`} />
            </div>
        </button>
    );
}
