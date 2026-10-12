"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, LogOut, Send } from "lucide-react";
import Loading from "@/componenets/Loading";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";
import SimExerciseView from "@/componenets/exam/simulation/SimExerciseView";
import SimExitDialog from "@/componenets/exam/simulation/SimExitDialog";
import SimPauseScreen from "@/componenets/exam/simulation/SimPauseScreen";
import SimBottomBar from "@/componenets/exam/simulation/SimBottomBar";
import SimQuestionNav, { partItems } from "@/componenets/exam/simulation/SimQuestionNav";
import SimReviewDialog from "@/componenets/exam/simulation/SimReviewDialog";
import SimTimerBar from "@/componenets/exam/simulation/SimTimerBar";
import { accentForSection, lessonThemeVars, type LessonAccent } from "@/componenets/exam/lessonTheme";
import { useExamAutosave } from "@/hooks/examSimulation/useExamAutosave";
import { useServerCountdown } from "@/hooks/examSimulation/useServerCountdown";
import {
    completeSimulationSection,
    continueSimulationAttempt,
    getSimulationAttempt,
    pauseSimulationAttempt,
    resumeSimulationAttempt,
    submitSimulationAttempt,
} from "@/services/examSimulationService";
import { enterFullscreen, exitFullscreen } from "@/lib/fullscreen";
import { simulationError, simulationErrorMessage } from "@/lib/examSimulation";
import { cn } from "@/lib/utils";
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
    const [confirmExit, setConfirmExit] = useState(false);
    const [reviewState, setReviewState] = useState<AttemptState | null>(null);
    const [busy, setBusy] = useState(false);
    const [activePartKey, setActivePartKey] = useState<string | null>(null);
    // The tasks (and so the section colour) are not sent while paused; keep the last colour for the pause screen.
    const [pausedAccent, setPausedAccent] = useState<LessonAccent | null>(null);
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
            if (next.parts[0]) setPausedAccent(accentForSection(next.parts[0].section));
            setState((prev) => {
                if (prev && prev.currentStageIndex !== next.currentStageIndex) {
                    toast.info(`Neuer Abschnitt: ${next.stages[next.currentStageIndex]?.label ?? ""}`);
                    window.scrollTo({ top: 0 });
                    setActivePartKey(null);
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
    // A paused exam has no running clock: the server's frozen remaining time is shown instead.
    const { remainingSeconds } = useServerCountdown(state?.paused ? null : (stage?.deadlineAtMs ?? null), state?.serverNowMs ?? 0, () => {
        // Display only: when the browser countdown ends, ask the server what happens next.
        void autosave.flushNow().then(() => refreshFromServer());
    });

    // A heads-up at 5 and 1 minute left, once per section.
    const warned = useRef<string>("");
    useEffect(() => {
        if (!state || state.paused || !stage) return;
        const mark = remainingSeconds <= 60 ? "1" : remainingSeconds <= 300 ? "5" : "";
        if (!mark || remainingSeconds <= 0) return;
        const key = `${state.currentStageIndex}:${mark}`;
        if (warned.current.split(",").includes(key)) return;
        warned.current += `,${key}`;
        toast.info(mark === "1" ? "Noch 1 Minute in diesem Abschnitt!" : "Noch 5 Minuten in diesem Abschnitt.");
    }, [remainingSeconds, state, stage]);

    // All sections used up: the server expects the exam to be finalised.
    useEffect(() => {
        if (state?.timeUp && attemptId) {
            void submitSimulationAttempt(attemptId).finally(goToResult);
        }
    }, [state?.timeUp, attemptId, goToResult]);

    // Focus mode ends with the exam page: leave the browser's fullscreen again on the way out.
    useEffect(() => exitFullscreen, []);

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

    const pauseExam = async () => {
        if (!attemptId) return;
        setBusy(true);
        try {
            await autosave.flushNow();
            const res = await pauseSimulationAttempt(attemptId);
            setConfirmExit(false);
            applyState(res.data);
            exitFullscreen();
        } catch (error) {
            toast.error(simulationErrorMessage(error, "Die Prüfung konnte nicht pausiert werden."));
            void refreshFromServer();
        } finally {
            setBusy(false);
        }
    };

    const continueExam = async () => {
        if (!attemptId) return;
        enterFullscreen();
        setBusy(true);
        try {
            const res = await continueSimulationAttempt(attemptId);
            applyState(res.data);
        } catch (error) {
            toast.error(simulationErrorMessage(error, "Die Prüfung konnte nicht fortgesetzt werden."));
        } finally {
            setBusy(false);
        }
    };

    const finishExam = () => {
        setConfirmExit(false);
        void openReview();
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

    const leaveExam = () => {
        exitFullscreen();
        router.push("/dashboard/exam-prep/pruefung");
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

    if (state.paused) {
        return (
            <div style={lessonThemeVars(pausedAccent ?? "reading")}>
                <SimPauseScreen stageLabel={stage.label} remainingSeconds={state.remainingSeconds} busy={busy} onContinue={continueExam} onFinish={finishExam} onLeave={leaveExam} />
                {reviewState && <SimReviewDialog state={reviewState} submitting={busy} onConfirm={submit} onCancel={() => setReviewState(null)} />}
            </div>
        );
    }

    const isLastStage = state.currentStageIndex === state.stages.length - 1;
    const accent = state.parts[0] ? accentForSection(state.parts[0].section) : null;

    const parts = state.parts;
    const activeIdx = Math.max(0, parts.findIndex((p) => p.key === activePartKey));
    const activePart = parts[activeIdx];
    const countAnswered = (part: (typeof parts)[number]) => partItems(part).filter((i) => !!answers[part.key]?.[i.id]?.answer?.trim()).length;
    const stageTotal = parts.reduce((n, p) => n + partItems(p).length, 0);
    const stageAnswered = parts.reduce((n, p) => n + countAnswered(p), 0);
    const selectPart = (key: string) => {
        setActivePartKey(key);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const finishActions = (
        <div className="flex flex-wrap items-center gap-2.5">
            {!isLastStage && (
                <button type="button" disabled={busy} onClick={() => setConfirmSection(true)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-accent disabled:opacity-50">
                    Abschnitt beenden <ArrowRight className="size-4" aria-hidden />
                </button>
            )}
            <button type="button" disabled={busy} onClick={openReview} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50">
                <Send className="size-4" aria-hidden /> Prüfung abgeben
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background px-4 pb-28 sm:px-6" style={accent ? lessonThemeVars(accent) : undefined} dir="ltr">
            <SimTimerBar
                stageLabel={stage.label}
                stageIndex={state.currentStageIndex}
                stageCount={state.stages.length}
                stages={state.stages}
                remainingSeconds={remainingSeconds}
                totalSeconds={stage.minutes * 60}
                autosave={autosave.status}
                actions={
                    <button type="button" onClick={() => setConfirmExit(true)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent">
                        <LogOut className="size-4" aria-hidden /> Verlassen
                    </button>
                }
            />

            <div className="mx-auto mt-6 grid max-w-6xl gap-6 lg:grid-cols-[1fr_17rem]">
                <main className="min-w-0 space-y-5">
                    {parts.length > 1 && (
                        <div role="tablist" aria-label="Teile" className="flex gap-2 overflow-x-auto pb-1">
                            {parts.map((p, i) => {
                                const total = partItems(p).length;
                                const done = countAnswered(p);
                                const complete = total > 0 && done === total;
                                return (
                                    <button
                                        key={p.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={i === activeIdx}
                                        onClick={() => selectPart(p.key)}
                                        className={cn(
                                            "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition",
                                            i === activeIdx ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-foreground/80 hover:border-primary/50",
                                        )}
                                    >
                                        {complete && <Check className="size-4" strokeWidth={3} aria-hidden />}
                                        {p.label}
                                        <span className={cn("rounded-full px-2 py-0.5 text-xs tabular-nums", i === activeIdx ? "bg-white/25" : "bg-foreground/10")}>{done}/{total}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {activePart && (
                        <SimExerciseView key={activePart.key} attemptId={attemptId} part={activePart} answers={answers[activePart.key] ?? {}} disabled={remainingSeconds <= 0} onAnswer={onAnswer(activePart.key)} />
                    )}
                </main>
                <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
                    <div className="space-y-4 rounded-3xl bg-card p-4 shadow-card ring-1 ring-border/60">
                        <h2 className="text-sm font-bold text-foreground">Übersicht</h2>
                        <SimQuestionNav parts={parts} answers={answers} activePartKey={activePart?.key} onSelectPart={setActivePartKey} />
                    </div>
                </aside>
            </div>

            <SimBottomBar
                answered={stageAnswered}
                total={stageTotal}
                prevLabel={activeIdx > 0 ? parts[activeIdx - 1].label : null}
                nextLabel={activeIdx < parts.length - 1 ? parts[activeIdx + 1].label : null}
                onPrev={() => selectPart(parts[activeIdx - 1].key)}
                onNext={() => selectPart(parts[activeIdx + 1].key)}
                finish={finishActions}
            />

            {confirmExit && <SimExitDialog busy={busy} onPause={pauseExam} onFinish={finishExam} onCancel={() => setConfirmExit(false)} />}
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
