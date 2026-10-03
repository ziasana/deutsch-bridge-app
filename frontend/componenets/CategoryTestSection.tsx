"use client";

import { useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { submitCategoryTest, markCategoryComplete } from "@/services/grammarService";
import { CategoryTestStatus, GrammarLesson, QuizQuestion } from "@/types/grammar";
import { localizedQuestionText } from "@/lib/grammarLocalization";
import { AppLanguage } from "@/lib/i18n/translations";
import { useI18n } from "@/componenets/I18nProvider";
import GrammarQuestionView, { isCorrectAnswer, quizPrimaryButton, quizSecondaryButton } from "@/componenets/GrammarQuestionView";
import CircularProgress from "@/componenets/CircularProgress";
import { isPlayableQuestion } from "@/lib/grammarQuiz";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, ClipboardCheck, Play, RotateCw } from "lucide-react";

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

    return (
        <section>
            <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 text-xl font-bold text-foreground">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                        <ClipboardCheck className="size-5 text-primary" aria-hidden="true" />
                    </span>
                    {t.grammar.takeCategoryTest}
                </h2>
                {phase === "active" && <span className="text-sm font-medium text-foreground/55">{t.grammar.questionOf(currentIndex + 1, questions.length)}</span>}
            </div>

            {phase === "idle" && (
                <div className="mt-5 space-y-4">
                    {status.attempted && (
                        <p className="text-sm text-foreground/70">
                            {t.grammar.categoryTest.lastAttempt(status.score, status.total)}{" "}
                            <span className={cn("font-semibold", passed ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>
                                {passed ? t.grammar.categoryTest.passedLabel : t.grammar.categoryTest.notPassedLabel}
                            </span>
                            {status.completed ? t.grammar.categoryTest.completedSuffix : ""}
                        </p>
                    )}
                    <p className="text-sm text-foreground/65">
                        {t.grammar.categoryTest.questionsFromLessons(Math.min(MAX_QUESTIONS, pool.length), passThreshold)}
                    </p>
                    <button type="button" className={quizPrimaryButton} onClick={beginTest}>
                        {status.attempted ? <RotateCw className="size-4" aria-hidden="true" /> : <Play className="size-4 fill-current" aria-hidden="true" />}
                        {status.attempted ? t.grammar.categoryTest.retakeTestPrompt : t.grammar.categoryTest.startTest}
                    </button>
                </div>
            )}

            {phase === "active" && question && localized && (
                <div className="mt-5" dir={localized.dir}>
                    <div className="flex gap-1.5" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={questions.length}>
                        {questions.map((_, i) => {
                            const result = results[i];
                            return (
                                <span
                                    key={i}
                                    className={cn(
                                        "h-1.5 flex-1 rounded-full transition-colors",
                                        i === currentIndex && !submitted && "bg-primary",
                                        (i !== currentIndex || submitted) && result === true && "bg-green-500",
                                        (i !== currentIndex || submitted) && result === false && "bg-red-500",
                                        i !== currentIndex && result === undefined && "bg-foreground/10",
                                    )}
                                />
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
                <div className="anim-fade-up mt-6 flex flex-col items-center gap-5 text-center">
                    <div className="relative">
                        <CircularProgress
                            value={questions.length > 0 ? (correctCount / questions.length) * 100 : 0}
                            size={120}
                            color={isSubmitting || passed ? "hsl(216 100% 62%)" : "hsl(0 84% 60%)"}
                            trackColor="hsl(0 0% 50% / 0.15)"
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground">
                            {correctCount}/{questions.length}
                        </span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">{t.grammar.resultsScore(correctCount, questions.length)}</p>
                    {!isSubmitting && (
                        <p className={cn("text-sm font-medium", passed ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>
                            {passed ? t.grammar.categoryTest.passedNeeds(passThreshold) : t.grammar.categoryTest.notPassedNeeds(passThreshold)}
                        </p>
                    )}
                    <div className="flex flex-wrap justify-center gap-3">
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
        </section>
    );
}
