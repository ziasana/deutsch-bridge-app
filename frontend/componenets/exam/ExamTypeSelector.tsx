"use client";

import { Check } from "lucide-react";
import { ExamSection } from "@/types/exam";
import { EXAM_TYPE_META } from "./examMeta";
import LearningProgressBar from "@/componenets/learning/LearningProgressBar";
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

const RING_R = 19;
const RING_C = 2 * Math.PI * RING_R;

/** Section icon inside a progress ring: the ring shows the section's average score at a glance. */
function SectionRing({ section, percent, done }: Readonly<{ section: ExamSection; percent: number; done: boolean }>) {
    const meta = EXAM_TYPE_META[section];
    const Icon = meta.icon;
    const value = Math.max(0, Math.min(100, percent));
    return (
        <span className="relative flex size-12 shrink-0 items-center justify-center">
            <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden="true">
                <circle cx="22" cy="22" r={RING_R} fill="none" strokeWidth="3" stroke={`${meta.color}26`} />
                {!meta.informational && (
                    <circle
                        cx="22"
                        cy="22"
                        r={RING_R}
                        fill="none"
                        strokeWidth="3"
                        strokeLinecap="round"
                        stroke={meta.color}
                        strokeDasharray={RING_C}
                        strokeDashoffset={RING_C * (1 - value / 100)}
                        className="transition-all duration-500"
                    />
                )}
            </svg>
            <Icon className="size-5" style={{ color: meta.color }} aria-hidden="true" />
            {done && (
                <span aria-hidden="true" className="absolute -bottom-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full bg-[#527c91] text-white ring-2 ring-card">
                    <Check className="size-2.5" strokeWidth={4} />
                </span>
            )}
        </span>
    );
}

/**
 * The exam parts as one tab strip joined to a summary of the selected part: the strip is for switching quickly,
 * the summary tells how far the learner is in the part they are looking at.
 */
export default function ExamTypeSelector({ types, selected, onSelect, className }: ExamTypeSelectorProps) {
    const current = types.find((t) => t.section === selected) ?? types[0];
    const currentMeta = current ? EXAM_TYPE_META[current.section] : null;

    return (
        <div className={cn("overflow-hidden rounded-2xl bg-card shadow-card", className)}>
            <div role="tablist" aria-label="Prüfungsteil auswählen" className="flex overflow-x-auto border-b border-border/70">
                {types.map((option) => {
                    const meta = EXAM_TYPE_META[option.section];
                    const active = option.section === selected;
                    const done = !meta.informational && option.total > 0 && option.mastered >= option.total;
                    return (
                        <button
                            key={option.section}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onSelect(option.section)}
                            style={{ "--section-color": meta.color } as React.CSSProperties}
                            className={cn(
                                "relative flex min-w-[116px] flex-1 cursor-pointer flex-col items-center gap-1.5 px-3 pb-3 pt-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3d8bff]",
                                active ? "bg-[var(--section-color)]/[0.08]" : "hover:bg-foreground/[0.03]",
                            )}
                        >
                            <SectionRing section={option.section} percent={option.avgScore} done={done} />
                            <span className={cn("whitespace-nowrap text-[13px] leading-tight", active ? "font-bold text-foreground" : "font-semibold text-foreground/75")}>{meta.label}</span>
                            <span className="text-[11px] text-foreground/50">
                                {meta.informational ? "Info" : `${option.partsCount} Teil${option.partsCount === 1 ? "" : "e"}`}
                            </span>
                            <span aria-hidden="true" className={cn("absolute inset-x-0 bottom-0 h-[3px] transition-opacity", active ? "opacity-100" : "opacity-0")} style={{ backgroundColor: meta.color }} />
                        </button>
                    );
                })}
            </div>

            {current && currentMeta && (
                <div role="tabpanel" aria-live="polite" className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
                    <div className="min-w-0">
                        <p className="text-base font-bold text-foreground">{currentMeta.label}</p>
                        <p className="text-sm text-foreground/60">
                            {currentMeta.informational ? currentMeta.description : `${current.partsCount} Teil${current.partsCount === 1 ? "" : "e"} · ${current.total} Aufgaben`}
                        </p>
                    </div>
                    {!currentMeta.informational && (
                        <>
                            <div className="min-w-[160px] flex-1">
                                <div className="mb-1.5 flex items-baseline justify-between text-xs">
                                    <span className="text-foreground/60">{current.mastered} von {current.total} gemeistert</span>
                                </div>
                                <LearningProgressBar value={current.avgScore} color={currentMeta.color} ariaLabel={`${currentMeta.label} Fortschritt`} />
                            </div>
                            <p className="text-2xl font-extrabold tabular-nums" style={{ color: currentMeta.color }}>
                                {current.avgScore}%
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
