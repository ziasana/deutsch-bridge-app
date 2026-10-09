"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { QuizQuestion } from "@/types/grammar";
import { getExerciseProgress, saveExerciseAnswer, resetExerciseProgress } from "@/services/exerciseProgressService";
import { useQueryClient } from "@tanstack/react-query";
import { setLearningProgress } from "@/services/grammarService";
import { markLessonLearnedInCache } from "@/lib/grammarQueryCache";
import { ArrowRight, Check, Dumbbell, Play, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import ScoreRing from "@/componenets/learning/ScoreRing";
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
        <section id="step-practice" ref={sectionRef} className="scroll-mt-24 overflow-hidden rounded-3xl bg-card shadow-card">
            <div className="flex items-center justify-between gap-3 bg-primary/[0.07] px-6 py-5 sm:px-8">
                <h2 className="flex items-center gap-3 text-xl font-bold text-foreground">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                        <Dumbbell className="size-5 text-primary" aria-hidden="true" />
                    </span>
                    {t.grammar.exercises}
                </h2>
                {phase === "active" && <span className="text-sm font-medium text-foreground/55">{t.grammar.questionOf(currentIndex + 1, quiz.length)}</span>}
            </div>

            <div className="p-6 sm:p-8">
            {phase === "idle" && (
                <div className="space-y-4">
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
                <div dir={localizedQuestion.dir}>
                    <div dir="ltr" className="flex flex-wrap items-center gap-2" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={quiz.length}>
                        {quiz.map((_, i) => {
                            const result = answered[questionKey(lessonId, i)];
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
                <div className="anim-fade-up flex flex-col items-center gap-5 text-center">
                    <p className="anim-pop text-5xl" aria-hidden="true">{correctCount === quiz.length ? "🏆" : correctCount / quiz.length >= 0.6 ? "🎉" : "💪"}</p>
                    <ScoreRing correct={correctCount} total={quiz.length} />
                    <p className="text-lg font-semibold text-foreground">{t.grammar.resultsScore(correctCount, quiz.length)}</p>
                    <button type="button" className={quizSecondaryButton} onClick={retryQuiz}>
                        <RotateCw className="size-4" aria-hidden="true" />
                        {t.grammar.retry}
                    </button>
                </div>
            )}
            </div>
        </section>
    );
}
