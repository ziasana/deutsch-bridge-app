"use client";

import Link from "next/link";
import { Check, ChevronRight, Clock, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { LessonAccent, lessonThemeVars } from "../../lessonTheme";
import { LearnSectionMeta, Station } from "./types";
import { StationResult } from "./useLearnProgress";

interface ThemedLearnPathProps {
    accent: LessonAccent;
    stations: Station[];
    done: Partial<Record<string, StationResult>>;
    onOpen: (id: string) => void;
    onReset: () => void;
    sections: readonly LearnSectionMeta[];
    exerciseHref: string;
    exerciseLabel: string;
    allDoneHint: string;
    remainingHint: (remaining: number) => string;
}

/** Soft tile colour per station, cycled in learning order. */
const TILES = ["from-pink-500/25 to-pink-500/10", "from-amber-500/25 to-amber-500/10", "from-sky-500/25 to-sky-500/10", "from-violet-500/25 to-violet-500/10", "from-orange-500/25 to-orange-500/10", "from-emerald-500/25 to-emerald-500/10"];
const minutes = (steps: number) => Math.max(1, Math.round(steps * 0.6));

function Ring({ value, total }: Readonly<{ value: number; total: number }>) {
    const r = 40;
    const c = 2 * Math.PI * r;
    return (
        <div className="relative size-24 shrink-0 sm:size-28" role="img" aria-label={`${value} von ${total} Stationen geschafft`}>
            <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-white/25" />
                <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-white transition-all duration-700" strokeDasharray={c} strokeDashoffset={c * (1 - (total === 0 ? 0 : value / total))} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white" aria-hidden="true">
                <span className="text-2xl font-extrabold tabular-nums">{value}/{total}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">Stationen</span>
            </div>
        </div>
    );
}

/** Learning path of a Teil: progress hero with a clickable route, then the stations as colourful cards. */
export default function ThemedLearnPath({ accent, stations, done, onOpen, onReset, sections, exerciseHref, exerciseLabel, allDoneHint, remainingHint }: Readonly<ThemedLearnPathProps>) {
    const meta = (id: string) => sections.find((s) => s.id === id)!;
    const doneCount = stations.filter((s) => done[s.id]).length;
    const next = stations.find((s) => !done[s.id]);
    const allDone = doneCount === stations.length;

    return (
        <div className="space-y-6" style={lessonThemeVars(accent)}>
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) p-5 text-white shadow-md sm:p-6">
                <span aria-hidden="true" className="absolute -end-10 -top-12 size-44 rounded-full bg-white/10" />
                <span aria-hidden="true" className="absolute -bottom-14 start-1/3 size-36 rounded-full bg-white/10" />
                <div className="relative flex flex-wrap items-center gap-5">
                    <Ring value={doneCount} total={stations.length} />
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-extrabold">{allDone ? "Alles geschafft! 🎉" : doneCount === 0 ? "Los geht’s!" : "Weiter so!"}</h2>
                        <p className="mt-0.5 text-sm text-white/90">{allDone ? allDoneHint : remainingHint(stations.length - doneCount)}</p>
                        {allDone ? (
                            <Link href={exerciseHref} className="mt-3 inline-flex min-h-10 items-center rounded-full bg-white px-5 text-sm font-bold text-primary shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--lesson-from)">
                                {exerciseLabel}
                            </Link>
                        ) : (
                            next && (
                                <button type="button" onClick={() => onOpen(next.id)} className="mt-3 inline-flex min-h-10 cursor-pointer items-center rounded-full bg-white px-5 text-sm font-bold text-primary shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--lesson-from)">
                                    {doneCount === 0 ? "Starten" : "Weiterlernen"}: {meta(next.id).label} →
                                </button>
                            )
                        )}
                    </div>
                </div>
                {/* The whole route at a glance; every dot jumps to its station. */}
                <ol className="relative mt-5 flex items-center" aria-label="Route">
                    {stations.map((s, i) => {
                        const finished = !!done[s.id];
                        const isNext = next?.id === s.id;
                        return (
                            <li key={s.id} className="flex flex-1 items-center last:flex-none">
                                <button
                                    type="button"
                                    onClick={() => onOpen(s.id)}
                                    title={meta(s.id).label}
                                    aria-label={`Station ${i + 1}: ${meta(s.id).label}`}
                                    className={cn(
                                        "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 text-base transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                                        finished ? "border-white bg-white text-emerald-600" : isNext ? "animate-pulse border-white bg-white/30" : "border-white/40 bg-white/10",
                                    )}
                                >
                                    {finished ? <Check className="size-4" aria-hidden="true" /> : <span aria-hidden="true">{meta(s.id).emoji}</span>}
                                </button>
                                {i < stations.length - 1 && <span aria-hidden="true" className={cn("mx-1 h-0.5 flex-1 rounded", finished ? "bg-white" : "bg-white/30")} />}
                            </li>
                        );
                    })}
                </ol>
            </section>

            <ol className="grid gap-3 md:grid-cols-2">
                {stations.map((s, i) => {
                    const m = meta(s.id);
                    const result = done[s.id];
                    const isNext = next?.id === s.id;
                    return (
                        <li key={s.id} className="anim-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                            <button
                                type="button"
                                onClick={() => onOpen(s.id)}
                                className={cn(
                                    "group relative flex h-full w-full cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border-2 bg-card p-4 text-start shadow-card transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    isNext ? "border-primary/70" : result ? "border-emerald-500/40" : "border-transparent hover:border-primary/30",
                                )}
                            >
                                <span aria-hidden="true" className="pointer-events-none absolute -bottom-3 -end-1 text-7xl opacity-[0.07] transition group-hover:rotate-6 group-hover:opacity-15">{m.emoji}</span>
                                <span className={cn("relative flex size-14 shrink-0 items-center justify-center rounded-2xl text-2xl transition group-hover:scale-105", result ? "bg-emerald-500 text-white" : `bg-gradient-to-br ${TILES[i % TILES.length]}`)}>
                                    {result ? <Check className="size-7" aria-hidden="true" /> : <span aria-hidden="true">{m.emoji}</span>}
                                </span>
                                <span className="relative min-w-0 flex-1">
                                    {isNext && (
                                        <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) px-2.5 py-0.5 text-[11px] font-bold text-white">
                                            <Sparkles className="size-3" aria-hidden="true" /> Als Nächstes
                                        </span>
                                    )}
                                    <span className="block font-bold text-foreground">{i + 1}. {m.label}</span>
                                    <span className="block text-sm text-foreground/60">{m.hint}</span>
                                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-foreground/60">
                                            <Clock className="size-3" aria-hidden="true" /> {s.steps.length} Schritte · ca. {minutes(s.steps.length)} Min.
                                        </span>
                                        {result && result.total > 0 && (
                                            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">{result.correct}/{result.total} richtig</span>
                                        )}
                                    </span>
                                </span>
                                <ChevronRight className="relative size-5 shrink-0 text-foreground/30 transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                            </button>
                        </li>
                    );
                })}
            </ol>

            {doneCount > 0 && (
                <button type="button" onClick={onReset} className="mx-auto flex cursor-pointer items-center gap-1.5 text-xs text-foreground/45 transition hover:text-foreground">
                    <RotateCcw className="size-3.5" aria-hidden="true" /> Fortschritt zurücksetzen
                </button>
            )}
        </div>
    );
}
