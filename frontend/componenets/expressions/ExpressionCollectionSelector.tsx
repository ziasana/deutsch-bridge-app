"use client";

import { LucideIcon, ChevronRight } from "lucide-react";
import { ExpressionType } from "@/types/expression";
import { cn } from "@/lib/utils";

export interface ExpressionCollectionOption {
    type: ExpressionType;
    label: string;
    count: number;
    icon: LucideIcon;
}

interface ExpressionCollectionSelectorProps {
    options: ExpressionCollectionOption[];
    selected: ExpressionType;
    onSelect: (type: ExpressionType) => void;
    unitLabel?: string;
    className?: string;
}

export default function ExpressionCollectionSelector({
    options,
    selected,
    onSelect,
    unitLabel = "expressions",
    className,
}: ExpressionCollectionSelectorProps) {
    return (
        <div role="tablist" aria-label="Expression collection" className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", className)}>
            {options.map((opt) => {
                const active = selected === opt.type;
                const Icon = opt.icon;
                return (
                    <button
                        key={opt.type}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onSelect(opt.type)}
                        className={cn(
                            "flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer",
                            active
                                ? "border-primary bg-primary/[0.06]"
                                : "border-border/60 bg-card shadow-card hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/40 hover:bg-primary/[0.06]",
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
