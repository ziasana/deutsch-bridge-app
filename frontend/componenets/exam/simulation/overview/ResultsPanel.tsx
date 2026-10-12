"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Pause, Trophy, XCircle } from "lucide-react";
import SimProgressChart from "@/componenets/exam/simulation/SimProgressChart";
import SimResultBadge from "@/componenets/exam/simulation/SimResultBadge";
import { formatDateTime, formatDuration, formatPoints } from "@/lib/examSimulation";
import { cn } from "@/lib/utils";
import type { AttemptSummary, ProfileOverview, ProgressPoint } from "@/types/examSimulation";

const resultHref = (a: AttemptSummary) => `/dashboard/exam-prep/pruefung/ergebnis?attempt=${encodeURIComponent(a.id)}`;

/** Score as a ring; the tick on the ring is the pass threshold. */
function ScoreRing({ score, max, threshold, complete }: Readonly<{ score: number | null; max: number | null; threshold: number; complete: boolean }>) {
    const size = 84;
    const r = 34;
    const c = 2 * Math.PI * r;
    const pct = score != null && max ? Math.min(1, score / max) : 0;
    const passed = complete && score != null && score >= threshold;
    const tickAngle = max ? (threshold / max) * 360 - 90 : -90;
    const tx = size / 2 + Math.cos((tickAngle * Math.PI) / 180) * r;
    const ty = size / 2 + Math.sin((tickAngle * Math.PI) / 180) * r;
    return (
        <div className="relative size-[84px] shrink-0">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="8" className="stroke-foreground/10" />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c * (1 - pct)}
                    className={cn("transition-[stroke-dashoffset] duration-700", !complete ? "stroke-amber-500" : passed ? "stroke-green-500" : "stroke-red-500")}
                />
            </svg>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden>
                <circle cx={tx} cy={ty} r="3" className="fill-foreground" />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center text-lg font-extrabold tabular-nums leading-none text-foreground">
                {complete ? formatPoints(score) : "–"}
                <span className="mt-0.5 text-[10px] font-semibold text-foreground/50">/ {formatPoints(max)}</span>
            </span>
        </div>
    );
}

function HighlightCard({ title, icon: Icon, a, profile }: Readonly<{ title: string; icon: typeof Trophy; a: AttemptSummary; profile: ProfileOverview }>) {
    return (
        <Link href={resultHref(a)} className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-background p-4 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
            <ScoreRing score={a.writtenScore} max={a.writtenMax} threshold={profile.writtenPassThreshold} complete={a.writtenComplete} />
            <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-foreground/50">
                    <Icon className="size-3.5" aria-hidden /> {title}
                </p>
                <div className="mt-1.5">
                    <SimResultBadge status={a.writtenResult} />
                </div>
                <p className="mt-1.5 text-xs text-foreground/60">{formatDateTime(a.endedAtMs ?? a.startedAtMs)}</p>
            </div>
        </Link>
    );
}

function AttemptRow({ a, profile }: Readonly<{ a: AttemptSummary; profile: ProfileOverview }>) {
    const cancelled = a.status === "CANCELLED";
    const running = a.status === "IN_PROGRESS";
    const pct = a.writtenMax ? Math.min(100, ((a.writtenScore ?? 0) / a.writtenMax) * 100) : 0;
    const passPct = a.writtenMax ? (profile.writtenPassThreshold / a.writtenMax) * 100 : 0;
    const href = running ? `/dashboard/exam-prep/pruefung/durchfuehrung?attempt=${encodeURIComponent(a.id)}` : cancelled ? null : resultHref(a);
    const StatusIcon = running ? Pause : cancelled ? XCircle : CheckCircle2;

    const body = (
        <>
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", running ? "bg-amber-500/15 text-amber-600" : cancelled ? "bg-foreground/10 text-foreground/50" : "bg-green-500/15 text-green-600")}>
                <StatusIcon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{formatDateTime(a.startedAtMs)}</span>
                <span className="flex flex-wrap items-center gap-x-3 text-xs text-foreground/60">
                    <span>{running ? "Läuft" : cancelled ? "Abgebrochen" : a.status === "EXPIRED" ? "Zeit abgelaufen" : "Abgegeben"}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="size-3" aria-hidden />{formatDuration(a.durationSeconds)}</span>
                </span>
            </span>
            {!cancelled && !running && (
                <span className="hidden w-40 sm:block" aria-hidden>
                    <span className="relative block h-2 overflow-hidden rounded-full bg-foreground/10">
                        <span className={cn("block h-full rounded-full", a.writtenComplete ? (pct >= passPct ? "bg-green-500" : "bg-red-500") : "bg-amber-500")} style={{ width: `${pct}%` }} />
                        <span className="absolute inset-y-0 w-0.5 bg-foreground/70" style={{ left: `${passPct}%` }} />
                    </span>
                    <span className="mt-1 block text-end text-[11px] font-semibold tabular-nums text-foreground/60">
                        {a.writtenComplete ? "" : "≥ "}{formatPoints(a.writtenScore)} / {formatPoints(a.writtenMax)}
                    </span>
                </span>
            )}
            {!cancelled && !running && <SimResultBadge status={a.overallResult ?? a.writtenResult} className="hidden md:inline-flex" />}
            {href && <span className="text-sm font-semibold text-primary">{running ? "Fortsetzen" : "Ansehen"} →</span>}
        </>
    );
    const cls = "flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-3";
    return href ? (
        <Link href={href} className={cn(cls, "transition hover:border-primary/50 hover:bg-accent/40")}>{body}</Link>
    ) : (
        <div className={cn(cls, "opacity-70")}>{body}</div>
    );
}

export default function ResultsPanel({ profile, attempts, progress }: Readonly<{ profile: ProfileOverview | undefined; attempts: AttemptSummary[]; progress: ProgressPoint[] }>) {
    const [showCancelled, setShowCancelled] = useState(false);
    const [view, setView] = useState<"chart" | "list">("list");
    const visible = attempts.filter((a) => showCancelled || a.status !== "CANCELLED");
    const hasCancelled = attempts.some((a) => a.status === "CANCELLED");

    return (
        <section id="verlauf" aria-label="Verlauf" className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-foreground">Dein Verlauf</h2>
                <div className="inline-flex rounded-full bg-accent/60 p-1" role="tablist" aria-label="Ansicht">
                    {([["list", "Versuche"], ["chart", "Entwicklung"]] as const).map(([key, label]) => (
                        <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)} className={cn("cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition", view === key ? "bg-card text-foreground shadow-sm" : "text-foreground/60 hover:text-foreground")}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {profile && (profile.latest || profile.best) && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {profile.latest && <HighlightCard title="Letztes Ergebnis" icon={Clock} a={profile.latest} profile={profile} />}
                    {profile.best && <HighlightCard title="Bestes Ergebnis" icon={Trophy} a={profile.best} profile={profile} />}
                </div>
            )}

            <div className="mt-5">
                {view === "chart" ? (
                    <SimProgressChart points={progress} max={profile?.writtenMaxPoints ?? 225} threshold={profile?.writtenPassThreshold ?? 135} />
                ) : attempts.length === 0 ? (
                    <p className="rounded-2xl bg-accent/40 p-5 text-center text-sm text-foreground/70">Du hast noch keine Prüfung gemacht. Dein erster Versuch erscheint hier.</p>
                ) : (
                    <>
                        <ul className="space-y-2 p-0">
                            {visible.map((a) => (
                                <li key={a.id} className="list-none">
                                    {profile && <AttemptRow a={a} profile={profile} />}
                                </li>
                            ))}
                        </ul>
                        {hasCancelled && (
                            <button type="button" onClick={() => setShowCancelled((v) => !v)} className="mt-3 cursor-pointer text-sm font-medium text-foreground/60 hover:text-foreground">
                                {showCancelled ? "Abgebrochene Versuche ausblenden" : "Abgebrochene Versuche anzeigen"}
                            </button>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
