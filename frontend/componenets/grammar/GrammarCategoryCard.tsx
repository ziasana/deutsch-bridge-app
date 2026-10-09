"use client";

import { ReactNode } from "react";
import { ChevronDown, Layers } from "lucide-react";
import { ACCENT_TITLE_COLOR, getLevelMeta } from "@/componenets/learning/levelMeta";
import { cn } from "@/lib/utils";

interface Props {
    title: string;
    level: string;
    itemCount: number;
    learnedCount: number;
    collapsed: boolean;
    onToggle: () => void;
    topicsLabel: string;
    completedLabel: string;
    /** Test result badge(s) beside the counts. */
    headerExtra?: ReactNode;
    /** The category-test call to action, shown under the lessons. */
    footer?: ReactNode;
    children: ReactNode;
}

/** A progress ring with the layers icon (or a check at 100%) in the middle. */
function ProgressRing({ value, color }: Readonly<{ value: number; color: string }>) {
    const size = 56;
    const radius = size / 2 - 5;
    const circumference = 2 * Math.PI * radius;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={5} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (value / 100) * circumference}
                    className="transition-all duration-700"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center">
                <Layers className="size-5" style={{ color }} />
            </span>
        </div>
    );
}

/**
 * A grammar topic block: a progress ring, the title with its counts and test badge, and a chevron. Opens to show
 * the lessons as a learning path, then the category test banner.
 */
export default function GrammarCategoryCard({ title, level, itemCount, learnedCount, collapsed, onToggle, topicsLabel, completedLabel, headerExtra, footer, children }: Readonly<Props>) {
    const color = getLevelMeta(level).color;
    const percent = itemCount > 0 ? Math.round((learnedCount / itemCount) * 100) : 0;
    const done = itemCount > 0 && learnedCount === itemCount;
    return (
        <section className={cn("overflow-hidden rounded-3xl bg-card shadow-card ring-2 transition", done ? "ring-green-500/40" : "ring-transparent")}>
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={!collapsed}
                className="flex w-full cursor-pointer items-center gap-4 p-4 text-start transition hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:p-5"
            >
                <ProgressRing value={percent} color={done ? "#22c55e" : color} />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-bold" style={{ color: ACCENT_TITLE_COLOR }}>{title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/55">
                        <span>{topicsLabel}</span>
                        <span className="font-semibold" style={{ color: done ? "#16a34a" : color }}>
                            {completedLabel}
                        </span>
                        {headerExtra}
                    </div>
                </div>
                <ChevronDown className={cn("size-5 shrink-0 text-foreground/40 transition-transform duration-200", !collapsed && "rotate-180")} aria-hidden="true" />
            </button>

            {!collapsed && (
                <div className="border-t border-border/60 px-4 pb-4 pt-4 sm:px-5">
                    <ol className="space-y-0">{children}</ol>
                    {footer}
                </div>
            )}
        </section>
    );
}
