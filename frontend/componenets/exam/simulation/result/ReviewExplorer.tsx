"use client";

import { useState } from "react";
import { Check, Lightbulb, X } from "lucide-react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { cn } from "@/lib/utils";
import type { ResultResponse, ReviewQuestion } from "@/types/examSimulation";

/**
 * The detailed feedback as an explorer: pick a part, see all its questions as green / red tiles, tap a tile for the
 * learner's answer, the right answer and the explanation. "Nur Fehler" narrows the tiles to what went wrong.
 */
export default function ReviewExplorer({ data }: Readonly<{ data: ResultResponse }>) {
    const labels = new Map(data.result.parts.map((p) => [p.key, p.label]));
    const parts = data.review.filter((part) => part.exercises.some((e) => e.questions.length > 0 || e.writtenAnswer));
    const [partKey, setPartKey] = useState(parts[0]?.partKey ?? "");
    const [onlyWrong, setOnlyWrong] = useState(false);
    const [picked, setPicked] = useState<string | null>(null);

    if (!data.answersReleased) {
        return (
            <p className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm text-foreground/70">
                {data.answerReleasePolicy === "SCORE_ONLY"
                    ? "Für dieses Prüfungsprofil werden Lösungen nicht angezeigt."
                    : "Die richtigen Antworten werden freigegeben, sobald alle Bewertungen vorliegen."}
            </p>
        );
    }
    const part = parts.find((p) => p.partKey === partKey) ?? parts[0];
    if (!part) return null;

    const questions: ReviewQuestion[] = part.exercises.flatMap((e) => e.questions);
    const visible = onlyWrong ? questions.filter((q) => !q.correct) : questions;
    const numberOf = (q: ReviewQuestion) => q.questionNumber ?? questions.indexOf(q) + 1;
    // Open on the first mistake - that is what is worth reading first.
    const selected = visible.find((q) => q.id === picked) ?? visible.find((q) => !q.correct) ?? visible[0];
    const wrongIn = (key: string) => data.review.find((p) => p.partKey === key)?.exercises.flatMap((e) => e.questions).filter((q) => !q.correct).length ?? 0;

    return (
        <section className="space-y-4" aria-label="Detailliertes Feedback">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-foreground">Detailliertes Feedback</h2>
                {questions.length > 0 && (
                    <button type="button" role="switch" aria-checked={onlyWrong} onClick={() => setOnlyWrong((v) => !v)} className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground/70">
                        <span className={cn("relative h-5 w-9 rounded-full transition", onlyWrong ? "bg-primary" : "bg-foreground/20")}>
                            <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-all", onlyWrong ? "left-[18px]" : "left-0.5")} />
                        </span>
                        Nur Fehler
                    </button>
                )}
            </div>

            <div role="tablist" aria-label="Teile" className="flex gap-2 overflow-x-auto pb-1">
                {parts.map((p) => {
                    const wrong = wrongIn(p.partKey);
                    const active = p.partKey === part.partKey;
                    return (
                        <button
                            key={p.partKey}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => {
                                setPartKey(p.partKey);
                                setPicked(null);
                            }}
                            className={cn("inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/80 hover:border-primary/50")}
                        >
                            {labels.get(p.partKey)}
                            {wrong > 0 && <span className={cn("rounded-full px-2 py-0.5 text-xs tabular-nums", active ? "bg-white/25" : "bg-red-500/15 text-red-700 dark:text-red-400")}>{wrong} ✕</span>}
                        </button>
                    );
                })}
            </div>

            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
                {questions.length > 0 && (
                    <ul className="flex flex-wrap gap-2 p-0" aria-label="Fragen">
                        {visible.map((q) => (
                            <li key={q.id} className="list-none">
                                <button
                                    type="button"
                                    onClick={() => setPicked(q.id)}
                                    aria-label={`Frage ${numberOf(q)}: ${q.correct ? "richtig" : "falsch"}`}
                                    aria-current={selected?.id === q.id ? "true" : undefined}
                                    className={cn(
                                        "flex size-10 cursor-pointer items-center justify-center gap-0.5 rounded-xl text-sm font-extrabold text-white transition hover:-translate-y-0.5",
                                        q.correct ? "bg-green-500" : "bg-red-500",
                                        selected?.id === q.id && "ring-2 ring-foreground/70 ring-offset-2 ring-offset-card",
                                    )}
                                >
                                    {numberOf(q)}
                                </button>
                            </li>
                        ))}
                        {visible.length === 0 && <li className="list-none text-sm text-foreground/60">Keine Fehler in diesem Teil.</li>}
                    </ul>
                )}

                {selected && (
                    <div key={selected.id} className="anim-fade-up mt-4 rounded-2xl bg-accent/40 p-4 text-sm">
                        <p className="flex items-start gap-2 font-semibold text-foreground">
                            <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white", selected.correct ? "bg-green-500" : "bg-red-500")}>
                                {selected.correct ? <Check className="size-3" strokeWidth={3} aria-label="richtig" /> : <X className="size-3" strokeWidth={3} aria-label="falsch" />}
                            </span>
                            <span>{numberOf(selected)}. {selected.prompt}</span>
                        </p>
                        <p className="mt-2 text-foreground/70">
                            Deine Antwort: <span className="font-semibold">{selected.givenAnswer?.trim() ? selected.givenAnswer : "keine Antwort"}</span>
                            {!selected.correct && (
                                <>
                                    {" "}
                                    · Richtig: <span className="font-semibold text-green-700 dark:text-green-400">{selected.correctAnswer}</span>
                                </>
                            )}
                        </p>
                        {selected.explanation && <LessonMarkdown content={selected.explanation} className="mt-2 text-foreground/75" />}
                        {selected.commonMistake && (
                            <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                                <Lightbulb className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Häufiger Fehler: {selected.commonMistake}
                            </p>
                        )}
                    </div>
                )}

                {part.exercises.map((e) => (
                    <div key={e.ordinal} className="mt-4 space-y-3">
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
        </section>
    );
}
