"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Clock, Info, Medal, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { OVERALL_EXPLANATION, formatDateTime, formatDuration, formatPoints } from "@/lib/examSimulation";
import { cn } from "@/lib/utils";
import type { PartResult, ResultResponse, ResultStatus, RubricCriterion } from "@/types/examSimulation";
import SimResultBadge from "./SimResultBadge";
import { SECTION_STYLE } from "./overview/sectionStyle";
import ResultRadar, { sectionShares } from "./result/ResultRadar";
import ReviewExplorer from "./result/ReviewExplorer";

const HERO_TONE: Record<ResultStatus, { grad: string; stroke: string; title: string; emoji: string }> = {
    PASSED: { grad: "from-emerald-500 to-green-400", stroke: "stroke-white", title: "Geschafft – schriftlich bestanden!", emoji: "🎉" },
    NOT_PASSED: { grad: "from-rose-500 to-orange-400", stroke: "stroke-white", title: "Noch nicht bestanden", emoji: "💪" },
    AWAITING_ASSESSMENT: { grad: "from-amber-500 to-yellow-400", stroke: "stroke-white", title: "Vorläufiges Ergebnis", emoji: "⏳" },
    NOT_ASSESSED: { grad: "from-slate-500 to-slate-400", stroke: "stroke-white", title: "Dein Ergebnis", emoji: "📝" },
    INCOMPLETE: { grad: "from-amber-500 to-yellow-400", stroke: "stroke-white", title: "Vorläufiges Ergebnis", emoji: "⏳" },
};

/** Big score ring; it fills up when the page opens. The tick is where "bestanden" starts. */
function HeroRing({ score, max, threshold }: Readonly<{ score: number; max: number; threshold: number }>) {
    const size = 168;
    const r = 70;
    const c = 2 * Math.PI * r;
    const [shown, setShown] = useState(0);
    useEffect(() => {
        const id = requestAnimationFrame(() => setShown(max > 0 ? Math.min(1, score / max) : 0));
        return () => cancelAnimationFrame(id);
    }, [score, max]);
    const angle = (max > 0 ? threshold / max : 0) * 2 * Math.PI - Math.PI / 2;
    const tx = size / 2 + Math.cos(angle) * r;
    const ty = size / 2 + Math.sin(angle) * r;
    return (
        <div className="relative size-[168px] shrink-0" role="img" aria-label={`${formatPoints(score)} von ${formatPoints(max)} Punkten, Bestehensgrenze ${formatPoints(threshold)}`}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="14" className="stroke-white/25" />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="14" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - shown)} className="stroke-white transition-[stroke-dashoffset] duration-1000 ease-out" />
            </svg>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden>
                <circle cx={tx} cy={ty} r="6" className="fill-white stroke-black/30" strokeWidth="2" />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                <span className="text-4xl font-extrabold tabular-nums">{formatPoints(score)}</span>
                <span className="mt-1 text-xs font-semibold text-white/80">von {formatPoints(max)}</span>
            </span>
        </div>
    );
}

function SummaryCard({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
    return (
        <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm" aria-label={title}>
            <h2 className="text-xs font-bold uppercase tracking-wide text-foreground/50">{title}</h2>
            <div className="mt-3 space-y-3">{children}</div>
        </section>
    );
}

function Meter({ value, max, passAt }: Readonly<{ value: number; max: number; passAt?: number }>) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
            {passAt != null && max > 0 && <span className="absolute inset-y-0 w-0.5 bg-foreground/70" style={{ left: `${(passAt / max) * 100}%` }} />}
        </div>
    );
}

/** One part: coloured by its section, with the points bar and, for questions, how many were right, wrong or left open. */
function PartCard({ part, rubric }: Readonly<{ part: PartResult; rubric: RubricCriterion[] }>) {
    const manual = part.method === "MANUAL_RUBRIC";
    const st = SECTION_STYLE[part.section];
    const Icon = st.icon;
    const pct = part.status === "SCORED" && part.score != null && part.maxPoints > 0 ? (part.score / part.maxPoints) * 100 : 0;
    const total = part.totalQuestions || part.correct + part.incorrect + part.unanswered;
    return (
        <li className="list-none rounded-2xl border border-border/60 bg-card p-4">
            <div className="flex items-center gap-3">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-white", st.solid)}>
                    <Icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{part.label}</p>
                    <p className="text-xs tabular-nums text-foreground/60">
                        {part.status === "SCORED" ? <>{Math.round(pct)} % erreicht</> : part.status === "AWAITING_ASSESSMENT" ? "wird bewertet" : "nicht bewertet"}
                    </p>
                </div>
                <p className="text-end text-sm tabular-nums text-foreground">
                    {part.status === "SCORED" ? (
                        <>
                            <span className="text-lg font-extrabold">{formatPoints(part.score)}</span> / {formatPoints(part.maxPoints)}
                        </>
                    ) : part.status === "AWAITING_ASSESSMENT" ? (
                        <span className="text-amber-700 dark:text-amber-400">– / {formatPoints(part.maxPoints)}</span>
                    ) : (
                        <span className="text-foreground/50">nicht bewertet</span>
                    )}
                </p>
            </div>

            {part.method === "PER_QUESTION" && total > 0 && (
                <>
                    <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
                        <span className="bg-green-500" style={{ flexGrow: part.correct, flexBasis: 0 }} />
                        <span className="bg-red-500" style={{ flexGrow: part.incorrect, flexBasis: 0 }} />
                        <span className="bg-foreground/20" style={{ flexGrow: part.unanswered, flexBasis: 0 }} />
                    </div>
                    <p className="mt-1.5 text-xs tabular-nums text-foreground/70">
                        {part.correct} richtig · {part.incorrect} falsch · {part.unanswered} offen
                    </p>
                </>
            )}
            {manual && part.status === "AWAITING_ASSESSMENT" && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                    <Clock className="size-3.5" aria-hidden /> Bewertung steht noch aus
                </p>
            )}
            {manual && part.status === "SCORED" && part.criteriaScores && (
                <ul className="mt-3 space-y-2 p-0">
                    {rubric.map((c) => (
                        <li key={c.key} className="list-none">
                            <p className="text-xs tabular-nums text-foreground/70">
                                {c.label}: {formatPoints(part.criteriaScores?.[c.key])} / {formatPoints(c.maxPoints)}
                            </p>
                            <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-foreground/10" aria-hidden>
                                <div className={cn("h-full rounded-full", st.solid)} style={{ width: `${c.maxPoints > 0 ? Math.min(100, ((part.criteriaScores?.[c.key] ?? 0) / c.maxPoints) * 100) : 0}%` }} />
                            </div>
                        </li>
                    ))}
                    {part.assessorComment && <li className="list-none text-xs italic text-foreground/70">„{part.assessorComment}“</li>}
                </ul>
            )}
            {part.method === "UNSCORED" && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-foreground/70">
                    {part.completed ? <CheckCircle2 className="size-3.5 text-green-600" aria-hidden /> : <Circle className="size-3.5" aria-hidden />}
                    {part.completed ? "Geübt" : "Nicht geübt"}
                </p>
            )}
        </li>
    );
}

/**
 * The result of a finished exam. Written, oral and overall results are shown separately; nothing missing is hidden or guessed.
 * `previousScore` (the written score of the attempt before this one) adds a comparison chip to the hero.
 */
export default function SimResultView({ data, previousScore }: Readonly<{ data: ResultResponse; previousScore?: number | null }>) {
    const r = data.result;
    const writtenParts = r.parts.filter((p) => p.module === "WRITTEN");
    const oralParts = r.parts.filter((p) => p.module === "ORAL");
    const tone = HERO_TONE[r.writtenResult] ?? HERO_TONE.NOT_ASSESSED;
    const shares = sectionShares(r.parts);
    const best = shares.length > 1 ? shares.reduce((a, b) => (b.percent > a.percent ? b : a)) : null;
    const weakest = shares.length > 1 ? shares.reduce((a, b) => (b.percent < a.percent ? b : a)) : null;
    const delta = previousScore != null && r.writtenComplete ? r.writtenScore - previousScore : null;

    return (
        <div className="space-y-6">
            <div className={cn("relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-md sm:p-8", tone.grad)}>
                <span aria-hidden className="absolute -end-12 -top-16 size-64 rounded-full bg-white/10" />
                <span aria-hidden className="absolute end-8 top-5 hidden text-7xl opacity-25 sm:block">{tone.emoji}</span>
                <div className="relative flex flex-wrap items-center gap-6">
                    <HeroRing score={r.writtenScore} max={r.writtenMax} threshold={r.writtenPassThreshold} />
                    <div className="min-w-0 flex-1 basis-64">
                        <p className="text-xs font-bold uppercase tracking-wider text-white/80">Schriftliche Prüfung</p>
                        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">{tone.title}</h2>
                        <p className="mt-2 text-sm text-white/90">
                            {formatPoints(r.writtenPercentage)} % · Bestehensgrenze {formatPoints(r.writtenPassThreshold)} Punkte
                            {r.writtenScore < r.writtenPassThreshold && r.writtenComplete && <> · dir fehlen {formatPoints(r.writtenPassThreshold - r.writtenScore)} Punkte</>}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                            {delta != null && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-3 py-1">
                                    {delta >= 0 ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
                                    {delta >= 0 ? "+" : "−"}{formatPoints(Math.abs(delta))} zum letzten Versuch
                                </span>
                            )}
                            {best && <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-3 py-1"><Trophy className="size-3.5" aria-hidden /> Stärkster Bereich: {best.label}</span>}
                            {weakest && weakest.section !== best?.section && <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-3 py-1"><Medal className="size-3.5" aria-hidden /> Üben: {weakest.label}</span>}
                        </div>
                        {!r.writtenComplete && <p className="mt-3 text-xs text-white/90">Vorläufig: Es zählen nur die bisher bewerteten Teile.</p>}
                    </div>
                </div>
            </div>

            <p className="text-sm text-foreground/60">
                {formatDateTime(data.startedAtMs)} · Dauer {formatDuration(data.durationSeconds)} · Profil-Version {data.profileVersion}
                {data.status === "EXPIRED" && " · Zeit abgelaufen, gewertet wurden die gespeicherten Antworten"}
            </p>

            <div className="grid gap-4 md:grid-cols-3">
                <SummaryCard title="Schriftliche Prüfung">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-3xl font-extrabold tabular-nums text-foreground">
                            {formatPoints(r.writtenScore)}
                            <span className="text-base font-semibold text-foreground/50"> / {formatPoints(r.writtenMax)}</span>
                        </p>
                        <SimResultBadge status={r.writtenResult} />
                    </div>
                    <Meter value={r.writtenScore} max={r.writtenMax} passAt={r.writtenPassThreshold} />
                    <p className="text-xs text-foreground/60">
                        {formatPoints(r.writtenPercentage)} % · Bestehensgrenze {formatPoints(r.writtenPassThreshold)} Punkte
                    </p>
                    {!r.writtenComplete && <p className="text-xs text-amber-700 dark:text-amber-400">Vorläufig: Es zählen nur die bisher bewerteten Teile.</p>}
                </SummaryCard>

                <SummaryCard title="Mündliche Prüfung">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-3xl font-extrabold tabular-nums text-foreground">
                            {r.oralScore != null ? formatPoints(r.oralScore) : "–"}
                            <span className="text-base font-semibold text-foreground/50"> / {formatPoints(r.oralMax)}</span>
                        </p>
                        <SimResultBadge status={r.oralResult} />
                    </div>
                    <p className="text-xs text-foreground/60">
                        {r.oralScoringEnabled ? `Bestehensgrenze ${formatPoints(r.oralPassThreshold)} Punkte` : "Mündliche Übung ohne Punktebewertung."}
                    </p>
                    <p className="text-xs text-foreground/60">
                        {oralParts.filter((p) => p.completed).length} von {oralParts.length} Teilen geübt
                    </p>
                </SummaryCard>

                <SummaryCard title="Gesamtergebnis">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-3xl font-extrabold tabular-nums text-foreground">
                            {r.totalScore != null ? formatPoints(r.totalScore) : "–"}
                            <span className="text-base font-semibold text-foreground/50"> / {formatPoints(r.totalMax)}</span>
                        </p>
                        <SimResultBadge status={r.overallResult} />
                    </div>
                    <p className="flex gap-2 text-xs leading-relaxed text-foreground/70">
                        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                        {OVERALL_EXPLANATION[r.overallExplanation] ?? ""}
                    </p>
                </SummaryCard>
            </div>

            {r.pendingAssessmentParts.length > 0 && (
                <p role="status" className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                    Noch nicht bewertet: {r.parts.filter((p) => r.pendingAssessmentParts.includes(p.key)).map((p) => p.label).join(", ")}. Das Ergebnis wird aktualisiert, sobald die Bewertung vorliegt – es wird keine Punktzahl geschätzt.
                </p>
            )}

            <div className={cn("grid gap-4", shares.length >= 3 && "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]")}>
                {shares.length >= 3 && (
                    <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm" aria-label="Bereiche im Vergleich">
                        <h2 className="text-base font-bold text-foreground">Deine Bereiche</h2>
                        <p className="text-xs text-foreground/60">Je weiter außen, desto mehr Punkte.</p>
                        <ResultRadar shares={shares} />
                    </section>
                )}
                <div className="space-y-4">
                    {[
                        { title: "Schriftliche Teile", parts: writtenParts },
                        { title: "Mündliche Teile", parts: oralParts },
                    ].map(
                        ({ title, parts }) =>
                            parts.length > 0 && (
                                <section key={title} className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
                                    <h2 className="text-base font-bold text-foreground">{title}</h2>
                                    <ul className="mt-3 grid gap-3 p-0 sm:grid-cols-2">
                                        {parts.map((p) => (
                                            <PartCard key={p.key} part={p} rubric={data.rubrics[p.key] ?? []} />
                                        ))}
                                    </ul>
                                </section>
                            ),
                    )}
                </div>
            </div>

            <ReviewExplorer data={data} />
        </div>
    );
}
