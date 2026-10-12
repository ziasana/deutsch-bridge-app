"use client";

import { Flag, Send } from "lucide-react";
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
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/60 bg-card p-6 shadow-lg">
                <h2 id="sim-review-title" className="text-lg font-bold text-foreground">
                    Prüfung abgeben?
                </h2>
                <p className="mt-1 text-sm text-foreground/70">
                    Nach der Abgabe kannst du nichts mehr ändern. Unbeantwortete Fragen werden mit 0 Punkten gewertet.
                </p>

                <table className="mt-4 w-full text-sm">
                    <thead>
                        <tr className="text-start text-xs uppercase tracking-wide text-foreground/50">
                            <th className="py-1 text-start font-medium">Teil</th>
                            <th className="py-1 text-end font-medium">Beantwortet</th>
                            <th className="py-1 text-end font-medium">Markiert</th>
                        </tr>
                    </thead>
                    <tbody>
                        {state.progress.map((p) => (
                            <tr key={p.partKey} className="border-t border-border/50">
                                <td className="py-1.5 text-foreground">{p.label}</td>
                                <td className={`py-1.5 text-end tabular-nums ${p.answered < p.total ? "font-semibold text-amber-700 dark:text-amber-400" : "text-foreground/80"}`}>
                                    {p.answered} / {p.total}
                                </td>
                                <td className="py-1.5 text-end tabular-nums text-foreground/80">
                                    {p.flagged > 0 && <Flag className="me-1 inline size-3 fill-amber-500 text-amber-500" aria-hidden />}
                                    {p.flagged}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {totalOpen > 0 && <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">Noch {totalOpen} offene Antworten.</p>}
                {remainingStages.length > 0 && (
                    <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                        Du hast noch nicht begonnene Abschnitte: {remainingStages.map((s) => s.label).join(", ")}. Sie werden mit der Abgabe nicht mehr bearbeitet.
                    </p>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onCancel} disabled={submitting} className="rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-50">
                        Zurück zur Prüfung
                    </button>
                    <button type="button" onClick={onConfirm} disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">
                        <Send className="size-4" aria-hidden /> {submitting ? "Wird abgegeben …" : "Jetzt abgeben"}
                    </button>
                </div>
            </div>
        </div>
    );
}
