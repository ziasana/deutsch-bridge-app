"use client";

import { LucideIcon, Check, ChevronRight } from "lucide-react";
import LearningProgressBar from "./LearningProgressBar";
import { getLevelMeta } from "./levelMeta";
import { cn } from "@/lib/utils";

export interface LearningLevelCardProps {
    level: string;
    completed: number;
    total: number;
    unitLabel: string;
    active: boolean;
    activeLabel?: string;
    icon?: LucideIcon;
    onClick: () => void;
    className?: string;
    /** Overrides the derived completed/total percentage (e.g. an average-score metric instead of a count). */
    percentOverride?: number;
}

export default function LearningLevelCard({
    level,
    completed,
    total,
    unitLabel,
    active,
    activeLabel,
    icon,
    onClick,
    className,
    percentOverride,
}: LearningLevelCardProps) {
    const pct = percentOverride ?? (total > 0 ? Math.round((completed / total) * 100) : 0);
    const meta = getLevelMeta(level);
    const Icon = icon ?? meta.icon;
    const color = meta.color;
    const done = total > 0 && completed >= total;

    return (
        <button
            type="button"
            role="tab"
            onClick={onClick}
            aria-selected={active}
            aria-label={`${level}: ${completed} of ${total} ${unitLabel} completed, ${pct}%${active ? `, ${activeLabel ?? "current level"}` : ""}`}
            style={{
                "--hover-color": color,
                ...(active ? { borderColor: `${color}80`, backgroundImage: `linear-gradient(135deg, ${color}40, ${color}14 65%, ${color}0d)` } : {}),
            } as React.CSSProperties}
            className={cn(
                "group relative flex min-w-[176px] shrink-0 cursor-pointer flex-col gap-3 overflow-hidden rounded-3xl border bg-card p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:min-w-0 sm:flex-1",
                active
                    ? "shadow-card"
                    : "border-border/60 shadow-card hover:-translate-y-0.5 hover:shadow-lg hover:border-[var(--hover-color)]/40 hover:bg-[var(--hover-color)]/[0.06]",
                className,
            )}
        >
            {active && <span aria-hidden="true" className="absolute -end-6 -top-8 size-24 rounded-full" style={{ backgroundColor: `${color}1a` }} />}

            <div className="relative flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                    <span
                        className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl transition", active ? "text-white shadow-sm" : "bg-[var(--hover-color)]/10")}
                        style={active ? { backgroundColor: color } : { color }}
                    >
                        {done ? <Check className="size-6" strokeWidth={3} aria-hidden="true" /> : <Icon className="size-6" aria-hidden="true" />}
                    </span>
                    <span className="text-xl font-extrabold text-foreground">{level}</span>
                </div>
                {active ? (
                    <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm" style={{ backgroundColor: color }}>
                        {activeLabel ?? "Current level"}
                    </span>
                ) : (
                    <ChevronRight className="size-4 shrink-0 text-foreground/25 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden="true" />
                )}
            </div>

            <div className="relative space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="truncate text-foreground/55">
                        {completed} / {total} {unitLabel}
                    </span>
                    <span className={cn("shrink-0 text-sm font-extrabold tabular-nums", active ? "text-foreground" : "text-foreground/75")}>{pct}%</span>
                </div>
                <LearningProgressBar value={pct} color={color} className="h-2" ariaLabel={`${level} progress`} />
            </div>
        </button>
    );
}
