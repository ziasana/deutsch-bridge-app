"use client";

import { cn } from "@/lib/utils";

interface LearningProgressBarProps {
    value: number;
    color?: string;
    className?: string;
    barClassName?: string;
    ariaLabel?: string;
}

export default function LearningProgressBar({ value, color, className, barClassName, ariaLabel }: LearningProgressBarProps) {
    const pct = Math.max(0, Math.min(100, value));

    return (
        <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={ariaLabel}
            className={cn("h-1.5 w-full overflow-hidden rounded-full bg-foreground/10", className)}
        >
            <div
                className={cn("h-full rounded-full transition-all duration-300", !color && "bg-primary", barClassName)}
                style={{ width: `${pct}%`, backgroundColor: color }}
            />
        </div>
    );
}
