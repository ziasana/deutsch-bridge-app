"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { getWritingLearning } from "@/services/writingService";
import { getWritingAttempts, requestWritingAiFeedback, submitWritingAttempt } from "@/services/writingAttemptService";
import { WritingAttempt } from "@/types/writing";
import { cn } from "@/lib/utils";
import WritingPlanner from "./WritingPlanner";
import WritingEditor from "./WritingEditor";
import WritingHelpDrawer from "./WritingHelpDrawer";
import WritingSubmitDialog from "./WritingSubmitDialog";
import WritingFeedback from "./WritingFeedback";
import WritingRevision from "./WritingRevision";
import WritingCompare from "./WritingCompare";
import WritingAiFeedback from "./WritingAiFeedback";
import { useWritingDraft } from "./useWritingDraft";
import { HELP_TABS_BY_MODE, WRITING_MODES } from "./writingMeta";

interface WritingExerciseProps {
    exerciseId: string;
    level: string | null;
    requiresPlanning: boolean;
    leitpunkte: string[];
    modelSolution: string | null;
    /** Called after a successful submission (the page marks the exercise done / stops its timer). */
    onSubmitted: () => void;
}

/** Write flow for one task: (optional plan) -> write with mode-dependent help -> confirm -> submit. */
export default function WritingExercise({ exerciseId, level, requiresPlanning, leitpunkte, modelSolution, onSubmitted }: WritingExerciseProps) {
    const draft = useWritingDraft(exerciseId, leitpunkte.length);
    const { text, mode } = draft;
    const [helpOpen, setHelpOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showSolution, setShowSolution] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [resultTab, setResultTab] = useState<"feedback" | "compare">("feedback");
    const queryClient = useQueryClient();

    const attemptsKey = ["writing", "attempts", exerciseId];
    const { data: attempts = [] } = useQuery({
        queryKey: attemptsKey,
        queryFn: () => getWritingAttempts(exerciseId).then((res) => res.data),
    });
    const submitted: WritingAttempt | null = attempts.length > 0 ? attempts[attempts.length - 1] : null;
    // Reopening an exercise that already has attempts (and no unsent draft) lands on the latest result;
    // revising flips this to false and keeps the latest attempt as the parent of the next one.
    const [doneOverride, setDone] = useState<boolean | null>(null);
    const done = doneOverride ?? (submitted !== null && !text.trim());

    const helpTabs = HELP_TABS_BY_MODE[mode];
    const { data: learning, isLoading: learningLoading } = useQuery({
        queryKey: ["writing", "learn", level],
        queryFn: () => getWritingLearning(level!).then((res) => res.data),
        enabled: !!level && helpTabs.length > 0 && helpOpen,
    });

    // Leaving the page with unsubmitted text asks for confirmation (the draft is also autosaved).
    useEffect(() => {
        if (done || !text.trim()) return;
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [done, text]);

    const closeHelp = useCallback(() => setHelpOpen(false), []);
    const changeMode = (m: typeof mode) => {
        draft.setMode(m);
        if (m === "EXAM") setHelpOpen(false);
    };

    const planning = requiresPlanning && mode !== "EXAM" && !draft.planDone && !submitted;
    const hasNotes = draft.plan.some((n) => n.trim());

    const requestAi = async (attemptId: string) => {
        setAiLoading(true);
        try {
            const res = await requestWritingAiFeedback(attemptId);
            queryClient.setQueryData<WritingAttempt[]>(attemptsKey, (old = []) => old.map((a) => (a.id === res.data.id ? res.data : a)));
        } catch (err) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e?.response?.data?.message ?? "KI-Feedback ist gerade nicht verfügbar.");
        } finally {
            setAiLoading(false);
        }
    };

    const confirmSubmit = async () => {
        setSubmitting(true);
        try {
            const res = await submitWritingAttempt({
                exerciseId,
                text,
                mode,
                planNotes: mode === "EXAM" ? [] : draft.plan,
                parentAttemptId: submitted?.id ?? null,
            });
            queryClient.setQueryData<WritingAttempt[]>(attemptsKey, (old = []) => [...old, res.data]);
            setDone(true);
            setResultTab("feedback");
            setConfirmOpen(false);
            draft.clear();
            onSubmitted();
        } catch (err) {
            const e = err as { response?: { data?: { message?: string } } };
            toast.error(e?.response?.data?.message ?? "Text konnte nicht abgegeben werden.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {!done && (
                <div role="radiogroup" aria-label="Übungsmodus" className="flex flex-wrap gap-2">
                    {WRITING_MODES.map((m) => (
                        <button
                            key={m.mode}
                            type="button"
                            role="radio"
                            aria-checked={mode === m.mode}
                            onClick={() => changeMode(m.mode)}
                            className={cn(
                                "rounded-full border px-4 py-1.5 text-left text-sm transition cursor-pointer",
                                mode === m.mode ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground/65 hover:bg-accent",
                            )}
                        >
                            <span className="font-medium">{m.label}</span>
                            <span className="ml-2 hidden text-xs opacity-70 sm:inline">{m.hint}</span>
                        </button>
                    ))}
                </div>
            )}

            {done && submitted ? (
                <div className="space-y-4 rounded-[10px] bg-card p-5 shadow-card sm:p-6">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">✅ Text abgegeben</h2>
                        <p className="mt-1 text-sm text-foreground/60">
                            Versuch {submitted.attemptNumber} · {submitted.wordCount} Wörter
                        </p>
                    </div>
                    <p className="whitespace-pre-wrap rounded-lg bg-background p-4 text-sm leading-relaxed text-foreground/85">{submitted.text}</p>

                    {attempts.length > 1 && (
                        <div role="tablist" aria-label="Ergebnis" className="inline-flex rounded-full bg-accent p-1 text-xs font-medium">
                            {(["feedback", "compare"] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    role="tab"
                                    aria-selected={resultTab === t}
                                    onClick={() => setResultTab(t)}
                                    className={cn(
                                        "rounded-full px-3 py-1.5 transition cursor-pointer",
                                        resultTab === t ? "bg-card text-foreground shadow-card" : "text-foreground/60 hover:text-foreground",
                                    )}
                                >
                                    {t === "feedback" ? "Feedback" : "Original vs. Überarbeitung"}
                                </button>
                            ))}
                        </div>
                    )}

                    {resultTab === "compare" && attempts.length > 1 ? (
                        <WritingCompare attempts={attempts} />
                    ) : submitted.feedback ? (
                        <WritingFeedback feedback={submitted.feedback} />
                    ) : (
                        <p className="text-sm text-foreground/55">Für diesen Versuch ist kein Feedback verfügbar.</p>
                    )}

                    {resultTab === "feedback" &&
                        (submitted.aiFeedback ? (
                            <WritingAiFeedback feedback={submitted.aiFeedback} />
                        ) : (
                            <div className="rounded-xl border border-dashed border-border p-4 text-sm">
                                <p className="text-foreground/65">Möchtest du genauere Hinweise zu Grammatik und Wortschatz?</p>
                                <button
                                    type="button"
                                    disabled={aiLoading}
                                    onClick={() => requestAi(submitted.id)}
                                    className="mt-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 cursor-pointer"
                                >
                                    {aiLoading ? "KI analysiert deinen Text…" : "🤖 KI-Feedback anfordern"}
                                </button>
                            </div>
                        ))}

                    <WritingRevision
                        feedback={submitted.feedback}
                        onRevise={() => {
                            // After a reload the editor state is empty, so start from the last submitted text.
                            if (!text.trim()) draft.setText(submitted.text);
                            setShowSolution(false);
                            setDone(false);
                        }}
                    />

                    {modelSolution && (
                        <div>
                            {showSolution ? (
                                <LessonMarkdown content={modelSolution} className="text-sm text-gray-700 dark:text-gray-300" />
                            ) : (
                                <button type="button" onClick={() => setShowSolution(true)} className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent cursor-pointer">
                                    Mögliche Lösung anzeigen
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : planning ? (
                <WritingPlanner leitpunkte={leitpunkte} notes={draft.plan} onChange={draft.setPlan} onContinue={() => draft.setPlanDone(true)} />
            ) : (
                <>
                    {mode !== "EXAM" && hasNotes && (
                        <div className="rounded-[10px] border border-border/60 bg-card p-4 text-sm shadow-card">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-foreground">📝 Deine Notizen</span>
                                {requiresPlanning && (
                                    <button type="button" onClick={() => draft.setPlanDone(false)} className="text-xs font-medium text-primary hover:underline cursor-pointer">
                                        Bearbeiten
                                    </button>
                                )}
                            </div>
                            <ul className="mt-2 space-y-1 text-foreground/75">
                                {draft.plan.map((n, i) => (n.trim() ? <li key={i}>• {leitpunkte[i] ? `${leitpunkte[i]} – ` : ""}{n}</li> : null))}
                            </ul>
                        </div>
                    )}
                    <WritingEditor
                        value={text}
                        onChange={draft.setText}
                        onOpenHelp={helpTabs.length > 0 ? () => setHelpOpen(true) : undefined}
                        onSubmit={() => setConfirmOpen(true)}
                        savedAt={draft.savedAt}
                        submitting={submitting}
                    />
                </>
            )}

            <WritingHelpDrawer open={helpOpen} onClose={closeHelp} tabs={helpTabs} data={learning} loading={learningLoading} />
            <WritingSubmitDialog open={confirmOpen} submitting={submitting} onCancel={() => setConfirmOpen(false)} onConfirm={confirmSubmit} />
        </div>
    );
}
