"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { QuizQuestion } from "@/types/grammar";
import { getExerciseProgress, saveExerciseAnswer, resetExerciseProgress } from "@/services/exerciseProgressService";
import { useQueryClient } from "@tanstack/react-query";
import { setLearningProgress } from "@/services/grammarService";
import { markLessonLearnedInCache } from "@/lib/grammarQueryCache";
import { ArrowRight, Check, Dumbbell, Play, RotateCw, X } from "lucide-react";
import CircularProgress from "@/componenets/CircularProgress";
import { cn } from "@/lib/utils";
import { useI18n } from "@/componenets/I18nProvider";
import { localizedQuestionText } from "@/lib/grammarLocalization";
import { AppLanguage } from "@/lib/i18n/translations";
import { InlineMarkdown } from "@/componenets/LessonMarkdown";

type QuizPhase = "idle" | "active" | "results";

function normalize(value: string): string {
    return value.trim().toLowerCase();
}

function isCorrect(question: QuizQuestion, selected: string): boolean {
    if (typeof question.answer === "boolean") {
        return normalize(selected) === (question.answer ? "true" : "false");
    }
    return normalize(selected) === normalize(question.answer);
}

const questionKey = (lessonId: string, index: number) => `${lessonId}:${index}`;

export default function GrammarQuizSection({
    quiz,
    lessonId,
    lessonLevel,
    language,
    autoStart = false,
}: Readonly<{
    quiz: QuizQuestion[];
    lessonId: string;
    lessonLevel: string;
    language: AppLanguage;
    autoStart?: boolean;
}>) {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [phase, setPhase] = useState<QuizPhase>("idle");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [answered, setAnswered] = useState<Record<string, boolean>>({});
    const [progressLoaded, setProgressLoaded] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    // Resumable, persisted per-question progress - shared with the same backend records the old
    // standalone Exercises page used, keyed "<lessonId>:<questionIndex>".
    useEffect(() => {
        getExerciseProgress()
            .then((res) => {
                const map: Record<string, boolean> = {};
                res.data
                    .filter((a) => a.questionKey.startsWith(`${lessonId}:`))
                    .forEach((a) => {
                        map[a.questionKey] = a.correct;
                    });
                setAnswered(map);
            })
            .catch(() => {
                /* best-effort - treat as no saved progress */
            })
            .finally(() => setProgressLoaded(true));
    }, [lessonId]);

    const answeredCount = quiz.filter((_, i) => answered[questionKey(lessonId, i)] !== undefined).length;
    const allAnswered = quiz.length > 0 && answeredCount === quiz.length;

    const beginQuiz = () => {
        const firstUnanswered = quiz.findIndex((_, i) => answered[questionKey(lessonId, i)] === undefined);
        setCurrentIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
        setSelectedAnswer("");
        setSubmitted(false);
        setCorrectCount(quiz.filter((_, i) => answered[questionKey(lessonId, i)]).length);
        setPhase("active");
    };

    const retryQuiz = () => {
        const keys = quiz.map((_, i) => questionKey(lessonId, i));
        resetExerciseProgress(keys)
            .then(() => {
                setAnswered((prev) => {
                    const copy = { ...prev };
                    keys.forEach((k) => delete copy[k]);
                    return copy;
                });
                setCurrentIndex(0);
                setSelectedAnswer("");
                setSubmitted(false);
                setCorrectCount(0);
                setPhase("active");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to reset progress."));
    };

    // Once saved progress has loaded: jump straight to results if every question was already
    // answered, or auto-start (resuming from the first unanswered question) when this section is
    // embedded on a page meant to open directly into practice mode.
    useEffect(() => {
        if (!progressLoaded) return;
        if (allAnswered) {
            setCorrectCount(quiz.filter((_, i) => answered[questionKey(lessonId, i)]).length);
            setPhase("results");
        } else if (autoStart && quiz.length > 0) {
            beginQuiz();
            sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progressLoaded]);

    if (quiz.length === 0) return null;

    const question = quiz[currentIndex];
    const localizedQuestion = localizedQuestionText(question, lessonLevel, language);
    const correct = submitted && isCorrect(question, selectedAnswer);

    const submitAnswer = () => {
        setSubmitted(true);
        const wasCorrect = isCorrect(question, selectedAnswer);
        if (wasCorrect) {
            setCorrectCount((c) => c + 1);
        }
        const key = questionKey(lessonId, currentIndex);
        setAnswered((prev) => ({ ...prev, [key]: wasCorrect }));
        saveExerciseAnswer({ questionKey: key, correct: wasCorrect }).catch(() => {
            toast.error("Couldn't save your progress for this question.");
        });
    };

    const nextQuestion = () => {
        if (currentIndex + 1 >= quiz.length) {
            setPhase("results");
            // `answered` already reflects this question's result - submitAnswer() always runs
            // (and commits its setAnswered update) before the user can reach the "Finish" click.
            const allCorrect = quiz.every((_, i) => answered[questionKey(lessonId, i)]);
            if (allCorrect) {
                setLearningProgress({ lessonId, learned: true })
                    .then(() => markLessonLearnedInCache(queryClient, lessonId, true))
                    .catch(() => {
                        /* best-effort */
                    });
            }
            return;
        }
        setCurrentIndex((i) => i + 1);
        setSelectedAnswer("");
        setSubmitted(false);
    };

    const primaryButton =
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-50";
    const secondaryButton =
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

    // Option tiles: neutral until picked, then green / red once the answer is submitted.
    const optionClass = (isSelected: boolean, isRightOption: boolean) =>
        cn(
            "flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm text-foreground transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default",
            !submitted && !isSelected && "border-border/60 bg-background hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/50 hover:shadow-card",
            !submitted && isSelected && "border-primary bg-primary/10",
            submitted && isRightOption && "border-green-500 bg-green-500/10",
            submitted && isSelected && !isRightOption && "border-red-500 bg-red-500/10",
            submitted && !isSelected && !isRightOption && "border-border/40 opacity-55",
        );
    const optionBadge = (label: ReactNode, isSelected: boolean, isRightOption: boolean) => (
        <span
            aria-hidden="true"
            className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                submitted && isRightOption ? "bg-green-500 text-white" : submitted && isSelected ? "bg-red-500 text-white" : isSelected ? "bg-primary text-primary-foreground" : "bg-accent text-primary",
            )}
        >
            {submitted && isRightOption ? <Check className="size-4" strokeWidth={3} /> : submitted && isSelected ? <X className="size-4" strokeWidth={3} /> : label}
        </span>
    );

    return (
        <section ref={sectionRef} className="rounded-[10px] bg-card p-6 shadow-card sm:p-8">
            <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-3 text-xl font-bold text-foreground">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                        <Dumbbell className="size-5 text-primary" aria-hidden="true" />
                    </span>
                    {t.grammar.exercises}
                </h2>
                {phase === "active" && <span className="text-sm font-medium text-foreground/55">{t.grammar.questionOf(currentIndex + 1, quiz.length)}</span>}
            </div>

            {phase === "idle" && (
                <div className="mt-5 space-y-4">
                    <p className="text-sm text-foreground/65">
                        {answeredCount > 0
                            ? `${answeredCount} / ${quiz.length} questions answered - pick up where you left off.`
                            : t.grammar.checkUnderstanding(quiz.length)}
                    </p>
                    <button type="button" className={primaryButton} onClick={beginQuiz}>
                        <Play className="size-4 fill-current" aria-hidden="true" />
                        {answeredCount > 0 ? "Continue exercises" : t.grammar.startExercises}
                    </button>
                </div>
            )}

            {phase === "active" && (
                <div className="mt-5" dir={localizedQuestion.dir}>
                    <div className="flex gap-1.5" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={quiz.length}>
                        {quiz.map((_, i) => {
                            const result = answered[questionKey(lessonId, i)];
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
                        {localizedQuestion.title && (
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                                <InlineMarkdown content={localizedQuestion.title} autoDir />
                            </p>
                        )}
                        <p className="mt-2 text-lg font-semibold leading-relaxed text-foreground sm:text-xl">
                            <InlineMarkdown content={localizedQuestion.question} autoDir />
                        </p>

                        {question.type === "mcq" && (
                            <div className="mt-5 space-y-2.5">
                                {(question.options ?? []).map((option, i) => {
                                    const isSelected = selectedAnswer === option;
                                    const isRightOption = isCorrect(question, option);
                                    return (
                                        <button key={option} type="button" disabled={submitted} onClick={() => setSelectedAnswer(option)} className={optionClass(isSelected, isRightOption)}>
                                            {optionBadge(String.fromCharCode(65 + i), isSelected, isRightOption)}
                                            <span className="min-w-0 flex-1 break-words">
                                                <InlineMarkdown content={option} autoDir />
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {question.type === "truefalse" && (
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                {[
                                    { value: "True", label: t.grammar.true },
                                    { value: "False", label: t.grammar.false },
                                ].map((option) => {
                                    const isSelected = selectedAnswer === option.value;
                                    const isRightOption = isCorrect(question, option.value);
                                    return (
                                        <button key={option.value} type="button" disabled={submitted} onClick={() => setSelectedAnswer(option.value)} className={cn(optionClass(isSelected, isRightOption), "justify-center py-4 text-base font-semibold")}>
                                            {optionBadge(option.value === "True" ? <Check className="size-4" strokeWidth={3} /> : <X className="size-4" strokeWidth={3} />, isSelected, isRightOption)}
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {question.type === "fill" && (
                            <input
                                type="text"
                                value={selectedAnswer}
                                disabled={submitted}
                                onChange={(e) => setSelectedAnswer(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && selectedAnswer && !submitted) submitAnswer();
                                }}
                                placeholder={t.grammar.typeAnswer}
                                className={cn(
                                    "mt-5 w-full rounded-2xl border bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-foreground/40 focus:ring-2 focus:ring-primary/40 disabled:opacity-80",
                                    submitted ? (correct ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10") : "border-border/60 focus:border-primary",
                                )}
                            />
                        )}

                        {submitted && (
                            <div
                                className={cn(
                                    "mt-5 flex items-start gap-3 rounded-2xl p-4 text-sm",
                                    correct ? "bg-green-500/10 text-green-800 dark:text-green-300" : "bg-red-500/10 text-red-800 dark:text-red-300",
                                )}
                            >
                                <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-white", correct ? "bg-green-500" : "bg-red-500")} aria-hidden="true">
                                    {correct ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
                                </span>
                                <div>
                                    <p className="font-semibold">{correct ? t.grammar.correct : t.grammar.incorrect}</p>
                                    {!correct && (
                                        <p className="mt-0.5">
                                            {t.grammar.correctAnswer}
                                            <span className="font-semibold">
                                                {typeof question.answer === "boolean" ? (question.answer ? t.grammar.true : t.grammar.false) : <InlineMarkdown content={question.answer} autoDir />}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            {submitted ? (
                                <button type="button" className={primaryButton} onClick={nextQuestion}>
                                    {currentIndex + 1 >= quiz.length ? t.grammar.seeResults : t.grammar.nextQuestion}
                                    <ArrowRight className="size-4" aria-hidden="true" />
                                </button>
                            ) : (
                                <button type="button" className={primaryButton} disabled={!selectedAnswer} onClick={submitAnswer}>
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
                        <CircularProgress value={quiz.length > 0 ? (correctCount / quiz.length) * 100 : 0} size={120} color="hsl(216 100% 62%)" trackColor="hsl(0 0% 50% / 0.15)" />
                        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground">
                            {correctCount}/{quiz.length}
                        </span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">{t.grammar.resultsScore(correctCount, quiz.length)}</p>
                    <button type="button" className={secondaryButton} onClick={retryQuiz}>
                        <RotateCw className="size-4" aria-hidden="true" />
                        {t.grammar.retry}
                    </button>
                </div>
            )}
        </section>
    );
}
