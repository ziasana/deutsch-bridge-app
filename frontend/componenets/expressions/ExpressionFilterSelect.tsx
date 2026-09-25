"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExpressionFilterOption {
    value: string;
    label: string;
}

interface ExpressionFilterSelectProps {
    label: string;
    value: string;
    options: ExpressionFilterOption[];
    onChange: (value: string) => void;
    className?: string;
}

export default function ExpressionFilterSelect({ label, value, options, onChange, className }: ExpressionFilterSelectProps) {
    return (
        <div
            className={cn(
                "relative min-w-[140px] rounded-[10px] border border-border/60 bg-card px-3 py-2 shadow-card transition-colors hover:border-primary/40",
                className,
            )}
        >
            <label className="block text-[11px] text-foreground/50" htmlFor={`expression-filter-${label}`}>
                {label}
            </label>
            <select
                id={`expression-filter-${label}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full appearance-none bg-transparent pr-5 text-sm font-medium text-foreground outline-none"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute bottom-2.5 right-3 size-3.5 text-foreground/40" />
        </div>
    );
}
