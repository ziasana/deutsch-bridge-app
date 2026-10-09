"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface PracticeHeaderProps {
    exitHref: string;
    exitLabel: string;
    counter: string;
    /** 0-100, how far through the whole session the learner is. */
    percent: number;
    /** Optional chips on the right (level, step, word type ...). */
    meta?: ReactNode;
}

/** Top bar of a practice session: exit, "x of y", extra chips and one session-wide progress bar. */
export default function PracticeHeader({ exitHref, exitLabel, counter, percent, meta }: Readonly<PracticeHeaderProps>) {
    const router = useRouter();
    // Leaves to where the learner came from (the list with its filters, or the word); a fresh tab goes to exitHref.
    const exit = () => {
        if (window.history.length > 1) router.back();
        else router.push(exitHref);
    };
    return (
        <header>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={exit}
                    aria-label={exitLabel}
                    title={exitLabel}
                    className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-card text-foreground/60 shadow-sm ring-1 ring-border/60 transition hover:text-foreground hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <X className="size-4" aria-hidden="true" />
                </button>
                <div
                    role="progressbar"
                    aria-valuenow={Math.round(percent)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/10"
                >
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500" style={{ width: `${Math.max(4, percent)}%` }} />
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold tabular-nums text-primary" aria-live="polite">
                    {counter}
                </span>
            </div>
            {meta && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{meta}</div>}
        </header>
    );
}
