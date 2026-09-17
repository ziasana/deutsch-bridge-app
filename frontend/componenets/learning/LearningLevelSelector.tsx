"use client";

import { LucideIcon } from "lucide-react";
import LearningLevelCard from "./LearningLevelCard";
import { cn } from "@/lib/utils";

export interface LearningLevelOption {
    level: string;
    completed: number;
    total: number;
    icon?: LucideIcon;
}

interface LearningLevelSelectorProps {
    levels: LearningLevelOption[];
    selectedLevel: string | null;
    onLevelChange: (level: string) => void;
    unitLabel: string;
    currentLevel?: string | null;
    currentLevelLabel?: string;
    ariaLabel?: string;
    className?: string;
}

export default function LearningLevelSelector({
    levels,
    selectedLevel,
    onLevelChange,
    unitLabel,
    currentLevel,
    currentLevelLabel,
    ariaLabel = "Filter by level",
    className,
}: LearningLevelSelectorProps) {
    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            className={cn("-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:overflow-visible", className)}
        >
            {levels.map((opt) => (
                <LearningLevelCard
                    key={opt.level}
                    level={opt.level}
                    completed={opt.completed}
                    total={opt.total}
                    unitLabel={unitLabel}
                    icon={opt.icon}
                    active={selectedLevel === opt.level}
                    isCurrentLevel={currentLevel === opt.level}
                    currentLevelLabel={currentLevelLabel}
                    onClick={() => onLevelChange(opt.level)}
                />
            ))}
        </div>
    );
}
