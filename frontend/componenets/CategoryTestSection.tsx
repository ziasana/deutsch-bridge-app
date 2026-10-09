"use client";

import { useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { submitCategoryTest, markCategoryComplete } from "@/services/grammarService";
import { CategoryTestStatus, GrammarLesson, QuizQuestion } from "@/types/grammar";
import { localizedQuestionText } from "@/lib/grammarLocalization";
import { AppLanguage } from "@/lib/i18n/translations";
import { useI18n } from "@/componenets/I18nProvider";
import GrammarQuestionView, { isCorrectAnswer, quizPrimaryButton, quizSecondaryButton } from "@/componenets/GrammarQuestionView";
import ScoreRing from "@/componenets/learning/ScoreRing";
import { isPlayableQuestion } from "@/lib/grammarQuiz";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, CheckCircle2, ClipboardCheck, ListChecks, Play, RotateCw, Target, Trophy, X } from "lucide-react";

const MAX_QUESTIONS = 15;

type PooledQuestion = QuizQuestion & { lessonId: string };

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

type Phase = "idle" | "active" | "results";

export default function CategoryTestSection({
    categoryId,
    lessons,
    level,
    passThreshold,
    language,
    initialStatus,
    onStatusChange,
}: Readonly<{
    categoryId: string;
    lessons: GrammarLesson[];
    level: string;
    passThreshold: number;
    language: AppLanguage;
    initialStatus: CategoryTestStatus;
    onStatusChange?: (status: CategoryTestStatus) => void;
}>) {
    const pool = useMemo<PooledQuestion[]>(
        // Questions without usable options/answer can't be answered, so they never make it into the test.
        () => lessons.flatMap((l) => (l.quiz ?? []).filter(isPlayableQuestion).map((q) => ({ ...q, lessonId: l.id }))),
        [lessons]
    );

    const [phase, setPhase] = useState<Phase>("idle");
    const [questions, setQuestions] = useState<PooledQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    // Per question of the running test: true/false once answered, undefined while still open.
    const [results, setResults] = useState<(boolean | undefined)[]>([]);
    const [status, setStatus] = useState<CategoryTestStatus>(initialStatus);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const { t } = useI18n();

    if (pool.length === 0) {
        return (
            <p className="text-sm text-foreground/60">{t.grammar.categoryTest.noExercises}</p>
        );
    }

    const beginTest = () => {
        const picked = shuffle(pool).slice(0, Math.min(MAX_QUESTIONS, pool.length));
        setQuestions(picked);
        setCurrentIndex(0);
        setSelectedAnswer("");
        setSubmitted(false);
        setCorrectCount(0);
        setResults(new Array(picked.length).fill(undefined));
        setPhase("active");
    };

    const question = questions[currentIndex];
    const localized = question ? localizedQuestionText(question, level, language) : null;
    const correct = submitted && question ? isCorrectAnswer(question, selectedAnswer) : false;

    const submitAnswer = () => {
        if (!question) return;
        setSubmitted(true);
        const wasCorrect = isCorrectAnswer(question, selectedAnswer);
        if (wasCorrect) {
            setCorrectCount((c) => c + 1);
        }
        setResults((prev) => prev.map((r, i) => (i === currentIndex ? wasCorrect : r)));
    };

    const finishTest = (finalCorrect: number) => {
        setPhase("results");
        setIsSubmitting(true);
        submitCategoryTest(categoryId, { score: finalCorrect, total: questions.length })
            .then((res) => {
                setStatus(res.data);
                onStatusChange?.(res.data);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? t.grammar.categoryTest.failedSaveResult))
            .finally(() => setIsSubmitting(false));
    };

    const nextQuestion = () => {
        if (currentIndex + 1 >= questions.length) {
            finishTest(correctCount);
            return;
        }
        setCurrentIndex((i) => i + 1);
        setSelectedAnswer("");
        setSubmitted(false);
    };

    const handleMarkComplete = () => {
        setIsCompleting(true);
        markCategoryComplete(categoryId)
            .then((res) => {
                setStatus(res.data);
                onStatusChange?.(res.data);
                toast.success(t.grammar.categoryTest.markedComplete);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? t.grammar.categoryTest.failedMarkComplete))
            .finally(() => setIsCompleting(false));
    };

    const passed = status.passed;
    const total = Math.min(MAX_QUESTIONS, pool.length);
    const percent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    return (
        <section className="overflow-hidden rounded-3xl bg-card shadow-card">
            <div className="flex items-center justify-between gap-3 bg-primary/[0.07] px-6 py-5 sm:px-8">
                <h2 className="flex items-center gap-3 text-xl font-bold text-foreground">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <ClipboardCheck className="size-5" aria-hidden="true" />
                    </span>
                    {t.grammar.categoryTest.testTitle}
                </h2>
                {phase === "active" && <span className="text-sm font-medium text-foreground/55">{t.grammar.questionOf(currentIndex + 1, questions.length)}</span>}
            </div>

            <div className="p-6 sm:p-8">
                {phase === "idle" && (
                    <div className="space-y-6">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-accent/50 p-4">
                                <ListChecks className="size-5 text-primary" aria-hidden="true" />
                                <p className="mt-2 text-2xl font-extrabold tabular-nums text-foreground">{total}</p>
                                <p className="text-sm text-foreground/60">{t.grammar.categoryTest.questionsLabel}</p>
                            </div>
                            <div className="rounded-2xl bg-accent/50 p-4">
                                <Target className="size-5 text-primary" aria-hidden="true" />
                                <p className="mt-2 text-2xl font-extrabold tabular-nums text-foreground">{passThreshold}%</p>
                                <p className="text-sm text-foreground/60">{t.grammar.categoryTest.passMarkLabel}</p>
                            </div>
                            <div className={cn("rounded-2xl p-4", status.attempted ? (passed ? "bg-green-500/10" : "bg-red-500/10") : "bg-accent/50")}>
                                <Trophy className={cn("size-5", status.attempted ? (passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400") : "text-primary")} aria-hidden="true" />
                                <p className="mt-2 text-2xl font-extrabold tabular-nums text-foreground">{status.attempted ? `${status.score}/${status.total}` : "–"}</p>
                                <p className="text-sm text-foreground/60">
                                    {status.attempted ? (passed ? t.grammar.categoryTest.passedLabel : t.grammar.categoryTest.notPassedLabel) : t.grammar.categoryTest.yourScore}
                                    {status.completed ? t.grammar.categoryTest.completedSuffix : ""}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-foreground/65">{t.grammar.categoryTest.howItWorks}</p>
                        <button type="button" className={cn(quizPrimaryButton, "px-8 py-3 text-base")} onClick={beginTest}>
                            {status.attempted ? <RotateCw className="size-5" aria-hidden="true" /> : <Play className="size-5 fill-current" aria-hidden="true" />}
                            {status.attempted ? t.grammar.categoryTest.retakeTestPrompt : t.grammar.categoryTest.startTest}
                        </button>
                    </div>
                )}

                {phase === "active" && question && localized && (
                    <div dir={localized.dir}>
                        <div dir="ltr" className="flex flex-wrap items-center gap-2" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={questions.length}>
                            {questions.map((_, i) => {
                                const result = results[i];
                                const current = i === currentIndex;
                                const showResult = result !== undefined && (!current || submitted);
                                return (
                                    <span
                                        key={i}
                                        className={cn(
                                            "flex size-8 items-center justify-center rounded-full text-xs font-extrabold transition",
                                            showResult ? (result ? "bg-green-500 text-white" : "bg-red-500 text-white") : "border-2 border-dashed border-primary/40 text-primary",
                                            current && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                                        )}
                                    >
                                        {showResult ? result ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : <X className="size-4" strokeWidth={3} aria-hidden="true" /> : i + 1}
                                    </span>
                                );
                            })}
                        </div>

                        <div className="anim-fade-up mt-6" key={currentIndex}>
                            <GrammarQuestionView
                                question={question}
                                localized={localized}
                                selectedAnswer={selectedAnswer}
                                onSelect={setSelectedAnswer}
                                submitted={submitted}
                                correct={correct}
                                onEnter={submitAnswer}
                            />

                            <div className="mt-6 flex justify-end">
                                {submitted ? (
                                    <button type="button" className={quizPrimaryButton} onClick={nextQuestion}>
                                        {currentIndex + 1 >= questions.length ? t.grammar.seeResults : t.grammar.nextQuestion}
                                        <ArrowRight className="size-4" aria-hidden="true" />
                                    </button>
                                ) : (
                                    <button type="button" className={quizPrimaryButton} disabled={!selectedAnswer} onClick={submitAnswer}>
                                        {t.grammar.submitAnswer}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {phase === "results" && (
                    <div className="anim-fade-up space-y-6">
                        <div
                            className={cn(
                                "relative overflow-hidden rounded-3xl p-6 text-white shadow-md sm:p-8",
                                isSubmitting ? "bg-gradient-to-br from-primary to-primary/70" : passed ? "bg-gradient-to-br from-emerald-500 to-teal-400" : "bg-gradient-to-br from-rose-500 to-orange-400",
                            )}
                        >
                            <span aria-hidden="true" className="absolute -end-10 -top-12 size-44 rounded-full bg-white/10" />
                            <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-start">
                                <div className="shrink-0 rounded-full bg-card p-2 shadow-lg">
                                    <ScoreRing correct={correctCount} total={questions.length} strokeClass={passed ? "stroke-green-500" : "stroke-red-500"} />
                                </div>
                                <div>
                                    <p className="anim-pop text-3xl font-extrabold">
                                        {isSubmitting ? "…" : passed ? "🎉" : "💪"} {!isSubmitting && (passed ? t.grammar.categoryTest.passedLabel : t.grammar.categoryTest.notPassedLabel)}
                                    </p>
                                    <p className="mt-1 text-white/90">{t.grammar.resultsScore(correctCount, questions.length)}</p>
                                    {!isSubmitting && (
                                        <p className="mt-1 text-sm text-white/85">{passed ? t.grammar.categoryTest.passedNeeds(passThreshold) : t.grammar.categoryTest.notPassedNeeds(passThreshold)}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div dir="ltr">
                            <div className="relative h-3 rounded-full bg-foreground/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={t.grammar.categoryTest.yourScore}>
                                <div className={cn("h-full rounded-full transition-all duration-1000", passed ? "bg-green-500" : "bg-red-500")} style={{ width: `${percent}%` }} />
                                <span aria-hidden="true" className="absolute -top-1.5 h-6 w-0.5 rounded bg-foreground/60" style={{ left: `${passThreshold}%` }} />
                            </div>
                            <div className="relative mt-2 h-5 text-xs font-semibold text-foreground/60">
                                <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${Math.min(Math.max(passThreshold, 12), 88)}%` }}>
                                    {t.grammar.categoryTest.passMark(passThreshold)}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button type="button" className={quizSecondaryButton} onClick={beginTest}>
                                <RotateCw className="size-4" aria-hidden="true" />
                                {t.grammar.categoryTest.retakeTest}
                            </button>
                            {passed && !status.completed && (
                                <button type="button" className={quizPrimaryButton} disabled={isCompleting || isSubmitting} onClick={handleMarkComplete}>
                                    <CheckCircle2 className="size-4" aria-hidden="true" />
                                    {isCompleting ? t.grammar.saving : t.grammar.categoryTest.markAsComplete}
                                </button>
                            )}
                            {status.completed && (
                                <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-700 dark:text-green-400">
                                    <CheckCircle2 className="size-4" aria-hidden="true" />
                                    {t.grammar.categoryTest.completedBadge}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
