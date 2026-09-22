"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearningSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    ariaLabel?: string;
    className?: string;
}

export default function LearningSearch({ value, onChange, placeholder, ariaLabel, className }: LearningSearchProps) {
    return (
        <div className={cn("relative w-full", className)}>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={ariaLabel ?? placeholder}
                className="w-full rounded-[10px] border border-border/60 bg-card py-3 pl-11 pr-10 text-sm text-foreground shadow-card outline-none transition placeholder:text-foreground/40 focus:ring-2 focus:ring-primary/40"
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
