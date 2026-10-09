"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LessonAccent } from "../../lessonTheme";
import { LessonStep } from "./types";

export interface LessonResult {
    correct: number;
    total: number;
}

interface LessonShellProps {
    emoji: string;
    title: string;
    steps: LessonStep[];
    onExit: () => void;
    onFinish: (result: LessonResult) => void;
    /** Visual theme: the default (blue) or the pink/orange one of Mündlicher Ausdruck. */
    accent?: LessonAccent;
}

/** Keeps the "already solved" flag as it was when the step opened, so a step does not flip into its solved look mid-interaction. */
function StepHost({ step, solved, onComplete }: { step: LessonStep; solved: boolean; onComplete: (correct?: boolean) => void }) {
    const [initiallySolved] = useState(solved);
    return <>{step.render({ solved: initiallySolved, complete: onComplete })}</>;
}

function milestone(index: number, total: number): string | null {
    if (total < 4) return null;
    if (index === Math.floor(total / 2)) return "Halbzeit! 🚀";
    if (index === total - 1) return "Letzter Schritt! 🏁";
    return null;
}

/**
 * One lesson: a sequence of small steps shown one at a time, with a progress bar and a footer that
 * stays visible, so there is nothing to scroll past on a phone. Gated steps (quizzes/games) must be
 * completed before "Weiter" unlocks.
 */
export default function LessonShell({ emoji, title, steps, onExit, onFinish, accent }: LessonShellProps) {
    const speaking = !!accent;
    const [index, setIndex] = useState(0);
    const [done, setDone] = useState<Record<string, boolean>>({});
    const [results, setResults] = useState<Record<string, boolean>>({});
    const [banner, setBanner] = useState<string | null>(null);
    const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const step = steps[index];
    const isLast = index === steps.length - 1;
    const canContinue = !step.gated || !!done[step.id];

    const complete = useCallback(
        (stepId: string) => (correct?: boolean) => {
            setDone((d) => (d[stepId] ? d : { ...d, [stepId]: true }));
            if (correct !== undefined) setResults((r) => (stepId in r ? r : { ...r, [stepId]: correct }));
        },
        [],
    );

    const showBanner = (text: string) => {
        setBanner(text);
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        bannerTimer.current = setTimeout(() => setBanner(null), 1800);
    };

    useEffect(() => () => {
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
    }, []);

    const next = useCallback(() => {
        if (!canContinue) return;
        if (isLast) {
            const values = Object.values(results);
            onFinish({ correct: values.filter(Boolean).length, total: values.length });
            return;
        }
        const target = index + 1;
        const msg = milestone(target, steps.length);
        if (msg) showBanner(msg);
        setIndex(target);
    }, [canContinue, isLast, results, index, steps.length, onFinish]);

    const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement | null)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") back();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [next, back]);

    const progress = ((index + (done[step.id] || !step.gated ? 1 : 0)) / steps.length) * 100;

    return (
        <div className="group/lesson flex min-h-[calc(100dvh-9rem)] flex-col" data-accent={accent}>
            <header className="space-y-3">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={onExit} aria-label="Lektion verlassen" className="rounded-full p-2 text-foreground/55 transition hover:bg-accent hover:text-foreground cursor-pointer">
                        <X className="size-5" />
                    </button>
                    <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={steps.length}
                        aria-valuenow={index + 1}
                        aria-label={`Schritt ${index + 1} von ${steps.length}`}
                        className="h-3 flex-1 overflow-hidden rounded-full bg-foreground/10"
                    >
                        <div className={cn("h-full rounded-full transition-all duration-500", speaking ? "bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) shadow-[0_0_10px_color-mix(in_srgb,var(--lesson-from)_50%,transparent)]" : "bg-primary")} style={{ width: `${progress}%` }} />
                    </div>
                    <span className={cn("text-right text-xs font-medium tabular-nums text-foreground/55", speaking ? "rounded-full bg-card px-2.5 py-1 font-bold shadow-sm" : "w-12")}>
                        {index + 1}/{steps.length}
                    </span>
                </div>
                <div className="flex h-7 items-center justify-center">
                    {banner ? (
                        <p role="status" className={cn("anim-pop rounded-full px-4 py-1 text-sm font-semibold text-primary-foreground", speaking ? "bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) shadow-md" : "bg-primary")}>
                            {banner}
                        </p>
                    ) : (
                        <p className={cn("flex items-center gap-1.5 text-xs font-medium text-foreground/50", speaking && "rounded-full bg-primary/10 px-3 py-1 font-bold text-primary")}>
                            <span aria-hidden>{emoji}</span>
                            {title}
                        </p>
                    )}
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-2xl flex-1 items-start py-6">
                <div key={step.id} className="anim-slide-in w-full">
                    <StepHost step={step} solved={!!done[step.id]} onComplete={complete(step.id)} />
                </div>
            </main>

            <footer className={cn("sticky bottom-0 border-t border-border/60 bg-background/95 py-3 backdrop-blur", speaking ? "-mx-4 px-4 sm:-mx-6 sm:px-6" : "-mx-6 px-6")}>
                <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
                    <button
                        type="button"
                        onClick={back}
                        disabled={index === 0}
                        className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-border px-5 text-sm font-medium transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
                    >
                        <ArrowLeft className="size-4" /> Zurück
                    </button>
                    <button
                        type="button"
                        onClick={next}
                        disabled={!canContinue}
                        className={cn(
                            "inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-full px-6 text-sm font-semibold transition cursor-pointer",
                            canContinue
                                ? speaking
                                    ? "bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) text-white shadow-md hover:brightness-105 hover:shadow-lg"
                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "cursor-not-allowed bg-foreground/10 text-foreground/40",
                        )}
                    >
                        {isLast ? "Abschließen" : "Weiter"} <ArrowRight className="size-4" />
                    </button>
                </div>
                {!canContinue && <p className="mt-1.5 text-center text-xs text-foreground/45">Löse die Aufgabe, um weiterzumachen.</p>}
            </footer>
        </div>
    );
}
