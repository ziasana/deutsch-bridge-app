"use client";

import { LucideIcon, ChevronRight } from "lucide-react";
import { VocabularySource } from "@/types/vocabulary";
import { cn } from "@/lib/utils";
import { SOURCE_ACCENT } from "@/componenets/vocabulary/sourceColors";

export interface VocabularySourceOption {
    source: VocabularySource;
    label: string;
    count: number;
    icon: LucideIcon;
}

interface VocabularySourceSelectorProps {
    options: VocabularySourceOption[];
    selected: VocabularySource;
    onSelect: (source: VocabularySource) => void;
    unitLabel?: string;
    className?: string;
}

export default function VocabularySourceSelector({
    options,
    selected,
    onSelect,
    unitLabel = "words",
    className,
}: VocabularySourceSelectorProps) {
    return (
        <div role="tablist" aria-label="Vocabulary source" className={cn("grid grid-cols-1 sm:grid-cols-3 gap-4", className)}>
            {options.map((opt) => {
                const active = selected === opt.source;
                const Icon = opt.icon;
                const color = SOURCE_ACCENT[opt.source];
                return (
                    <button
                        key={opt.source}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onSelect(opt.source)}
                        style={{
                            "--hover-color": color,
                            ...(active ? { borderColor: `${color}80`, backgroundImage: `linear-gradient(135deg, ${color}40, ${color}14 65%, ${color}0d)` } : {}),
                        } as React.CSSProperties}
                        className={cn(
                            "group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-3xl border bg-card p-4 text-left shadow-card transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                            !active && "border-border/60 hover:-translate-y-0.5 hover:border-[var(--hover-color)]/40 hover:bg-[var(--hover-color)]/[0.06] hover:shadow-lg",
                        )}
                    >
                        {active && <span aria-hidden="true" className="absolute -end-6 -top-8 size-24 rounded-full" style={{ backgroundColor: `${color}1a` }} />}
                        <div
                            className={cn("relative flex size-12 shrink-0 items-center justify-center rounded-2xl transition", active ? "text-white shadow-sm" : "bg-[var(--hover-color)]/10")}
                            style={active ? { backgroundColor: color } : { color }}
                        >
                            <Icon className="size-6" />
                        </div>
                        <div className="relative min-w-0 flex-1">
                            <p className="truncate text-base font-extrabold text-foreground">{opt.label}</p>
                            <p className="text-sm text-foreground/55">
                                {opt.count} {unitLabel}
                            </p>
                        </div>
                        {!active && <ChevronRight className="size-4 shrink-0 text-foreground/25 transition-transform group-hover:translate-x-0.5" />}
                    </button>
                );
            })}
        </div>
    );
}
