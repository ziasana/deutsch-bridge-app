"use client";

import { CheckCircle2, Circle, Clock, Info, XCircle } from "lucide-react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { OVERALL_EXPLANATION, formatDateTime, formatDuration, formatPoints } from "@/lib/examSimulation";
import { cn } from "@/lib/utils";
import type { PartResult, ResultResponse, RubricCriterion } from "@/types/examSimulation";
import SimResultBadge from "./SimResultBadge";

function Meter({ value, max, tone }: Readonly<{ value: number; max: number; tone?: string }>) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
            <div className={cn("h-full rounded-full bg-primary", tone)} style={{ width: `${pct}%` }} />
        </div>
    );
}

function SummaryCard({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
    return (
        <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm" aria-label={title}>
            <h2 className="text-xs font-bold uppercase tracking-wide text-foreground/50">{title}</h2>
            <div className="mt-3 space-y-3">{children}</div>
        </section>
    );
}

function PartRow({ part, rubric }: Readonly<{ part: PartResult; rubric: RubricCriterion[] }>) {
    const manual = part.method === "MANUAL_RUBRIC";
    return (
        <tr className="border-t border-border/50 align-top">
            <td className="py-2.5 pe-3 text-sm font-medium text-foreground">{part.label}</td>
            <td className="py-2.5 pe-3 text-end text-sm tabular-nums text-foreground">
                {part.status === "SCORED" ? (
                    <>
                        <span className="font-bold">{formatPoints(part.score)}</span> / {formatPoints(part.maxPoints)}
                    </>
                ) : part.status === "AWAITING_ASSESSMENT" ? (
                    <span className="text-amber-700 dark:text-amber-400">– / {formatPoints(part.maxPoints)}</span>
                ) : (
                    <span className="text-foreground/50">nicht bewertet</span>
                )}
            </td>
            <td className="py-2.5 text-sm text-foreground/70">
                {part.method === "PER_QUESTION" && (
                    <span className="tabular-nums">
                        {part.correct} richtig · {part.incorrect} falsch · {part.unanswered} offen
                    </span>
                )}
                {manual && part.status === "AWAITING_ASSESSMENT" && (
                    <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                        <Clock className="size-3.5" aria-hidden /> Bewertung steht noch aus
                    </span>
                )}
                {manual && part.status === "SCORED" && part.criteriaScores && (
                    <ul className="space-y-0.5 p-0">
                        {rubric.map((c) => (
                            <li key={c.key} className="list-none tabular-nums">
                                {c.label}: {formatPoints(part.criteriaScores?.[c.key])} / {formatPoints(c.maxPoints)}
                            </li>
                        ))}
                        {part.assessorComment && <li className="list-none italic">„{part.assessorComment}“</li>}
                    </ul>
                )}
                {part.method === "UNSCORED" && (
                    <span className="inline-flex items-center gap-1.5">
                        {part.completed ? <CheckCircle2 className="size-3.5 text-green-600" aria-hidden /> : <Circle className="size-3.5" aria-hidden />}
                        {part.completed ? "Geübt" : "Nicht geübt"}
                    </span>
                )}
            </td>
        </tr>
    );
}

/** The result of a finished exam. Written, oral and overall results are shown separately; nothing missing is hidden or guessed. */
export default function SimResultView({ data }: Readonly<{ data: ResultResponse }>) {
    const r = data.result;
    const writtenParts = r.parts.filter((p) => p.module === "WRITTEN");
    const oralParts = r.parts.filter((p) => p.module === "ORAL");
    return (
        <div className="space-y-6">
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
                    <Meter value={r.writtenScore} max={r.writtenMax} />
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
                <p role="status" className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                    Noch nicht bewertet: {r.parts.filter((p) => r.pendingAssessmentParts.includes(p.key)).map((p) => p.label).join(", ")}. Das Ergebnis wird aktualisiert, sobald die Bewertung vorliegt – es wird keine Punktzahl geschätzt.
                </p>
            )}

            {[
                { title: "Schriftliche Teile", parts: writtenParts },
                { title: "Mündliche Teile", parts: oralParts },
            ].map(
                ({ title, parts }) =>
                    parts.length > 0 && (
                        <section key={title} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                            <h2 className="text-base font-bold text-foreground">{title}</h2>
                            <div className="mt-2 overflow-x-auto">
                                <table className="w-full min-w-[32rem] text-start">
                                    <thead className="sr-only">
                                        <tr>
                                            <th>Teil</th>
                                            <th>Punkte</th>
                                            <th>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parts.map((p) => (
                                            <PartRow key={p.key} part={p} rubric={data.rubrics[p.key] ?? []} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ),
            )}

            <Review data={data} />
        </div>
    );
}

function Review({ data }: Readonly<{ data: ResultResponse }>) {
    if (!data.answersReleased) {
        return (
            <p className="rounded-xl border border-border/70 bg-card px-4 py-3 text-sm text-foreground/70">
                {data.answerReleasePolicy === "SCORE_ONLY"
                    ? "Für dieses Prüfungsprofil werden Lösungen nicht angezeigt."
                    : "Die richtigen Antworten werden freigegeben, sobald alle Bewertungen vorliegen."}
            </p>
        );
    }
    const labels = new Map(data.result.parts.map((p) => [p.key, p.label]));
    return (
        <section className="space-y-3" aria-label="Detailliertes Feedback">
            <h2 className="text-base font-bold text-foreground">Detailliertes Feedback</h2>
            {data.review
                .filter((part) => part.exercises.some((e) => e.questions.length > 0 || e.writtenAnswer))
                .map((part) => (
                    <details key={part.partKey} className="group rounded-2xl border border-border/70 bg-card shadow-sm">
                        <summary className="cursor-pointer list-none px-5 py-3 text-sm font-semibold text-foreground">{labels.get(part.partKey)}</summary>
                        <div className="space-y-4 border-t border-border/50 px-5 py-4">
                            {part.exercises.map((e) => (
                                <div key={e.ordinal} className="space-y-3">
                                    {e.questions.map((q, i) => (
                                        <div key={q.id} className="rounded-xl border border-border/60 p-3 text-sm">
                                            <p className="flex items-start gap-2 font-medium text-foreground">
                                                {q.correct ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" aria-label="richtig" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" aria-label="falsch" />}
                                                <span>
                                                    {q.questionNumber ?? i + 1}. {q.prompt}
                                                </span>
                                            </p>
                                            <p className="mt-1 text-foreground/70">
                                                Deine Antwort: <span className="font-semibold">{q.givenAnswer?.trim() ? q.givenAnswer : "keine Antwort"}</span>
                                                {!q.correct && (
                                                    <>
                                                        {" "}
                                                        · Richtig: <span className="font-semibold text-green-700 dark:text-green-400">{q.correctAnswer}</span>
                                                    </>
                                                )}
                                            </p>
                                            {q.explanation && <LessonMarkdown content={q.explanation} className="mt-1 text-foreground/70" />}
                                            {q.commonMistake && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Häufiger Fehler: {q.commonMistake}</p>}
                                        </div>
                                    ))}
                                    {e.transcriptHtml && (
                                        <details className="rounded-xl bg-accent/40 px-3 py-2 text-sm">
                                            <summary className="cursor-pointer font-medium">Transkript</summary>
                                            <LessonMarkdown content={e.transcriptHtml} className="mt-2 text-foreground/80" />
                                        </details>
                                    )}
                                    {e.writtenAnswer && (
                                        <div className="rounded-xl border border-border/60 p-3 text-sm">
                                            <p className="font-semibold text-foreground">Dein Text</p>
                                            <p className="mt-1 whitespace-pre-wrap text-foreground/80">{e.writtenAnswer}</p>
                                        </div>
                                    )}
                                    {e.modelSolution && (
                                        <details className="rounded-xl bg-accent/40 px-3 py-2 text-sm">
                                            <summary className="cursor-pointer font-medium">Mögliche Antwort</summary>
                                            <LessonMarkdown content={e.modelSolution} className="mt-2 text-foreground/80" />
                                        </details>
                                    )}
                                </div>
                            ))}
                        </div>
                    </details>
                ))}
        </section>
    );
}
