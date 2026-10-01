"use client";

import { ReactNode, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepApi } from "../types";
import { haptic } from "../reactions";

interface TapChecklistProps {
    api: StepApi;
    prompt: ReactNode;
    items: string[];
    /** When true, the step only completes after every item is ticked. */
    requireAll?: boolean;
}

/** Tap each item to confirm "got it" - turns a passive list into a small interaction with a visible result. */
export default function TapChecklist({ api, prompt, items, requireAll = true }: TapChecklistProps) {
    const [ticked, setTicked] = useState<Set<number>>(new Set());
    const allDone = api.solved || ticked.size === items.length;

    const toggle = (i: number) => {
        const next = new Set(ticked);
        if (!next.delete(i)) next.add(i);
        setTicked(next);
        haptic(8);
        if (requireAll && next.size === items.length) api.complete();
        if (!requireAll) api.complete();
    };

    return (
        <div className="space-y-4">
            <p className="text-lg font-semibold text-foreground">{prompt}</p>
            <ul className="grid gap-2">
                {items.map((item, i) => {
                    const on = api.solved || ticked.has(i);
                    return (
                        <li key={item}>
                            <button
                                type="button"
                                aria-pressed={on}
                                onClick={() => toggle(i)}
                                className={cn(
                                    "flex min-h-12 w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition cursor-pointer",
                                    on ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-card hover:border-primary/50",
                                )}
                            >
                                <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border-2", on ? "anim-pop border-emerald-500 bg-emerald-500 text-white" : "border-foreground/25")}>
                                    {on && <Check className="size-4" />}
                                </span>
                                <span className={on ? "text-foreground" : "text-foreground/80"}>{item}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
            <p className="text-xs text-foreground/50" aria-live="polite">
                {allDone ? "Alles abgehakt – super! 🎉" : `${ticked.size} von ${items.length} abgehakt`}
            </p>
        </div>
    );
}
