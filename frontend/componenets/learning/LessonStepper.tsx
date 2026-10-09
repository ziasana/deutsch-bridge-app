"use client";

import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepInfo {
    id: string;
    label: string;
    done: boolean;
}

/**
 * Sticky step tracker ("Lesen → Wortschatz → Quiz", "Erklärung → Beispiel → Übung"): shows where the learner is in a
 * lesson, ticks a step off once it is done, jumps to a step when clicked (the step's element id) and fills a thin bar
 * with how far the lesson has been read.
 */
export default function LessonStepper({ steps, progress, label }: Readonly<{ steps: StepInfo[]; progress: number; label: string }>) {
    return (
        <nav aria-label={label} className="sticky top-2 z-20 overflow-hidden rounded-2xl bg-card/95 shadow-card ring-1 ring-border/60 backdrop-blur">
            <ol className="flex items-center gap-1 p-2">
                {steps.map((step, i) => (
                    <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1">
                        <button
                            type="button"
                            onClick={() => document.getElementById(step.id)?.scrollIntoView?.({ block: "start", behavior: "smooth" })}
                            className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                            <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold", step.done ? "bg-green-500 text-white" : "bg-primary/10 text-primary")}>
                                {step.done ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : i + 1}
                            </span>
                            <span className={cn("truncate", step.done ? "text-foreground" : "text-foreground/70")}>{step.label}</span>
                        </button>
                        {i < steps.length - 1 && <ChevronRight className="size-4 shrink-0 text-foreground/25 rtl:rotate-180" aria-hidden="true" />}
                    </li>
                ))}
            </ol>
            <div className="h-1 bg-foreground/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
            </div>
        </nav>
    );
}
