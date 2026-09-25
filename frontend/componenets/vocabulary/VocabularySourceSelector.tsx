"use client";

import { LucideIcon, ChevronRight } from "lucide-react";
import { VocabularySource } from "@/types/vocabulary";
import { cn } from "@/lib/utils";
import { SOURCE_HOVER_BORDER, SOURCE_HOVER_BG } from "@/componenets/vocabulary/sourceColors";

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
                return (
                    <button
                        key={opt.source}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onSelect(opt.source)}
                        className={cn(
                            "flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer",
                            active
                                ? "border-primary bg-primary/[0.06]"
                                : cn(
                                      "border-border/60 bg-card shadow-card hover:-translate-y-0.5 hover:shadow-lg",
                                      SOURCE_HOVER_BORDER[opt.source],
                                      SOURCE_HOVER_BG[opt.source],
                                  ),
                        )}
                    >
                        <div
                            className={cn(
                                "flex size-11 shrink-0 items-center justify-center rounded-full",
                                active ? "bg-primary text-primary-foreground" : "bg-accent text-primary",
                            )}
                        >
                            <Icon className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className={cn("font-semibold truncate", active ? "text-primary" : "text-foreground")}>
                                {opt.label}
                            </p>
                            <p className="text-sm text-foreground/55">
                                {opt.count} {unitLabel}
                            </p>
                        </div>
                        <ChevronRight
                            className={cn(
                                "size-4 shrink-0 text-foreground/25 transition-transform",
                                active && "translate-x-0.5 text-primary",
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
}
