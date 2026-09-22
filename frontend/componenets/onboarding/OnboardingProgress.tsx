"use client";

import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
    stepIndex: number; // 0-based
    totalSteps: number;
    className?: string;
}

export default function OnboardingProgress({ stepIndex, totalSteps, className }: OnboardingProgressProps) {
    return (
        <div className={cn("flex items-center gap-1.5", className)} role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
            {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                    key={i}
                    className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors duration-300",
                        i <= stepIndex ? "bg-primary" : "bg-border",
                    )}
                />
            ))}
        </div>
    );
}
