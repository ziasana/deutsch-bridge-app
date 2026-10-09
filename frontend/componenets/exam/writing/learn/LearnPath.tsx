"use client";

import Link from "next/link";
import { Check, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEARN_SECTIONS } from "../writingMeta";
import { LearnSectionMeta, Station } from "./types";
import { StationResult } from "./useLearnProgress";

/** Wording and targets that differ between learning paths. Defaults are Schreiben's. */
export interface LearnPathTexts {
    /** Where "all done" leads, with its label. */
    exerciseHref: string;
    exerciseLabel: string;
    allDoneHint: string;
    remainingHint: (remaining: number) => string;
}

interface LearnPathProps {
    level: string;
    stations: Station[];
    done: Partial<Record<string, StationResult>>;
    onOpen: (id: string) => void;
    onReset: () => void;
    sections?: readonly LearnSectionMeta[];
    texts?: LearnPathTexts;
}
/** Rough reading/practice time so the learner knows what they sign up for. */
const minutes = (steps: number) => Math.max(1, Math.round(steps * 0.6));

function ProgressRing({ value, total }: { value: number; total: number }) {
    const r = 28;
    const c = 2 * Math.PI * r;
    return (
        <div className="relative size-20 shrink-0" role="img" aria-label={`${value} von ${total} Stationen geschafft`}>
            <svg viewBox="0 0 64 64" className="size-full -rotate-90">
                <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-foreground/10" />
                <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-primary transition-all duration-700" strokeDasharray={c} strokeDashoffset={c * (1 - value / total)} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                {value}/{total}
            </span>
        </div>
    );
}

/** The learning path: stations in the recommended order, with progress, a clear "next" and no walls of text. */
export default function LearnPath({ level, stations, done, onOpen, onReset, sections = LEARN_SECTIONS, texts }: LearnPathProps) {
    const meta = (id: string) => sections.find((s) => s.id === id)!;
    const t: LearnPathTexts = texts ?? {
        exerciseHref: `/dashboard/exam-prep?section=SCHRIFTLICHER_AUSDRUCK&level=${encodeURIComponent(level)}`,
        exerciseLabel: "Zu den Schreibaufgaben →",
        allDoneHint: "Du kennst jetzt die Methode. Wende sie in den Schreibaufgaben an.",
        remainingHint: (n) => `Noch ${n} ${n === 1 ? "Station" : "Stationen"} bis zum Schreib-Profi.`,
    };
    const doneCount = stations.filter((s) => done[s.id]).length;
    const next = stations.find((s) => !done[s.id]);
    const allDone = doneCount === stations.length;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 rounded-[10px] bg-card p-5 shadow-card">
                <ProgressRing value={doneCount} total={stations.length} />
                <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-foreground">{allDone ? "Alles geschafft! 🎉" : doneCount === 0 ? "Los geht’s!" : "Weiter so!"}</h2>
                    <p className="mt-0.5 text-sm text-foreground/60">
                        {allDone ? t.allDoneHint : t.remainingHint(stations.length - doneCount)}
                    </p>
                    {allDone ? (
                        <Link href={t.exerciseHref} className="mt-3 inline-flex min-h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                            {t.exerciseLabel}
                        </Link>
                    ) : (
                        next && (
                            <button type="button" onClick={() => onOpen(next.id)} className="mt-3 inline-flex min-h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 cursor-pointer">
                                {doneCount === 0 ? "Starten" : "Weiterlernen"}: {meta(next.id).label} →
                            </button>
                        )
                    )}
                </div>
            </div>

            <ol className="relative grid gap-3 md:grid-cols-2">
                <span aria-hidden className="absolute bottom-6 left-[1.65rem] top-6 w-0.5 bg-foreground/10 md:hidden" />
                {stations.map((s, i) => {
                    const m = meta(s.id);
                    const result = done[s.id];
                    const isNext = next?.id === s.id;
                    return (
                        <li key={s.id} className="relative">
                            <button
                                type="button"
                                onClick={() => onOpen(s.id)}
                                className={cn(
                                    "flex w-full items-center gap-4 rounded-2xl border-2 bg-card p-3 pr-4 text-left transition cursor-pointer hover:-translate-y-0.5 hover:shadow-card",
                                    isNext ? "border-primary shadow-card" : result ? "border-emerald-500/40" : "border-border/60",
                                )}
                            >
                                <span className={cn("relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full text-xl", result ? "bg-emerald-500 text-white" : isNext ? "bg-primary/15" : "bg-accent")}>
                                    {result ? <Check className="size-6" /> : <span aria-hidden>{m.emoji}</span>}
                                </span>
                                <span className="min-w-0 flex-1">
                                    {isNext && <span className="mb-0.5 inline-block rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">Als Nächstes</span>}
                                    <span className="block font-semibold text-foreground">
                                        {i + 1}. {m.label}
                                    </span>
                                    <span className="block text-sm text-foreground/55">{m.hint}</span>
                                    <span className="mt-0.5 block text-xs text-foreground/45">
                                        {s.steps.length} Schritte · ca. {minutes(s.steps.length)} Min.
                                        {result && result.total > 0 && ` · ${result.correct}/${result.total} richtig`}
                                    </span>
                                </span>
                                <ChevronRight className="size-5 shrink-0 text-foreground/30" />
                            </button>
                        </li>
                    );
                })}
            </ol>

            {doneCount > 0 && (
                <button type="button" onClick={onReset} className="mx-auto flex items-center gap-1.5 text-xs text-foreground/45 hover:text-foreground cursor-pointer">
                    <RotateCcw className="size-3.5" /> Fortschritt zurücksetzen
                </button>
            )}
        </div>
    );
}
