"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryEmoji } from "./redemittelMeta";

interface Props {
    categories: { key: string; label: string; count: number }[];
    value: string;
    onChange: (key: string) => void;
}

/**
 * The communicative functions (from the backend) as one compact picker: a pill showing the current
 * choice that opens a grid of emoji tiles with counts. No scrolling - every function is visible at once.
 */
export default function RedemittelCategoryPicker({ categories, value, onChange }: Readonly<Props>) {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const panelId = useId();

    useEffect(() => {
        if (!open) return;
        const onPointer = (e: MouseEvent) => {
            if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false);
                trigger.current?.focus();
            }
        };
        document.addEventListener("mousedown", onPointer);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onPointer);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    if (categories.length === 0) return null;

    const current = categories.find((c) => c.key === value);
    const currentLabel = current?.label ?? "Alle Funktionen";
    const options = [{ key: "ALL", label: "Alle Funktionen", count: categories.reduce((n, c) => n + c.count, 0) }, ...categories];

    const choose = (key: string) => {
        onChange(key);
        setOpen(false);
        trigger.current?.focus();
    };

    return (
        <div ref={root}>
            <button
                ref={trigger}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                aria-label={`Funktion wählen, aktuell: ${currentLabel}`}
                className={cn(
                    "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-95 cursor-pointer",
                    current ? "border-transparent bg-primary text-primary-foreground shadow-sm" : "border-border/60 bg-card text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",
                )}
            >
                <span className="text-sm leading-none" aria-hidden="true">{current ? categoryEmoji(current.key) : "✨"}</span>
                {currentLabel}
                <ChevronDown className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
            </button>

            {open && (
                <div
                    id={panelId}
                    role="group"
                    aria-label="Funktion"
                    className="anim-pop absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-border/60 bg-card p-3 shadow-2xl"
                >
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {options.map((c) => {
                            const active = value === c.key;
                            return (
                                <button
                                    key={c.key}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => choose(c.key)}
                                    className={cn(
                                        "group relative flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.97] cursor-pointer",
                                        active ? "border-primary/50 bg-primary/10" : "border-transparent bg-foreground/[0.03] hover:-translate-y-0.5 hover:bg-accent hover:shadow-sm",
                                    )}
                                >
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-lg shadow-sm transition-transform duration-150 group-hover:scale-110 group-hover:-rotate-6" aria-hidden="true">
                                        {c.key === "ALL" ? "✨" : categoryEmoji(c.key)}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-foreground">{c.label}</span>
                                        <span className="block text-xs text-foreground/50">{c.count} Redemittel</span>
                                    </span>
                                    {active && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
