"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearningSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    ariaLabel?: string;
    className?: string;
    /** Shorter field for toolbars. */
    compact?: boolean;
}

export default function LearningSearch({ value, onChange, placeholder, ariaLabel, className, compact = false }: LearningSearchProps) {
    return (
        <div className={cn("relative w-full", className)}>
            <Search className={cn("pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-foreground/40", compact ? "left-3" : "left-4")} />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={ariaLabel ?? placeholder}
                className={cn("w-full rounded-[10px] border border-border/60 bg-card text-sm text-foreground outline-none transition placeholder:text-foreground/40 focus:ring-2 focus:ring-primary/40", compact ? "py-2 pl-9 pr-9 shadow-none" : "py-3 pl-11 pr-10 shadow-card")}
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-foreground/40 transition hover:bg-accent hover:text-foreground"
                >
                    <X className="size-4" />
                </button>
            )}
        </div>
    );
}
