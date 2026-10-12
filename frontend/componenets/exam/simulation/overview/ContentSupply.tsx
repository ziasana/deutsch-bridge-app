"use client";

import { useState } from "react";
import { ChevronDown, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileOverview } from "@/types/examSimulation";
import { SECTION_STYLE } from "./sectionStyle";

/** How many tasks are still unused for the learner per part. Collapsed by default: it only matters when stock runs low. */
export default function ContentSupply({ profile }: Readonly<{ profile: ProfileOverview }>) {
    const low = profile.parts.filter((p) => p.unused < p.required);
    const [open, setOpen] = useState(low.length > 0);
    return (
        <section aria-label="Verfügbare Aufgaben" className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full cursor-pointer items-center justify-between gap-3 text-start">
                <span className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Layers className="size-5" aria-hidden /></span>
                    <span>
                        <span className="block text-lg font-bold text-foreground">Neue Aufgaben für dich</span>
                        <span className="block text-sm text-foreground/60">Jede Aufgabe bekommst du nur einmal. {low.length > 0 ? `Knapp: ${low.length} Teil(e).` : "Genug für die nächste Prüfung."}</span>
                    </span>
                </span>
                <ChevronDown className={cn("size-5 shrink-0 text-foreground/50 transition", open && "rotate-180")} aria-hidden />
            </button>
            {open && (
                <ul className="anim-fade-up mt-4 grid gap-x-8 gap-y-3 p-0 sm:grid-cols-2">
                    {profile.parts.map((p) => {
                        const st = SECTION_STYLE[p.section];
                        const pct = p.eligible > 0 ? Math.min(100, (p.unused / p.eligible) * 100) : 0;
                        const short = p.unused < p.required;
                        return (
                            <li key={p.key} className="list-none">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="truncate font-medium text-foreground/80">{p.label}</span>
                                    <span className={cn("font-bold tabular-nums", short ? "text-red-600 dark:text-red-400" : p.unused <= 1 ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>{p.unused} von {p.eligible}</span>
                                </div>
                                <div className="mt-1 h-2 overflow-hidden rounded-full bg-foreground/10">
                                    <div className={cn("h-full rounded-full transition-all duration-500", short ? "bg-red-500" : st.solid)} style={{ width: `${pct}%` }} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
