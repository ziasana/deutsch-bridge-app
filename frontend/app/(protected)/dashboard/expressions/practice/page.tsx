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
import Button from "@/componenets/Button";
import { Badge } from "@/componenets/ui/badge";

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
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 flex items-center justify-center" dir="ltr">
                <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-10 text-center max-w-md">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Alles erledigt!</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Keine Wendungen sind gerade fällig. Schau später wieder vorbei.
                    </p>
                    <Button variant="primary" onClick={() => router.push(exitTarget)}>
                        Zurück zur Übersicht
                    </Button>
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
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 flex items-center justify-center" dir="ltr">
                <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-8 max-w-lg w-full">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Session complete 🎉</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">Wendungen geübt: {results.length}</p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {totalCorrect}/{totalSteps}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Richtige Antworten</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {productionCorrectCount}/{productionAttempts.length}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Production</p>
                        </div>
                    </div>

                    {strong.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">Strong:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{strong.join(", ")}</p>
                        </div>
                    )}
                    {needsPractice.length > 0 && (
                        <div className="mb-6">
                            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-1">Needs practice:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{needsPractice.join(", ")}</p>
                        </div>
                    )}

                    <Button variant="primary" className="w-full" onClick={() => router.push(exitTarget)}>
                        Fertig
                    </Button>
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
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 flex items-center justify-center" dir="ltr">
            <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-8 max-w-xl w-full">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {index + 1} / {session.items.length}
                    </span>
                    <div className="flex gap-2">
                        <Badge variant="secondary">{item.level}</Badge>
                        <Badge variant="secondary">
                            {item.type === "NOMEN_VERB_VERBINDUNG" ? "Nomen-Verb-Verbindung" : "Redewendung"}
                        </Badge>
                    </div>
                </div>

                {currentStep === "discover" && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{item.expression}</h2>
                        {!revealed ? (
                            <>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">Was glaubst du, was bedeutet das?</p>
                                <Button variant="primary" onClick={() => setRevealed(true)}>
                                    Bedeutung anzeigen
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4 space-y-1">
                                    <p className="text-gray-900 dark:text-white font-medium">= {item.meaningDe}</p>
                                    {item.meaningEn && <p className="text-gray-600 dark:text-gray-300 text-sm">🇬🇧 {item.meaningEn}</p>}
                                    {item.meaningFa && (
                                        <p className="text-gray-600 dark:text-gray-300 text-sm" dir="rtl">
                                            🇮🇷 {item.meaningFa}
                                        </p>
                                    )}
                                    {item.grammarNote && (
                                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">Grammatik: {item.grammarNote}</p>
                                    )}
                                </div>
                                {item.exampleSentence && (
                                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-6 italic">
                                        &quot;{item.exampleSentence}&quot;
                                    </p>
                                )}
                                <Button variant="primary" onClick={() => advance(null)}>
                                    Weiter zur Übung
                                </Button>
                            </>
                        )}
                    </div>
                )}

                {currentStep === "recall" && (
                    <div>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">{STEP_INTRO.recall}</p>
                        <p className="text-lg text-gray-900 dark:text-white mb-6 font-medium">
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
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <Button variant="primary" onClick={submitRecall} disabled={submitting}>
                                    {submitting ? "Prüfe..." : "Prüfen"}
                                </Button>
                            </>
                        ) : (
                            <>
                                <div
                                    className={`rounded-xl p-4 mb-6 ${
                                        recallResult.correct
                                            ? "bg-green-50 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                                            : "bg-orange-50 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300"
                                    }`}
                                >
                                    <p className="font-semibold">{recallResult.correct ? "✅ Richtig!" : "Nicht ganz."}</p>
                                    {!recallResult.correct && <p className="text-sm mt-1">Richtig wäre: {recallResult.correctAnswer}</p>}
                                </div>
                                <Button variant="primary" onClick={() => advance(recallResult.correct)}>
                                    {nextLabel}
                                </Button>
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
                                <p className="text-gray-600 dark:text-gray-300 mb-2">{STEP_INTRO[currentStep]}</p>
                                <p className="text-lg text-gray-900 dark:text-white mb-6 font-medium">{question.prompt}</p>

                                {!mcqResult ? (
                                    <>
                                        <div className="space-y-2 mb-4">
                                            {question.options.map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setMcqSelectedOptionId(opt.id)}
                                                    className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                                                        mcqSelectedOptionId === opt.id
                                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-gray-900 dark:text-white"
                                                            : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:border-blue-300"
                                                    }`}
                                                >
                                                    {opt.text}
                                                </button>
                                            ))}
                                        </div>
                                        <Button variant="primary" onClick={() => submitMcq(question)} disabled={submitting || !mcqSelectedOptionId}>
                                            {submitting ? "Prüfe..." : "Prüfen"}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-2 mb-4">
                                            {question.options.map((opt) => {
                                                const isSelected = opt.id === mcqSelectedOptionId;
                                                const isCorrectOption = opt.id === mcqResult.correctOptionId;
                                                const style = isCorrectOption
                                                    ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                                                    : isSelected
                                                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30"
                                                    : "border-gray-200 dark:border-gray-700";
                                                return (
                                                    <div
                                                        key={opt.id}
                                                        className={`px-4 py-3 rounded-lg border text-gray-900 dark:text-white ${style}`}
                                                    >
                                                        {opt.text} {isCorrectOption && "✅"} {isSelected && !isCorrectOption && "❌"}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {mcqResult.explanation && (
                                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{mcqResult.explanation}</p>
                                        )}
                                        <Button variant="primary" onClick={() => advance(mcqResult.correct)}>
                                            {nextLabel}
                                        </Button>
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
                                    <p className="text-gray-600 dark:text-gray-300 mb-2">{STEP_INTRO.transformation}</p>
                                    <p className="text-lg text-gray-900 dark:text-white mb-6 font-medium italic">&quot;{question.prompt}&quot;</p>

                                    {!transformationResult ? (
                                        <>
                                            <textarea
                                                autoFocus
                                                value={transformationInput}
                                                onChange={(e) => setTransformationInput(e.target.value)}
                                                placeholder="Dein umformulierter Satz..."
                                                rows={4}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />
                                            <Button variant="primary" onClick={() => submitTransformation(question)} disabled={submitting}>
                                                {submitting ? "Wird bewertet..." : "Absenden"}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
                                                <div className="space-y-1 text-sm">
                                                    <p>{transformationResult.usedExpression ? "✅" : "❌"} Wendung verwendet</p>
                                                    <p>{transformationResult.grammarCorrect ? "✅" : "❌"} Grammatik korrekt</p>
                                                    <p>{transformationResult.meaningPreserved ? "✅" : "❌"} Bedeutung erhalten</p>
                                                </div>
                                                {transformationResult.feedback && (
                                                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-3">{transformationResult.feedback}</p>
                                                )}
                                                {transformationResult.c1Suggestion && (
                                                    <div className="mt-3 border-t border-gray-200 dark:border-gray-600 pt-3">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">C1 suggestion:</p>
                                                        <p className="text-gray-900 dark:text-white text-sm">{transformationResult.c1Suggestion}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                variant="primary"
                                                onClick={() => advance(transformationResult.usedExpression && transformationResult.grammarCorrect)}
                                            >
                                                {nextLabel}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <div>
                                <p className="text-gray-600 dark:text-gray-300 mb-2">{STEP_INTRO.transformation}</p>
                                <p className="text-lg text-gray-900 dark:text-white mb-6 font-medium italic">&quot;{question.prompt}&quot;</p>

                                {!mcqResult ? (
                                    <>
                                        <div className="space-y-2 mb-4">
                                            {question.options.map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setMcqSelectedOptionId(opt.id)}
                                                    className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                                                        mcqSelectedOptionId === opt.id
                                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-gray-900 dark:text-white"
                                                            : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:border-blue-300"
                                                    }`}
                                                >
                                                    {opt.text}
                                                </button>
                                            ))}
                                        </div>
                                        <Button variant="primary" onClick={() => submitMcq(question)} disabled={submitting || !mcqSelectedOptionId}>
                                            {submitting ? "Prüfe..." : "Prüfen"}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-2 mb-4">
                                            {question.options.map((opt) => {
                                                const isSelected = opt.id === mcqSelectedOptionId;
                                                const isCorrectOption = opt.id === mcqResult.correctOptionId;
                                                const style = isCorrectOption
                                                    ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                                                    : isSelected
                                                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30"
                                                    : "border-gray-200 dark:border-gray-700";
                                                return (
                                                    <div
                                                        key={opt.id}
                                                        className={`px-4 py-3 rounded-lg border text-gray-900 dark:text-white ${style}`}
                                                    >
                                                        {opt.text} {isCorrectOption && "✅"} {isSelected && !isCorrectOption && "❌"}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {mcqResult.explanation && (
                                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{mcqResult.explanation}</p>
                                        )}
                                        <Button variant="primary" onClick={() => advance(mcqResult.correct)}>
                                            {nextLabel}
                                        </Button>
                                    </>
                                )}
                            </div>
                        );
                    })()}

                {currentStep === "production" && (
                    <div>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">{STEP_INTRO.production}</p>
                        <p className="text-lg text-gray-900 dark:text-white mb-6 font-medium">
                            Schreibe einen eigenen Satz mit: <span className="text-blue-600 dark:text-blue-400">{item.expression}</span>
                        </p>

                        {!productionResult ? (
                            <>
                                <textarea
                                    autoFocus
                                    value={productionInput}
                                    onChange={(e) => setProductionInput(e.target.value)}
                                    placeholder="Dein Satz..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <Button variant="primary" onClick={submitProduction} disabled={submitting}>
                                    {submitting ? "Wird bewertet..." : "Absenden"}
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Dein Satz:</p>
                                    <p className="text-gray-900 dark:text-white mb-3">{productionInput}</p>
                                    <div className="space-y-1 text-sm">
                                        <p>{productionResult.usedCorrectly ? "✅" : "❌"} Expression used correctly</p>
                                        <p>{productionResult.grammarCorrect ? "✅" : "❌"} Grammar correct</p>
                                        <p>{productionResult.natural ? "✅" : "❌"} Natural sentence</p>
                                    </div>
                                    {productionResult.feedback && (
                                        <p className="text-gray-700 dark:text-gray-300 text-sm mt-3">{productionResult.feedback}</p>
                                    )}
                                    {productionResult.c1Suggestion && (
                                        <div className="mt-3 border-t border-gray-200 dark:border-gray-600 pt-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">C1 suggestion:</p>
                                            <p className="text-gray-900 dark:text-white text-sm">{productionResult.c1Suggestion}</p>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="primary"
                                    onClick={() => advance(productionResult.usedCorrectly && productionResult.grammarCorrect)}
                                >
                                    {index + 1 >= session.items.length ? "Session beenden" : "Nächste Wendung"}
                                </Button>
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
