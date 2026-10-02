"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    getPracticeSession,
    submitRecallAnswer,
    submitQuestionAnswer,
    submitTransformationAnswer,
    submitProductionAnswer,
} from "@/services/expressionPracticeService";
import {
    PracticeSession,
    PracticeExpression,
    PracticeQuestion,
    RecallAnswerResponse,
    QuestionAnswerResponse,
    TransformationAnswerResponse,
    ProductionAnswerResponse,
} from "@/types/expression";
import Loading from "@/componenets/Loading";
import { Check, X } from "lucide-react";
import { ReactNode } from "react";
import CircularProgress from "@/componenets/CircularProgress";
import { cn } from "@/lib/utils";

const pillPrimary =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-50";

const inputClass =
    "mb-4 w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-foreground outline-none transition placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/40";

const chipClass = "inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary";

/** One pass/fail line in an AI evaluation (used expression, grammar, ...). */
function Criterion({ ok, children }: Readonly<{ ok: boolean; children: ReactNode }>) {
    return (
        <p className="flex items-center gap-2 text-sm">
            <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-white", ok ? "bg-green-500" : "bg-red-500")} aria-hidden="true">
                {ok ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
            </span>
            {children}
        </p>
    );
}

/** Lettered answer tiles for a multiple-choice step (before checking). */
function McqOptions({ options, selectedId, onSelect }: Readonly<{ options: { id: string; text: string }[]; selectedId: string | null; onSelect: (id: string) => void }>) {
    return (
        <div className="mb-5 space-y-2.5">
            {options.map((opt, i) => {
                const isSelected = selectedId === opt.id;
                return (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSelect(opt.id)}
                        className={cn(
                            "flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left text-foreground transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                            isSelected ? "border-primary bg-primary/10" : "border-border/60 bg-background hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/50 hover:shadow-card",
                        )}
                    >
                        <span aria-hidden="true" className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", isSelected ? "bg-primary text-primary-foreground" : "bg-accent text-primary")}>
                            {String.fromCharCode(65 + i)}
                        </span>
                        <span className="min-w-0 flex-1 break-words">{opt.text}</span>
                    </button>
                );
            })}
        </div>
    );
}

/** The same tiles after checking: right answer green, a wrong pick orange. */
function McqResultOptions({ options, selectedId, correctId }: Readonly<{ options: { id: string; text: string }[]; selectedId: string | null; correctId: string | null }>) {
    return (
        <div className="mb-5 space-y-2.5">
            {options.map((opt, i) => {
                const isSelected = opt.id === selectedId;
                const isRight = opt.id === correctId;
                const isWrong = isSelected && !isRight;
                return (
                    <div
                        key={opt.id}
                        className={cn(
                            "flex items-center gap-3 rounded-2xl border px-4 py-3 text-foreground",
                            isRight && "border-green-500 bg-green-500/10",
                            isWrong && "border-orange-500 bg-orange-500/10",
                            !isRight && !isWrong && "border-border/40 opacity-55",
                        )}
                    >
                        <span aria-hidden="true" className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", isRight ? "bg-green-500 text-white" : isWrong ? "bg-orange-500 text-white" : "bg-accent text-primary")}>
                            {isRight ? <Check className="size-4" strokeWidth={3} /> : isWrong ? <X className="size-4" strokeWidth={3} /> : String.fromCharCode(65 + i)}
                        </span>
                        <span className="min-w-0 flex-1 break-words">{opt.text}</span>
                    </div>
                );
            })}
        </div>
    );
}

type StepKey = "discover" | "recall" | "context" | "completion" | "transformation" | "production";

interface ItemResult {
    expression: PracticeExpression;
    correctSteps: number;
    totalSteps: number;
    productionCorrect: boolean | null;
}

const STEP_INTRO: Record<StepKey, string> = {
    discover: "",
    recall: "Welche Wörter fehlen?",
    context: "Welche Situation passt zu dieser Wendung?",
    completion: "Wähle die richtige Ergänzung.",
    transformation: "Formuliere den Satz um.",
    production: "Jetzt bist du dran.",
};

function computeSteps(item: PracticeExpression, skipIntro: boolean): StepKey[] {
    const steps: StepKey[] = [];
    if (!skipIntro) steps.push("discover");
    for (const w of item.warmupSteps) {
        steps.push(w.toLowerCase() as StepKey);
    }
    steps.push("production");
    return steps;
}

function getQuestionForStep(item: PracticeExpression, step: StepKey): PracticeQuestion | null {
    if (step === "context") return item.contextQuestion;
    if (step === "completion") return item.completionQuestion;
    if (step === "transformation") return item.transformationQuestion;
    return null;
}

function ExpressionPracticeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const expressionId = searchParams.get("expressionId");
    // skipIntro is set only when arriving from the expression's detail page - the learner just
    // read the full meaning/examples there, so re-asking "what do you think this means?" would be
    // redundant. Arriving straight from the list card (no detail page visit) still shows Discover.
    const skipIntro = searchParams.get("skipIntro") === "1";

    const [session, setSession] = useState<PracticeSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [index, setIndex] = useState(0);
    const [stepIndex, setStepIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);

    const [recallInput, setRecallInput] = useState("");
    const [recallResult, setRecallResult] = useState<RecallAnswerResponse | null>(null);

    const [mcqSelectedOptionId, setMcqSelectedOptionId] = useState<string | null>(null);
    const [mcqResult, setMcqResult] = useState<QuestionAnswerResponse | null>(null);

    const [transformationInput, setTransformationInput] = useState("");
    const [transformationResult, setTransformationResult] = useState<TransformationAnswerResponse | null>(null);

    const [productionInput, setProductionInput] = useState("");
    const [productionResult, setProductionResult] = useState<ProductionAnswerResponse | null>(null);

    const [submitting, setSubmitting] = useState(false);

    const [stepOutcomes, setStepOutcomes] = useState<boolean[]>([]);
    const [results, setResults] = useState<ItemResult[]>([]);
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        getPracticeSession(expressionId ?? undefined)
            .then((res) => setSession(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const exitTarget =
        expressionId && skipIntro ? `/dashboard/expressions/detail?id=${expressionId}` : "/dashboard/expressions";

    if (loading) return <Loading />;

    if (!session || session.items.length === 0) {
        return (
            <div className="dashboard-atmosphere flex min-h-screen items-center justify-center p-4 sm:p-6" dir="ltr">
                <div className="anim-fade-up max-w-md rounded-[10px] bg-card p-10 text-center shadow-card">
                    <h2 className="text-2xl font-bold text-foreground mb-2">Alles erledigt!</h2>
                    <p className="text-foreground/65 mb-6">
                        Keine Wendungen sind gerade fällig. Schau später wieder vorbei.
                    </p>
                    <button type="button" className={pillPrimary} onClick={() => router.push(exitTarget)}>
                        Zurück zur Übersicht
                    </button>
                </div>
            </div>
        );
    }

    if (finished) {
        const totalCorrect = results.reduce((sum, r) => sum + r.correctSteps, 0);
        const totalSteps = results.reduce((sum, r) => sum + r.totalSteps, 0);
        const productionAttempts = results.filter((r) => r.productionCorrect !== null);
        const productionCorrectCount = productionAttempts.filter((r) => r.productionCorrect).length;
        const strong = results.filter((r) => r.productionCorrect).map((r) => r.expression.expression);
        const needsPractice = results.filter((r) => r.productionCorrect === false).map((r) => r.expression.expression);

        return (
            <div className="dashboard-atmosphere flex min-h-screen items-center justify-center p-4 sm:p-6" dir="ltr">
                <div className="anim-fade-up w-full max-w-lg rounded-[10px] bg-card p-6 shadow-card sm:p-8">
                    <h2 className="text-2xl font-bold text-foreground mb-1">Session complete 🎉</h2>
                    <p className="text-foreground/65 mb-6">Wendungen geübt: {results.length}</p>

                    <div className="mb-6 flex justify-center">
                        <div className="relative">
                            <CircularProgress value={totalSteps > 0 ? (totalCorrect / totalSteps) * 100 : 0} size={112} color="hsl(216 100% 62%)" trackColor="hsl(0 0% 50% / 0.15)" />
                            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-foreground">
                                {totalSteps > 0 ? Math.round((totalCorrect / totalSteps) * 100) : 0}%
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-accent/50 rounded-2xl p-4 text-center">
                            <p className="text-2xl font-bold text-foreground">
                                {totalCorrect}/{totalSteps}
                            </p>
                            <p className="text-xs text-foreground/60">Richtige Antworten</p>
                        </div>
                        <div className="bg-accent/50 rounded-2xl p-4 text-center">
                            <p className="text-2xl font-bold text-foreground">
                                {productionCorrectCount}/{productionAttempts.length}
                            </p>
                            <p className="text-xs text-foreground/60">Production</p>
                        </div>
                    </div>

                    {strong.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">Strong:</p>
                            <p className="text-sm text-foreground/80">{strong.join(", ")}</p>
                        </div>
                    )}
                    {needsPractice.length > 0 && (
                        <div className="mb-6">
                            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-1">Needs practice:</p>
                            <p className="text-sm text-foreground/80">{needsPractice.join(", ")}</p>
                        </div>
                    )}

                    <button type="button" className={`${pillPrimary} w-full`} onClick={() => router.push(exitTarget)}>
                        Fertig
                    </button>
                </div>
            </div>
        );
    }

    const item = session.items[index];
    const steps = computeSteps(item, skipIntro);
    const currentStep = steps[stepIndex];

    const resetStepState = () => {
        setRevealed(false);
        setRecallInput("");
        setRecallResult(null);
        setMcqSelectedOptionId(null);
        setMcqResult(null);
        setTransformationInput("");
        setTransformationResult(null);
        setProductionInput("");
        setProductionResult(null);
    };

    const advance = (outcome: boolean | null) => {
        if (outcome !== null) {
            setStepOutcomes((prev) => [...prev, outcome]);
        }
        resetStepState();

        if (stepIndex + 1 < steps.length) {
            setStepIndex(stepIndex + 1);
            return;
        }

        // Production is always the last step in every session (see computeSteps), so the final
        // outcome recorded for an item - if any - is always its production result.
        const finalOutcomes = outcome !== null ? [...stepOutcomes, outcome] : stepOutcomes;
        setResults((prev) => [
            ...prev,
            {
                expression: item,
                correctSteps: finalOutcomes.filter(Boolean).length,
                totalSteps: finalOutcomes.length,
                productionCorrect: finalOutcomes.length > 0 ? finalOutcomes[finalOutcomes.length - 1] : null,
            },
        ]);
        setStepOutcomes([]);

        if (index + 1 >= session.items.length) {
            setFinished(true);
        } else {
            setIndex(index + 1);
            setStepIndex(0);
        }
    };

    const submitRecall = () => {
        if (!recallInput.trim()) return;
        setSubmitting(true);
        submitRecallAnswer({ expressionId: item.expressionId, userAnswer: recallInput })
            .then((res) => setRecallResult(res.data))
            .catch((err) => console.error(err))
            .finally(() => setSubmitting(false));
    };

    const submitMcq = (question: PracticeQuestion) => {
        if (!mcqSelectedOptionId) return;
        setSubmitting(true);
        submitQuestionAnswer({ expressionId: item.expressionId, questionId: question.id, selectedOptionId: mcqSelectedOptionId })
            .then((res) => setMcqResult(res.data))
            .catch((err) => console.error(err))
            .finally(() => setSubmitting(false));
    };

    const submitTransformation = (question: PracticeQuestion) => {
        if (!transformationInput.trim()) return;
        setSubmitting(true);
        submitTransformationAnswer({ expressionId: item.expressionId, questionId: question.id, sentence: transformationInput })
            .then((res) => setTransformationResult(res.data))
            .catch((err) => console.error(err))
            .finally(() => setSubmitting(false));
    };

    const submitProduction = () => {
        if (!productionInput.trim()) return;
        setSubmitting(true);
        submitProductionAnswer({ expressionId: item.expressionId, sentence: productionInput })
            .then((res) => setProductionResult(res.data))
            .catch((err) => console.error(err))
            .finally(() => setSubmitting(false));
    };

    const isLastStep = stepIndex + 1 >= steps.length;
    const nextLabel = isLastStep ? "Session beenden" : "Weiter";

    return (
        <div className="dashboard-atmosphere flex min-h-screen items-center justify-center p-4 sm:p-6" dir="ltr">
            <div className="anim-fade-up w-full max-w-xl rounded-[10px] bg-card p-6 shadow-card sm:p-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground/60">
                        {index + 1} / {session.items.length}
                    </span>
                    <div className="flex gap-2">
                        <span className={chipClass}>{item.level}</span>
                        <span className={chipClass}>{item.type === "NOMEN_VERB_VERBINDUNG" ? "Nomen-Verb-Verbindung" : "Redewendung"}</span>
                    </div>
                </div>

                <div className="mb-6 flex gap-1.5" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={steps.length}>
                    {steps.map((step, i) => (
                        <span key={step} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= stepIndex ? "bg-primary" : "bg-foreground/10")} />
                    ))}
                </div>

                {currentStep === "discover" && (
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-4">{item.expression}</h2>
                        {!revealed ? (
                            <>
                                <p className="text-foreground/65 mb-6">Was glaubst du, was bedeutet das?</p>
                                <button type="button" className={pillPrimary} onClick={() => setRevealed(true)}>
                                    Bedeutung anzeigen
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="bg-accent/50 rounded-2xl p-4 mb-4 space-y-1">
                                    <p className="text-foreground font-medium">= {item.meaningDe}</p>
                                    {item.meaningEn && <p className="text-foreground/65 text-sm">🇬🇧 {item.meaningEn}</p>}
                                    {item.meaningFa && (
                                        <p className="text-foreground/65 text-sm" dir="rtl">
                                            🇮🇷 {item.meaningFa}
                                        </p>
                                    )}
                                    {item.grammarNote && (
                                        <p className="text-foreground/60 text-xs mt-2">Grammatik: {item.grammarNote}</p>
                                    )}
                                </div>
                                {item.exampleSentence && (
                                    <p className="text-foreground/80 text-sm mb-6 italic">
                                        &quot;{item.exampleSentence}&quot;
                                    </p>
                                )}
                                <button type="button" className={pillPrimary} onClick={() => advance(null)}>
                                    Weiter zur Übung
                                </button>
                            </>
                        )}
                    </div>
                )}

                {currentStep === "recall" && (
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{STEP_INTRO.recall}</p>
                        <p className="mb-6 text-lg font-semibold leading-relaxed text-foreground">
                            {item.maskedSentence ?? `Wie sagt man: "${item.meaningDe}"?`}
                        </p>

                        {!recallResult ? (
                            <>
                                <input
                                    autoFocus
                                    value={recallInput}
                                    onChange={(e) => setRecallInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && submitRecall()}
                                    placeholder="Deine Antwort..."
                                    className={inputClass}
                                />
                                <button type="button" className={pillPrimary} onClick={submitRecall} disabled={submitting}>
                                    {submitting ? "Prüfe..." : "Prüfen"}
                                </button>
                            </>
                        ) : (
                            <>
                                <div
                                    className={`rounded-2xl p-4 mb-6 ${
                                        recallResult.correct
                                            ? "bg-green-500/10 text-green-800 dark:text-green-300"
                                            : "bg-orange-500/10 text-orange-800 dark:text-orange-300"
                                    }`}
                                >
                                    <p className="font-semibold">{recallResult.correct ? "Richtig!" : "Nicht ganz."}</p>
                                    {!recallResult.correct && <p className="text-sm mt-1">Richtig wäre: {recallResult.correctAnswer}</p>}
                                </div>
                                <button type="button" className={pillPrimary} onClick={() => advance(recallResult.correct)}>
                                    {nextLabel}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {(currentStep === "context" || currentStep === "completion") &&
                    (() => {
                        const question = getQuestionForStep(item, currentStep);
                        if (!question) return null;
                        return (
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{STEP_INTRO[currentStep]}</p>
                                <p className="mb-6 text-lg font-semibold leading-relaxed text-foreground">{question.prompt}</p>

                                {!mcqResult ? (
                                    <>
                                        <McqOptions options={question.options} selectedId={mcqSelectedOptionId} onSelect={setMcqSelectedOptionId} />
                                        <button type="button" className={pillPrimary} onClick={() => submitMcq(question)} disabled={submitting || !mcqSelectedOptionId}>
                                            {submitting ? "Prüfe..." : "Prüfen"}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <McqResultOptions options={question.options} selectedId={mcqSelectedOptionId} correctId={mcqResult.correctOptionId} />
                                        {mcqResult.explanation && (
                                            <p className="text-foreground/65 text-sm mb-4">{mcqResult.explanation}</p>
                                        )}
                                        <button type="button" className={pillPrimary} onClick={() => advance(mcqResult.correct)}>
                                            {nextLabel}
                                        </button>
                                    </>
                                )}
                            </div>
                        );
                    })()}

                {currentStep === "transformation" &&
                    (() => {
                        const question = item.transformationQuestion;
                        if (!question) return null;

                        if (question.format === "FREE_TEXT") {
                            return (
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{STEP_INTRO.transformation}</p>
                                    <p className="text-lg text-foreground mb-6 font-medium italic">&quot;{question.prompt}&quot;</p>

                                    {!transformationResult ? (
                                        <>
                                            <textarea
                                                autoFocus
                                                value={transformationInput}
                                                onChange={(e) => setTransformationInput(e.target.value)}
                                                placeholder="Dein umformulierter Satz..."
                                                rows={4}
                                                className={inputClass}
                                            />
                                            <button type="button" className={pillPrimary} onClick={() => submitTransformation(question)} disabled={submitting}>
                                                {submitting ? "Wird bewertet..." : "Absenden"}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-accent/50 rounded-2xl p-4 mb-4">
                                                <div className="space-y-1.5">
                                                    <Criterion ok={transformationResult.usedExpression}>Wendung verwendet</Criterion>
                                                    <Criterion ok={transformationResult.grammarCorrect}>Grammatik korrekt</Criterion>
                                                    <Criterion ok={transformationResult.meaningPreserved}>Bedeutung erhalten</Criterion>
                                                </div>
                                                {transformationResult.feedback && (
                                                    <p className="text-foreground/80 text-sm mt-3">{transformationResult.feedback}</p>
                                                )}
                                                {transformationResult.c1Suggestion && (
                                                    <div className="mt-3 border-t border-border/60 pt-3">
                                                        <p className="text-xs text-foreground/60 mb-1">C1 suggestion:</p>
                                                        <p className="text-foreground text-sm">{transformationResult.c1Suggestion}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <button type="button" className={pillPrimary}
                                                onClick={() => advance(transformationResult.usedExpression && transformationResult.grammarCorrect)}
                                            >
                                                {nextLabel}
                                            </button>
                                        </>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{STEP_INTRO.transformation}</p>
                                <p className="text-lg text-foreground mb-6 font-medium italic">&quot;{question.prompt}&quot;</p>

                                {!mcqResult ? (
                                    <>
                                        <McqOptions options={question.options} selectedId={mcqSelectedOptionId} onSelect={setMcqSelectedOptionId} />
                                        <button type="button" className={pillPrimary} onClick={() => submitMcq(question)} disabled={submitting || !mcqSelectedOptionId}>
                                            {submitting ? "Prüfe..." : "Prüfen"}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <McqResultOptions options={question.options} selectedId={mcqSelectedOptionId} correctId={mcqResult.correctOptionId} />
                                        {mcqResult.explanation && (
                                            <p className="text-foreground/65 text-sm mb-4">{mcqResult.explanation}</p>
                                        )}
                                        <button type="button" className={pillPrimary} onClick={() => advance(mcqResult.correct)}>
                                            {nextLabel}
                                        </button>
                                    </>
                                )}
                            </div>
                        );
                    })()}

                {currentStep === "production" && (
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{STEP_INTRO.production}</p>
                        <p className="mb-6 text-lg font-semibold leading-relaxed text-foreground">
                            Schreibe einen eigenen Satz mit: <span className="text-primary">{item.expression}</span>
                        </p>

                        {!productionResult ? (
                            <>
                                <textarea
                                    autoFocus
                                    value={productionInput}
                                    onChange={(e) => setProductionInput(e.target.value)}
                                    placeholder="Dein Satz..."
                                    rows={4}
                                    className={inputClass}
                                />
                                <button type="button" className={pillPrimary} onClick={submitProduction} disabled={submitting}>
                                    {submitting ? "Wird bewertet..." : "Absenden"}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="bg-accent/50 rounded-2xl p-4 mb-4">
                                    <p className="text-sm text-foreground/60 mb-1">Dein Satz:</p>
                                    <p className="text-foreground mb-3">{productionInput}</p>
                                    <div className="space-y-1.5">
                                        <Criterion ok={productionResult.usedCorrectly}>Expression used correctly</Criterion>
                                        <Criterion ok={productionResult.grammarCorrect}>Grammar correct</Criterion>
                                        <Criterion ok={productionResult.natural}>Natural sentence</Criterion>
                                    </div>
                                    {productionResult.feedback && (
                                        <p className="text-foreground/80 text-sm mt-3">{productionResult.feedback}</p>
                                    )}
                                    {productionResult.c1Suggestion && (
                                        <div className="mt-3 border-t border-border/60 pt-3">
                                            <p className="text-xs text-foreground/60 mb-1">C1 suggestion:</p>
                                            <p className="text-foreground text-sm">{productionResult.c1Suggestion}</p>
                                        </div>
                                    )}
                                </div>
                                <button type="button" className={pillPrimary}
                                    onClick={() => advance(productionResult.usedCorrectly && productionResult.grammarCorrect)}
                                >
                                    {index + 1 >= session.items.length ? "Session beenden" : "Nächste Wendung"}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ExpressionPracticePage() {
    return (
        <Suspense fallback={<Loading />}>
            <ExpressionPracticeContent />
        </Suspense>
    );
}
