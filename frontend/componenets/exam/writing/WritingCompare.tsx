"use client";

import { useMemo, useState } from "react";
import { WritingAttempt } from "@/types/writing";
import { diffWords } from "@/lib/wordDiff";
import { cn } from "@/lib/utils";

interface Props {
    attempts: WritingAttempt[];
}

function Delta({ label, before, after }: { label: string; before: number; after: number }) {
    const diff = after - before;
    return (
        <div className="rounded-lg bg-accent/50 px-3 py-2 text-center">
            <div className="text-xs text-foreground/55">{label}</div>
            <div className="text-sm font-semibold text-foreground">
                {before} → {after}
                {diff !== 0 && <span className={cn("ml-1 text-xs", diff > 0 ? "text-emerald-600" : "text-orange-600")}>({diff > 0 ? "+" : ""}{diff})</span>}
            </div>
        </div>
    );
}

/** Original vs. revised version, with the changed words highlighted in both columns. */
export default function WritingCompare({ attempts }: Props) {
    const [fromIdx, setFromIdx] = useState(0);
    const [toIdx, setToIdx] = useState(attempts.length - 1);
    const from = attempts[Math.min(fromIdx, attempts.length - 1)];
    const to = attempts[Math.min(toIdx, attempts.length - 1)];
    const parts = useMemo(() => diffWords(from.text, to.text), [from.text, to.text]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <label className="flex items-center gap-2">
                    Original
                    <select value={fromIdx} onChange={(e) => setFromIdx(Number(e.target.value))} className="rounded-lg border border-border bg-background px-2 py-1">
                        {attempts.map((a, i) => (
                            <option key={a.id} value={i}>
                                Versuch {a.attemptNumber}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex items-center gap-2">
                    Überarbeitung
                    <select value={toIdx} onChange={(e) => setToIdx(Number(e.target.value))} className="rounded-lg border border-border bg-background px-2 py-1">
                        {attempts.map((a, i) => (
                            <option key={a.id} value={i}>
                                Versuch {a.attemptNumber}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <section aria-label="Original" className="rounded-lg bg-background p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/45">Original</h4>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                        {parts
                            .filter((p) => p.kind !== "added")
                            .map((p, i) => (
                                <span key={i} className={p.kind === "removed" ? "rounded bg-red-500/15 text-red-700 dark:text-red-300" : undefined}>
                                    {p.text}
                                </span>
                            ))}
                    </p>
                </section>
                <section aria-label="Überarbeitung" className="rounded-lg bg-background p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/45">Überarbeitung</h4>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                        {parts
                            .filter((p) => p.kind !== "removed")
                            .map((p, i) => (
                                <span key={i} className={p.kind === "added" ? "rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : undefined}>
                                    {p.text}
                                </span>
                            ))}
                    </p>
                </section>
            </div>

            {from.feedback && to.feedback && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Delta label="Wörter" before={from.feedback.stats.wordCount} after={to.feedback.stats.wordCount} />
                    <Delta label="Verbindungswörter" before={from.feedback.stats.connectorCount} after={to.feedback.stats.connectorCount} />
                    <Delta label="Redemittel" before={from.feedback.stats.usedPhrases.length} after={to.feedback.stats.usedPhrases.length} />
                    <Delta
                        label="Offene Hinweise"
                        before={from.feedback.dimensions.reduce((n, d) => n + (d.status === "NOT_ASSESSED" ? 0 : d.improvements.length), 0)}
                        after={to.feedback.dimensions.reduce((n, d) => n + (d.status === "NOT_ASSESSED" ? 0 : d.improvements.length), 0)}
                    />
                </div>
            )}
        </div>
    );
}
