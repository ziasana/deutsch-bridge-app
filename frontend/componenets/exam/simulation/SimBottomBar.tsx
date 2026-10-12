"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
    answered: number;
    total: number;
    /** Neighbouring parts of the section; null when there is none (first / last part). */
    prevLabel: string | null;
    nextLabel: string | null;
    onPrev: () => void;
    onNext: () => void;
    /** Shown instead of "next" on the last part: end the section or hand in the exam. */
    finish?: React.ReactNode;
}

/** Sticky bottom bar of the running exam: how much of the section is answered, and the way on to the next part. */
export default function SimBottomBar({ answered, total, prevLabel, nextLabel, onPrev, onNext, finish }: Readonly<Props>) {
    const pct = total > 0 ? (answered / total) * 100 : 0;
    return (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/95 px-4 py-2.5 backdrop-blur sm:px-6">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2">
                <div className="flex min-w-40 flex-1 items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-label="Beantwortete Fragen" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered}>
                        <div className="h-full rounded-full bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="whitespace-nowrap text-xs font-bold tabular-nums text-foreground/70">{answered}/{total} beantwortet</span>
                </div>
                <div className="flex items-center gap-2">
                    {prevLabel && (
                        <button type="button" onClick={onPrev} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent">
                            <ArrowLeft className="size-4" aria-hidden /> <span className="hidden sm:inline">{prevLabel}</span>
                            <span className="sm:hidden">Zurück</span>
                        </button>
                    )}
                    {nextLabel ? (
                        <button type="button" onClick={onNext} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
                            <span className="hidden sm:inline">{nextLabel}</span>
                            <span className="sm:hidden">Weiter</span> <ArrowRight className="size-4" aria-hidden />
                        </button>
                    ) : (
                        finish
                    )}
                </div>
            </div>
        </div>
    );
}
