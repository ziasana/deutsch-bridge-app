"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BarChart3, CheckCircle2, ChevronDown, Clock, Hourglass, Pause, Play, RotateCw, Sparkles, Target, Trophy } from "lucide-react";
import SimResultBadge from "@/componenets/exam/simulation/SimResultBadge";
import { formatDateTime, formatDuration, formatPoints } from "@/lib/examSimulation";
import { enterFullscreen } from "@/lib/fullscreen";
import { cn } from "@/lib/utils";
import type { AttemptSummary, ProfileOverview, ProgressPoint, SetOverview } from "@/types/examSimulation";
import SimProgressChart from "@/componenets/exam/simulation/SimProgressChart";
import { ScoreRing } from "./ScoreRing";
import { SECTION_STYLE } from "./sectionStyle";

const resultHref = (attemptId: string) => `/dashboard/exam-prep/pruefung/ergebnis?attempt=${encodeURIComponent(attemptId)}`;
const runHref = (attemptId: string) => `/dashboard/exam-prep/pruefung/durchfuehrung?attempt=${encodeURIComponent(attemptId)}`;

const CARD = "relative flex flex-col gap-4 overflow-hidden rounded-3xl border bg-card p-4 shadow-sm transition sm:flex-row sm:items-center sm:gap-5 sm:p-5";

/** Title block at the start of a row: fixed width on wide screens so the columns line up across rows. */
const HEAD = "flex items-center gap-3 sm:w-56 sm:shrink-0";

/** The numbered tile every card starts with; its colour tells the state at a glance. */
function NumberTile({ number, tone }: Readonly<{ number: number; tone: string }>) {
    return <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold tabular-nums text-white shadow-sm", tone)}>{number}</span>;
}

/** One dot per section of the exam, in the same colours as the journey below, so a new exam shows what it contains. */
function SectionDots({ profile }: Readonly<{ profile: ProfileOverview }>) {
    const sections = Array.from(new Set(profile.parts.map((p) => p.section)));
    return (
        <span className="flex items-center gap-1" aria-hidden>
            {sections.map((s) => (
                <span key={s} className={cn("size-2.5 rounded-full", SECTION_STYLE[s]?.solid ?? "bg-primary")} />
            ))}
        </span>
    );
}

function DoneCard({ set, profile }: Readonly<{ set: SetOverview; profile: ProfileOverview }>) {
    const a = set.attempt;
    if (!a) return null;
    return (
        <Link href={resultHref(a.id)} className={cn(CARD, "group border-border/70 hover:border-primary/50 hover:shadow-md")}>
            <div className={HEAD}>
                <NumberTile number={set.number} tone="bg-gradient-to-br from-green-500 to-teal-500" />
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-foreground">{set.title}</h3>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                        <CheckCircle2 className="size-3.5" aria-hidden /> Erledigt
                    </p>
                </div>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-4">
                <ScoreRing score={a.writtenScore} max={a.writtenMax} threshold={profile.writtenPassThreshold} complete={a.writtenComplete} />
                <div className="min-w-0 space-y-1.5">
                    <SimResultBadge status={a.overallResult ?? a.writtenResult} />
                    {a.awaitingAssessment && (
                        <p className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                            <Hourglass className="size-3.5" aria-hidden /> Bewertung steht aus
                        </p>
                    )}
                    <p className="flex flex-wrap items-center gap-x-3 text-xs text-foreground/60">
                        <span>{formatDateTime(a.endedAtMs ?? a.startedAtMs)}</span>
                        {a.durationSeconds != null && (
                            <span className="inline-flex items-center gap-1"><Clock className="size-3" aria-hidden /> {formatDuration(a.durationSeconds)}</span>
                        )}
                    </p>
                </div>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary sm:shrink-0">
                Ergebnis ansehen <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
        </Link>
    );
}

function RunningCard({ set, paused }: Readonly<{ set: SetOverview; paused: boolean }>) {
    return (
        <article className={cn(CARD, "border-amber-500/50 bg-amber-500/5")}>
            <div className={HEAD}>
                <NumberTile number={set.number} tone="bg-gradient-to-br from-amber-500 to-orange-500" />
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-foreground">{set.title}</h3>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                        {paused ? <Pause className="size-3.5" aria-hidden /> : <Clock className="size-3.5" aria-hidden />}
                        {paused ? "Pausiert – die Zeit steht" : "Läuft gerade"}
                    </p>
                </div>
            </div>
            <p className="flex-1 text-sm text-foreground/70">Du hast diese Prüfung begonnen. Mach genau dort weiter, wo du aufgehört hast.</p>
            {set.attemptId && (
                <Link onClick={enterFullscreen} href={runHref(set.attemptId)} className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:shrink-0">
                    <RotateCw className="size-4" aria-hidden /> {paused ? "Pause beenden" : "Fortsetzen"}
                </Link>
            )}
        </article>
    );
}

function NewCard({ set, profile, disabled, starting, onStart }: Readonly<{ set: SetOverview; profile: ProfileOverview; disabled: boolean; starting: boolean; onStart: (setId: string) => void }>) {
    return (
        <article className={cn(CARD, "border-primary/30 hover:border-primary/60 hover:shadow-md")}>
            <span aria-hidden className="absolute -end-8 -top-10 size-32 rounded-full bg-primary/10" />
            <div className={cn(HEAD, "relative")}>
                <NumberTile number={set.number} tone="bg-gradient-to-br from-primary to-primary/60" />
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-foreground">{set.title}</h3>
                    <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                        <Sparkles className="size-3.5" aria-hidden /> Neu für dich
                    </p>
                </div>
            </div>
            <div className="relative flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground/60">
                <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden /> {profile.totalMinutes} Min.</span>
                <SectionDots profile={profile} />
            </div>
            <button type="button" disabled={disabled || starting} onClick={() => onStart(set.id)} className="relative inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:shrink-0">
                <Play className="size-4" aria-hidden /> Prüfung starten
            </button>
        </article>
    );
}

function StatTile({ icon: Icon, tone, label, value, hint }: Readonly<{ icon: typeof Trophy; tone: string; label: string; value: string; hint?: string }>) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4">
            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tone)}><Icon className="size-5" aria-hidden /></span>
            <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-foreground/50">{label}</p>
                <p className="text-xl font-extrabold tabular-nums text-foreground">{value}</p>
                {hint && <p className="truncate text-xs text-foreground/60">{hint}</p>}
            </div>
        </div>
    );
}

/** Numbers and development over the finished exams of the list below. Only exams with a final written score count. */
function Analytics({ profile, done }: Readonly<{ profile: ProfileOverview; done: SetOverview[] }>) {
    const [showChart, setShowChart] = useState(false);
    const scored = done.filter((s) => s.attempt?.writtenComplete && s.attempt.writtenScore != null);
    const best = scored.reduce<SetOverview | null>((top, s) => (!top || (s.attempt!.writtenScore as number) > (top.attempt!.writtenScore as number) ? s : top), null);
    const average = scored.length > 0 ? scored.reduce((n, s) => n + (s.attempt!.writtenScore as number), 0) / scored.length : null;
    const passed = scored.filter((s) => s.attempt!.writtenResult === "PASSED").length;
    const points: ProgressPoint[] = scored
        .map((s) => s.attempt as AttemptSummary)
        .sort((a, b) => (a.endedAtMs ?? a.startedAtMs) - (b.endedAtMs ?? b.startedAtMs))
        .map((a) => ({ attemptId: a.id, endedAtMs: a.endedAtMs ?? a.startedAtMs, writtenScore: a.writtenScore, writtenPercentage: a.writtenPercentage, writtenComplete: a.writtenComplete }));
    const max = profile.writtenMaxPoints;

    return (
        <div className="mt-5 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
                <StatTile icon={Trophy} tone="bg-amber-500/15 text-amber-600" label="Bestes Ergebnis" value={best ? `${formatPoints(best.attempt!.writtenScore)} / ${formatPoints(max)}` : "–"} hint={best?.title} />
                <StatTile icon={Target} tone="bg-primary/10 text-primary" label="Durchschnitt" value={average != null ? `${formatPoints(Math.round(average * 10) / 10)} / ${formatPoints(max)}` : "–"} hint={`Bestehen ab ${formatPoints(profile.writtenPassThreshold)} P.`} />
                <StatTile icon={CheckCircle2} tone="bg-green-500/15 text-green-600" label="Bestanden" value={`${passed} von ${scored.length}`} hint={scored.length < done.length ? "Weitere Bewertungen stehen aus" : undefined} />
            </div>
            {points.length > 1 && (
                <div className="rounded-2xl border border-border/60 bg-card p-4">
                    <button type="button" aria-expanded={showChart} onClick={() => setShowChart((v) => !v)} className="flex w-full cursor-pointer items-center justify-between gap-3 text-start">
                        <span className="flex items-center gap-2 text-sm font-bold text-foreground"><BarChart3 className="size-4 text-primary" aria-hidden /> Entwicklung</span>
                        <ChevronDown className={cn("size-5 text-foreground/50 transition", showChart && "rotate-180")} aria-hidden />
                    </button>
                    {showChart && <div className="anim-fade-up mt-3"><SimProgressChart points={points} max={max} threshold={profile.writtenPassThreshold} /></div>}
                </div>
            )}
        </div>
    );
}

/** All published exams of this level: how far the learner got, finished ones with their result, the running one and new ones. */
export default function ExamSetList({ profile, starting, onStart }: Readonly<{ profile: ProfileOverview; starting: boolean; onStart: (setId: string) => void }>) {
    const running = Boolean(profile.activeAttemptId);
    const sets = [...profile.sets].sort((a, b) => a.number - b.number);
    const total = sets.length;
    const done = profile.sets.filter((s) => s.status === "DONE").length;
    const pct = total > 0 ? (done / total) * 100 : 0;
    return (
        <section aria-label="Prüfungen" className="rounded-3xl border border-border/70 bg-card/50 p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-foreground">Deine Prüfungen</h2>
                    <p className="text-sm text-foreground/60">Jede Prüfung kannst du einmal machen – in beliebiger Reihenfolge.</p>
                </div>
                {total > 0 && (
                    <div className="w-full min-w-40 sm:w-56">
                        <p className="flex justify-between text-xs font-semibold text-foreground/70">
                            <span>Fortschritt</span>
                            <span className="tabular-nums">{done} von {total}</span>
                        </p>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
                            <div className="h-full rounded-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {done > 0 && <Analytics profile={profile} done={sets.filter((s) => s.status === "DONE")} />}

            {total === 0 ? (
                <p className="mt-4 rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-foreground/70">Für dieses Niveau sind noch keine Prüfungen veröffentlicht.</p>
            ) : (
                <ul className="mt-5 flex flex-col gap-3 p-0">
                    {sets.map((set) => (
                        <li key={set.id} className="list-none">
                            {set.status === "DONE" ? (
                                <DoneCard set={set} profile={profile} />
                            ) : set.status === "IN_PROGRESS" ? (
                                <RunningCard set={set} paused={profile.activeAttemptPaused} />
                            ) : (
                                <NewCard set={set} profile={profile} disabled={running} starting={starting} onStart={onStart} />
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
