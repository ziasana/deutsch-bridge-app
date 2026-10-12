"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Send } from "lucide-react";
import Loading from "@/componenets/Loading";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import SimExerciseView from "@/componenets/exam/simulation/SimExerciseView";
import SimQuestionNav from "@/componenets/exam/simulation/SimQuestionNav";
import SimReviewDialog from "@/componenets/exam/simulation/SimReviewDialog";
import SimTimerBar from "@/componenets/exam/simulation/SimTimerBar";
import { accentForSection, lessonThemeVars } from "@/componenets/exam/lessonTheme";
import { useExamAutosave } from "@/hooks/examSimulation/useExamAutosave";
import { useServerCountdown } from "@/hooks/examSimulation/useServerCountdown";
import {
    completeSimulationSection,
    getSimulationAttempt,
    resumeSimulationAttempt,
    submitSimulationAttempt,
} from "@/services/examSimulationService";
import { simulationError, simulationErrorMessage } from "@/lib/examSimulation";
import { toast } from "@/lib/toast";
import type { AttemptState, SavedAnswer } from "@/types/examSimulation";

type AnswerMap = Record<string, Record<string, SavedAnswer>>;

const REJECTION_TEXT: Record<string, string> = {
    SECTION_LOCKED: "Die Zeit für diesen Abschnitt ist abgelaufen – die letzte Eingabe wurde nicht mehr gespeichert.",
    SECTION_NOT_STARTED: "Dieser Abschnitt hat noch nicht begonnen.",
};

function ExamRunContent() {
    const router = useRouter();
    const params = useSearchParams();
    const attemptId = params.get("attempt");
    const fresh = params.get("fresh") === "1";

    const [state, setState] = useState<AttemptState | null>(null);
    const [answers, setAnswers] = useState<AnswerMap>({});
    const [loadError, setLoadError] = useState<string | null>(null);
    const [confirmSection, setConfirmSection] = useState(false);
    const [reviewState, setReviewState] = useState<AttemptState | null>(null);
    const [busy, setBusy] = useState(false);
    const finishing = useRef(false);

    const goToResult = useCallback(() => {
        if (!attemptId || finishing.current) return;
        finishing.current = true;
        router.replace(`/dashboard/exam-prep/pruefung/ergebnis?attempt=${encodeURIComponent(attemptId)}`);
    }, [attemptId, router]);

    const applyState = useCallback(
        (next: AttemptState) => {
            if (next.status !== "IN_PROGRESS") {
                goToResult();
                return;
            }
            setState((prev) => {
                if (prev && prev.currentStageIndex !== next.currentStageIndex) {
                    toast.info(`Neuer Abschnitt: ${next.stages[next.currentStageIndex]?.label ?? ""}`);
                    window.scrollTo({ top: 0 });
                }
                return next;
            });
            setAnswers(next.answers);
        },
        [goToResult],
    );

    // Initial load: a freshly started exam just reads its state; re-entering a running exam (refresh, other device) is a resume.
    useEffect(() => {
        if (!attemptId) return;
        let cancelled = false;
        const load = fresh ? getSimulationAttempt(attemptId) : resumeSimulationAttempt(attemptId);
        load.then((res) => !cancelled && applyState(res.data)).catch((error) => {
            if (cancelled) return;
            const body = simulationError(error);
            if (body?.status === 404) setLoadError("Diese Prüfung wurde nicht gefunden.");
            else setLoadError(simulationErrorMessage(error, "Die Prüfung konnte nicht geladen werden."));
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attemptId]);

    const refreshFromServer = useCallback(async () => {
        if (!attemptId) return;
        try {
            const res = await getSimulationAttempt(attemptId);
            applyState(res.data);
        } catch (error) {
            if (simulationError(error)?.status !== 404) toast.error(simulationErrorMessage(error, "Der Zeitstand konnte nicht aktualisiert werden."));
        }
    }, [attemptId, applyState]);

    const autosave = useExamAutosave({
        attemptId: attemptId ?? "",
        onRejected: (rejected) => {
            toast.error(REJECTION_TEXT[rejected[0].reason] ?? "Eine Antwort konnte nicht gespeichert werden.");
            void refreshFromServer();
        },
        onFinished: () => void refreshFromServer(),
    });

    const stage = state ? state.stages[state.currentStageIndex] : null;
    const { remainingSeconds } = useServerCountdown(stage?.deadlineAtMs ?? null, state?.serverNowMs ?? 0, () => {
        // Display only: when the browser countdown ends, ask the server what happens next.
        void autosave.flushNow().then(() => refreshFromServer());
    });

    // All sections used up: the server expects the exam to be finalised.
    useEffect(() => {
        if (state?.timeUp && attemptId) {
            void submitSimulationAttempt(attemptId).finally(goToResult);
        }
    }, [state?.timeUp, attemptId, goToResult]);

    useEffect(() => {
        const warn = (e: BeforeUnloadEvent) => {
            if (autosave.pendingCount() > 0) e.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [autosave]);

    const onAnswer = (partKey: string) => (questionId: string, answer: string | null, flagged: boolean) => {
        setAnswers((prev) => ({ ...prev, [partKey]: { ...prev[partKey], [questionId]: { answer, flagged } } }));
        autosave.enqueue({ partKey, questionId, answer, flagged });
    };

    const endSection = async () => {
        if (!attemptId) return;
        setBusy(true);
        try {
            await autosave.flushNow();
            const res = await completeSimulationSection(attemptId);
            applyState(res.data);
        } catch (error) {
            toast.error(simulationErrorMessage(error, "Der Abschnitt konnte nicht beendet werden."));
            void refreshFromServer();
        } finally {
            setBusy(false);
            setConfirmSection(false);
        }
    };

    const openReview = async () => {
        if (!attemptId) return;
        setBusy(true);
        try {
            await autosave.flushNow();
            const res = await getSimulationAttempt(attemptId);
            if (res.data.status !== "IN_PROGRESS") return applyState(res.data);
            setReviewState(res.data);
        } catch (error) {
            toast.error(simulationErrorMessage(error, "Die Übersicht konnte nicht geladen werden."));
        } finally {
            setBusy(false);
        }
    };

    const submit = async () => {
        if (!attemptId) return;
        setBusy(true);
        try {
            await autosave.flushNow();
            await submitSimulationAttempt(attemptId);
            goToResult();
        } catch (error) {
            toast.error(simulationErrorMessage(error, "Die Prüfung konnte nicht abgegeben werden. Bitte versuche es erneut."));
            setBusy(false);
        }
    };

    if (!attemptId) return <p className="p-10 text-center text-foreground/70">Keine Prüfung ausgewählt.</p>;
    if (loadError) {
        return (
            <div className="mx-auto max-w-lg p-10 text-center">
                <p className="text-foreground">{loadError}</p>
                <button type="button" onClick={() => router.push("/dashboard/exam-prep/pruefung")} className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">
                    Zur Übersicht
                </button>
            </div>
        );
    }
    if (!state || !stage) return <Loading />;

    const isLastStage = state.currentStageIndex === state.stages.length - 1;
    const accent = state.parts[0] ? accentForSection(state.parts[0].section) : null;

    return (
        <div className="min-h-screen bg-background px-4 pb-24 sm:px-6" style={accent ? lessonThemeVars(accent) : undefined} dir="ltr">
            <SimTimerBar
                stageLabel={stage.label}
                stageIndex={state.currentStageIndex}
                stageCount={state.stages.length}
                remainingSeconds={remainingSeconds}
                autosave={autosave.status}
                actions={
                    <>
                        {!isLastStage && (
                            <button type="button" disabled={busy} onClick={() => setConfirmSection(true)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-50">
                                Abschnitt beenden <ArrowRight className="size-4" aria-hidden />
                            </button>
                        )}
                        <button type="button" disabled={busy} onClick={openReview} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">
                            <Send className="size-4" aria-hidden /> Prüfung abgeben
                        </button>
                    </>
                }
            />

            <div className="mx-auto mt-6 grid max-w-6xl gap-6 lg:grid-cols-[1fr_16rem]">
                <main className="min-w-0 space-y-10">
                    {state.parts.map((part) => (
                        <SimExerciseView key={part.key} part={part} answers={answers[part.key] ?? {}} disabled={remainingSeconds <= 0} onAnswer={onAnswer(part.key)} />
                    ))}
                </main>
                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                        <h2 className="mb-3 text-sm font-bold text-foreground">Übersicht</h2>
                        <SimQuestionNav parts={state.parts} answers={answers} />
                    </div>
                </aside>
            </div>

            <ConfirmDialog
                isOpen={confirmSection}
                title="Abschnitt beenden?"
                message="Du kannst danach nicht mehr zu diesem Abschnitt zurückkehren. Die Zeit des nächsten Abschnitts beginnt sofort."
                confirmLabel="Abschnitt beenden"
                cancelLabel="Abbrechen"
                danger={false}
                onConfirm={endSection}
                onCancel={() => setConfirmSection(false)}
            />
            {reviewState && <SimReviewDialog state={reviewState} submitting={busy} onConfirm={submit} onCancel={() => setReviewState(null)} />}
        </div>
    );
}

export default function ExamRunPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ExamRunContent />
        </Suspense>
    );
}
