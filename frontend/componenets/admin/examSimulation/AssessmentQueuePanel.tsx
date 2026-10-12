"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Loading from "@/componenets/Loading";
import { toast } from "@/lib/toast";
import { formatDateTime, formatPoints, simulationErrorMessage } from "@/lib/examSimulation";
import { adminAiEstimate, adminAssessPart, adminAssessmentQueue } from "@/services/adminExamSimulationService";
import type { AssessmentQueueItem } from "@/types/examSimulation";
import { BTN, BTN_PRIMARY, INPUT } from "./fields";

function AssessmentCard({ item }: Readonly<{ item: AssessmentQueueItem }>) {
    const queryClient = useQueryClient();
    const [scores, setScores] = useState<Record<string, string>>({});
    const [comment, setComment] = useState("");
    const [ai, setAi] = useState<string | null>(item.aiEstimate);
    const estimate = useMutation({
        mutationFn: () => adminAiEstimate(item.attemptId, item.partKey),
        onSuccess: (res) => setAi(res.data.feedback),
        onError: (e) => toast.error(simulationErrorMessage(e, "Die KI-Einschätzung ist nicht verfügbar.")),
    });
    const total = item.rubric.reduce((s, c) => s + (Number(scores[c.key]) || 0), 0);
    const complete = item.rubric.every((c) => scores[c.key] !== undefined && scores[c.key] !== "");

    const assess = useMutation({
        mutationFn: () => adminAssessPart(item.attemptId, item.partKey, Object.fromEntries(item.rubric.map((c) => [c.key, Number(scores[c.key])])), comment),
        onSuccess: () => {
            toast.success("Bewertung gespeichert.");
            void queryClient.invalidateQueries({ queryKey: ["admin-exam-assessments"] });
        },
        onError: (e) => toast.error(simulationErrorMessage(e, "Die Bewertung konnte nicht gespeichert werden.")),
    });

    return (
        <article className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <header className="flex flex-wrap justify-between gap-2 text-sm">
                <p className="font-bold text-foreground">{item.partLabel}</p>
                <p className="text-xs text-foreground/60">Lernende/r {item.userId} · abgegeben {formatDateTime(item.submittedAtMs)} · max. {formatPoints(item.maxPoints)} Punkte</p>
            </header>
            {item.module === "WRITTEN" ? (
                <p className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-accent/30 p-3 text-sm text-foreground/85">{item.submittedText || "(leer)"}</p>
            ) : (
                <p className="text-sm text-foreground/70">Mündlicher Teil – {item.completed ? "als geübt markiert" : "nicht als geübt markiert"}.</p>
            )}
            {item.module === "WRITTEN" && (
                <div className="space-y-2">
                    <button type="button" className={BTN} disabled={estimate.isPending || !item.submittedText} onClick={() => estimate.mutate()}>
                        {estimate.isPending ? "KI schreibt …" : ai ? "KI-Einschätzung neu erzeugen" : "KI-Einschätzung erzeugen"}
                    </button>
                    {ai && (
                        <div className="rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 p-3 text-sm">
                            <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">KI-Einschätzung – nicht offiziell, zählt nicht für die Punkte</p>
                            <p className="mt-1 whitespace-pre-wrap text-foreground/80">{ai}</p>
                        </div>
                    )}
                </div>
            )}
            <div className="grid gap-2 md:grid-cols-3">
                {item.rubric.map((c) => (
                    <label key={c.key} className="text-xs font-medium text-foreground/70">
                        {c.label} (0–{formatPoints(c.maxPoints)}, Schritt 0,5)
                        <input type="number" step="0.5" min={0} max={c.maxPoints} className={`${INPUT} mt-1`} value={scores[c.key] ?? ""} onChange={(e) => setScores({ ...scores, [c.key]: e.target.value })} />
                    </label>
                ))}
            </div>
            <textarea aria-label="Kommentar" className={INPUT} rows={2} placeholder="Kommentar (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold tabular-nums">Summe: {formatPoints(total)} / {formatPoints(item.maxPoints)}</p>
                <button type="button" className={BTN_PRIMARY} disabled={!complete || assess.isPending} onClick={() => assess.mutate()}>Bewertung speichern</button>
            </div>
        </article>
    );
}

export default function AssessmentQueuePanel() {
    const { data, isLoading } = useQuery({ queryKey: ["admin-exam-assessments"], queryFn: () => adminAssessmentQueue().then((r) => r.data) });
    if (isLoading) return <Loading />;
    if (!data || data.length === 0) return <p className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-foreground/70">Keine Bewertungen offen.</p>;
    return (
        <div className="space-y-4">
            {data.map((item) => (
                <AssessmentCard key={item.assessmentId} item={item} />
            ))}
        </div>
    );
}
