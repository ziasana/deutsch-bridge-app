"use client";

import { ExamSection } from "@/types/exam";
import ExamTypeCard from "./ExamTypeCard";
import { cn } from "@/lib/utils";

export interface ExamTypeOption {
    section: ExamSection;
    partsCount: number;
    mastered: number;
    total: number;
    avgScore: number;
}

interface ExamTypeSelectorProps {
    types: ExamTypeOption[];
    selected: ExamSection;
    onSelect: (section: ExamSection) => void;
    className?: string;
}

export default function ExamTypeSelector({ types, selected, onSelect, className }: ExamTypeSelectorProps) {
    return (
        <div
            role="tablist"
            aria-label="Prüfungsteil auswählen"
            className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5", className)}
        >
            {types.map((option) => (
                <ExamTypeCard
                    key={option.section}
                    section={option.section}
                    partsCount={option.partsCount}
                    mastered={option.mastered}
                    total={option.total}
                    avgScore={option.avgScore}
                    active={selected === option.section}
                    onClick={() => onSelect(option.section)}
                />
            ))}
        </div>
    );
}
