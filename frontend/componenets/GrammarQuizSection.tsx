"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { QuizQuestion } from "@/types/grammar";
import { getExerciseProgress, saveExerciseAnswer, resetExerciseProgress } from "@/services/exerciseProgressService";
import { useQueryClient } from "@tanstack/react-query";
import { setLearningProgress } from "@/services/grammarService";
import { markLessonLearnedInCache } from "@/lib/grammarQueryCache";
import { ArrowRight, Dumbbell, Play, RotateCw } from "lucide-react";
import CircularProgress from "@/componenets/CircularProgress";
import { cn } from "@/lib/utils";
import { useI18n } from "@/componenets/I18nProvider";
import { localizedQuestionText } from "@/lib/grammarLocalization";
import { AppLanguage } from "@/lib/i18n/translations";
import GrammarQuestionView, { isCorrectAnswer, quizPrimaryButton, quizSecondaryButton } from "@/componenets/GrammarQuestionView";

type QuizPhase = "idle" | "active" | "results";

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
    const correct = submitted && isCorrectAnswer(question, selectedAnswer);

    const submitAnswer = () => {
        setSubmitted(true);
        const wasCorrect = isCorrectAnswer(question, selectedAnswer);
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
                    <button type="button" className={quizPrimaryButton} onClick={beginQuiz}>
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
                        <GrammarQuestionView
                            question={question}
                            localized={localizedQuestion}
                            selectedAnswer={selectedAnswer}
                            onSelect={setSelectedAnswer}
                            submitted={submitted}
                            correct={correct}
                            onEnter={submitAnswer}
                        />

                        <div className="mt-6 flex justify-end">
                            {submitted ? (
                                <button type="button" className={quizPrimaryButton} onClick={nextQuestion}>
                                    {currentIndex + 1 >= quiz.length ? t.grammar.seeResults : t.grammar.nextQuestion}
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
                        <CircularProgress value={quiz.length > 0 ? (correctCount / quiz.length) * 100 : 0} size={120} color="hsl(216 100% 62%)" trackColor="hsl(0 0% 50% / 0.15)" />
                        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground">
                            {correctCount}/{quiz.length}
                        </span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">{t.grammar.resultsScore(correctCount, quiz.length)}</p>
                    <button type="button" className={quizSecondaryButton} onClick={retryQuiz}>
                        <RotateCw className="size-4" aria-hidden="true" />
                        {t.grammar.retry}
                    </button>
                </div>
            )}
        </section>
    );
}
