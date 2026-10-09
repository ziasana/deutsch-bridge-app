"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check, Mic, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { WRITING_LEVELS } from "../writing/writingMeta";
import { learnHref, SPEAKING_PARTS } from "./speakingMeta";

export interface SpeakingHubPart {
    part: number;
    /** Finished / total stations of the learning path; null while the Lernbereich is unavailable. */
    path: { done: number; total: number } | null;
    exercisesTotal: number;
    exercisesDone: number;
}

interface SpeakingHubViewProps {
    level: string;
    onLevelChange: (level: string) => void;
    parts: SpeakingHubPart[];
}

const TEIL_EMOJI: Record<number, string> = { 1: "👋", 2: "💭", 3: "🤝" };

type PartState = "NEW" | "RUNNING" | "DONE";
const STATE_CHIP: Record<PartState, { label: string; className: string }> = {
    NEW: { label: "Neu", className: "bg-accent text-foreground/60" },
    RUNNING: { label: "Unterwegs", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
    DONE: { label: "Geschafft ✓", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
};

function stateOf(p: SpeakingHubPart): PartState {
    const learned = !p.path || p.path.total === 0 || p.path.done >= p.path.total;
    const practised = p.exercisesTotal === 0 || p.exercisesDone >= p.exercisesTotal;
    if (learned && practised && (p.path?.total ?? 0) + p.exercisesTotal > 0) return "DONE";
    return (p.path?.done ?? 0) + p.exercisesDone > 0 ? "RUNNING" : "NEW";
}

function Meter({ label, done, total, tone }: Readonly<{ label: string; done: number; total: number; tone: string }>) {
    return (
        <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="font-semibold text-foreground/70">{label}</span>
                <span className="tabular-nums text-foreground/50">{done}/{total}</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
                <div className={cn("h-full rounded-full transition-all duration-700", tone)} style={{ width: `${total === 0 ? 0 : (done / total) * 100}%` }} />
            </div>
        </div>
    );
}

function Ring({ done, total }: Readonly<{ done: number; total: number }>) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    return (
        <div className="relative size-24 shrink-0 sm:size-28" role="img" aria-label={`Gesamtfortschritt: ${done} von ${total}`}>
            <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" className="stroke-white/25" />
                <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" strokeLinecap="round" className="stroke-white transition-all duration-700" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - (total === 0 ? 0 : done / total))} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white" aria-hidden="true">
                <span className="text-2xl font-extrabold tabular-nums">{done}/{total}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">Schritte</span>
            </div>
        </div>
    );
}

/**
 * Landing page of Mündlicher Ausdruck: a hero with the overall progress, a level switch and the three Teile as a learning journey
 * (numbered path, a learn and a practice meter per Teil, and a highlighted "next step").
 */
export default function SpeakingHubView({ level, onLevelChange, parts }: Readonly<SpeakingHubViewProps>) {
    const stepsDone = parts.reduce((sum, p) => sum + (p.path?.done ?? 0) + p.exercisesDone, 0);
    const stepsTotal = parts.reduce((sum, p) => sum + (p.path?.total ?? 0) + p.exercisesTotal, 0);
    const nextPart = parts.find((p) => stateOf(p) !== "DONE")?.part ?? null;

    return (
        <div className="space-y-6">
            <Link href="/dashboard/exam-prep" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition hover:text-foreground">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Prüfungsvorbereitung
            </Link>

            <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 p-5 text-white shadow-md sm:p-7">
                <span aria-hidden="true" className="absolute -end-10 -top-12 size-48 rounded-full bg-white/10" />
                <span aria-hidden="true" className="absolute -bottom-16 start-1/3 size-40 rounded-full bg-white/10" />
                <div className="relative flex flex-wrap items-center justify-between gap-5">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur sm:size-16">
                            <Mic className="size-7 sm:size-8" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-extrabold sm:text-3xl">Mündlicher Ausdruck</h1>
                            <span className="mt-1 inline-flex rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-bold">{level}</span>
                            <p className="mt-2 text-sm text-white/90">Erst lernen, dann üben: Jeder Teil hat einen Lernbereich mit Redemitteln und Tipps.</p>
                        </div>
                    </div>
                    {stepsTotal > 0 && <Ring done={stepsDone} total={stepsTotal} />}
                </div>
            </header>

            <div role="group" aria-label="Niveau" className="flex flex-wrap items-center gap-2">
                {WRITING_LEVELS.map((l) => (
                    <button
                        key={l}
                        type="button"
                        aria-pressed={l === level}
                        onClick={() => onLevelChange(l)}
                        className={cn(
                            "cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50",
                            l === level ? "border-transparent bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-sm" : "border-border bg-card text-foreground/70 hover:border-pink-500/40 hover:bg-pink-500/5",
                        )}
                    >
                        {l}
                    </button>
                ))}
            </div>

            <ol className="relative space-y-5">
                <span aria-hidden="true" className="absolute bottom-8 start-6 top-8 hidden w-0.5 bg-gradient-to-b from-pink-500/40 via-orange-400/40 to-transparent sm:block" />
                {SPEAKING_PARTS.map((meta, index) => {
                    const p = parts.find((x) => x.part === meta.part) ?? { part: meta.part, path: null, exercisesTotal: 0, exercisesDone: 0 };
                    const state = stateOf(p);
                    const isNext = p.part === nextPart;
                    const learning = p.path && p.path.done > 0 && p.path.done < p.path.total ? "Weiterlernen" : p.path && p.path.total > 0 && p.path.done >= p.path.total ? "Nochmal lernen" : "Lernen";
                    return (
                        <li key={meta.part} className="anim-fade-up relative sm:ps-16" style={{ animationDelay: `${index * 80}ms` }}>
                            <span
                                aria-hidden="true"
                                className={cn(
                                    "absolute start-0 top-5 hidden size-12 items-center justify-center rounded-full text-lg font-extrabold shadow-md ring-4 ring-background sm:flex",
                                    state === "DONE" ? "bg-emerald-500 text-white" : "bg-gradient-to-br from-pink-500 to-orange-400 text-white",
                                )}
                            >
                                {state === "DONE" ? <Check className="size-6" /> : meta.part}
                            </span>
                            <div
                                className={cn(
                                    "group relative overflow-hidden rounded-2xl bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-md sm:p-6",
                                    isNext ? "ring-2 ring-pink-500/50" : "ring-1 ring-border/60",
                                )}
                            >
                                <span aria-hidden="true" className="pointer-events-none absolute -bottom-4 -end-2 text-8xl opacity-10 transition group-hover:rotate-6 group-hover:opacity-20">{TEIL_EMOJI[meta.part]}</span>
                                <div className="relative flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-pink-500/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-pink-700 dark:text-pink-300">Teil {meta.part}</span>
                                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATE_CHIP[state].className)}>{STATE_CHIP[state].label}</span>
                                    {isNext && state !== "NEW" && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 px-2.5 py-0.5 text-xs font-bold text-white">
                                            <Sparkles className="size-3" aria-hidden="true" /> Hier weiter
                                        </span>
                                    )}
                                </div>
                                <h2 className="relative mt-2 text-xl font-bold text-foreground">{meta.title}</h2>
                                <p className="relative mt-0.5 text-sm text-foreground/65">{meta.description}</p>

                                <div className="relative mt-4 grid gap-4 sm:grid-cols-2">
                                    {p.path && p.path.total > 0 ? (
                                        <Meter label="📖 Lernen" done={p.path.done} total={p.path.total} tone="bg-gradient-to-r from-pink-500 to-rose-400" />
                                    ) : (
                                        <p className="self-end text-xs text-foreground/40">Lernbereich folgt</p>
                                    )}
                                    {p.exercisesTotal > 0 ? (
                                        <Meter label="🎤 Üben" done={p.exercisesDone} total={p.exercisesTotal} tone="bg-gradient-to-r from-orange-400 to-amber-400" />
                                    ) : (
                                        <p className="self-end text-xs text-foreground/40">Noch keine Übungen</p>
                                    )}
                                </div>

                                <div className="relative mt-5 flex flex-wrap gap-2">
                                    <Link
                                        href={learnHref(level, meta.part)}
                                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 focus-visible:ring-offset-2"
                                    >
                                        <BookOpen className="size-4" aria-hidden="true" />
                                        {learning}
                                    </Link>
                                    {p.exercisesTotal > 0 ? (
                                        <Link
                                            href={`/dashboard/exam-prep/teil?section=MUENDLICHER_AUSDRUCK&level=${encodeURIComponent(level)}&part=${meta.part}`}
                                            className="group/btn inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-pink-500/40 hover:bg-pink-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50"
                                        >
                                            Übungen <span className="text-foreground/50">({p.exercisesTotal})</span>
                                            <ArrowRight className="size-4 transition group-hover/btn:translate-x-0.5" aria-hidden="true" />
                                        </Link>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full border border-dashed border-border px-5 py-2.5 text-sm text-foreground/40">Übungen folgen</span>
                                    )}
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
