"use client";

import { cn } from "@/lib/utils";

export const INPUT = "w-full rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60";
export const BTN = "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";
export const BTN_PRIMARY = "inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

export function Field({ label, children, className }: Readonly<{ label: string; children: React.ReactNode; className?: string }>) {
    return (
        <label className={cn("block text-xs font-medium text-foreground/70", className)}>
            <span className="mb-1 block">{label}</span>
            {children}
        </label>
    );
}

/** Number input that keeps what the admin types (including "2." or "") and reports a number or null. */
export function NumberInput({ value, onChange, disabled, step = "any", label }: Readonly<{ value: number | null | undefined; onChange: (v: number | null) => void; disabled?: boolean; step?: string; label: string }>) {
    return (
        <input
            aria-label={label}
            type="number"
            step={step}
            className={INPUT}
            disabled={disabled}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
    );
}
