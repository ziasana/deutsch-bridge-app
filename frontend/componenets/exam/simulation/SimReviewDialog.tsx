"use client";

import { Check, Flag, Send } from "lucide-react";
import type { AttemptState } from "@/types/examSimulation";

interface Props {
    state: AttemptState;
    submitting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/** Final review before submission: what is answered, open or flagged, and what the submission means for the remaining sections. */
export default function SimReviewDialog({ state, submitting, onConfirm, onCancel }: Readonly<Props>) {
    const remainingStages = state.stages.filter((s) => s.status === "PENDING" && s.kind === "WORKING");
    const totalOpen = state.progress.reduce((sum, p) => sum + (p.total - p.answered), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="sim-review-title">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto anim-pop rounded-3xl border border-border/60 bg-card p-6 shadow-lg">
                <h2 id="sim-review-title" className="text-lg font-bold text-foreground">
                    Prüfung abgeben?
                </h2>
                <p className="mt-1 text-sm text-foreground/70">
                    Nach der Abgabe kannst du nichts mehr ändern. Unbeantwortete Fragen werden mit 0 Punkten gewertet.
                </p>

                <ul className="mt-4 space-y-3 p-0">
                    {state.progress.map((p) => {
                        const complete = p.total > 0 && p.answered === p.total;
                        return (
                            <li key={p.partKey} className="list-none">
                                <div className="flex items-center justify-between gap-2 text-sm">
                                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                                        {complete && <Check className="size-4 text-green-600" strokeWidth={3} aria-hidden />}
                                        {p.label}
                                    </span>
                                    <span className="flex items-center gap-2 tabular-nums">
                                        {p.flagged > 0 && (
                                            <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                                                <Flag className="size-3 fill-amber-500 text-amber-500" aria-hidden /> {p.flagged}
                                            </span>
                                        )}
                                        <span className={complete ? "text-foreground/70" : "font-semibold text-amber-700 dark:text-amber-400"}>{p.answered} / {p.total}</span>
                                    </span>
                                </div>
                                <div className="mt-1 h-2 overflow-hidden rounded-full bg-foreground/10">
                                    <div className={complete ? "h-full rounded-full bg-green-500" : "h-full rounded-full bg-amber-500"} style={{ width: `${p.total ? (p.answered / p.total) * 100 : 0}%` }} />
                                </div>
                            </li>
                        );
                    })}
                </ul>

                {totalOpen > 0 && <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">Noch {totalOpen} offene Antworten.</p>}
                {remainingStages.length > 0 && (
                    <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                        Du hast noch nicht begonnene Abschnitte: {remainingStages.map((s) => s.label).join(", ")}. Sie werden mit der Abgabe nicht mehr bearbeitet.
                    </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onCancel} disabled={submitting} className="rounded-full border border-border/60 bg-card px-5 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-50">
                        Zurück zur Prüfung
                    </button>
                    <button type="button" onClick={onConfirm} disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">
                        <Send className="size-4" aria-hidden /> {submitting ? "Wird abgegeben …" : "Jetzt abgeben"}
                    </button>
                </div>
            </div>
        </div>
    );
}
