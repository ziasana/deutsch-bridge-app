"use client";

import { useState } from "react";
import { ArrowRight, Check, Dumbbell, Play, RotateCw, X } from "lucide-react";
import GrammarQuestionView, { isCorrectAnswer, quizPrimaryButton, quizSecondaryButton } from "@/componenets/GrammarQuestionView";
import { useI18n } from "@/componenets/I18nProvider";
import ScoreRing from "@/componenets/learning/ScoreRing";
import { localizedQuestionText } from "@/lib/grammarLocalization";
import type { AppLanguage } from "@/lib/i18n/translations";
import type { QuizQuestion } from "@/types/grammar";
import { cn } from "@/lib/utils";

type Phase = "idle" | "active" | "results";

/**
 * The lesson's exercises as in the dashboard (same question view, step dots and score ring), without saving anything:
 * a visitor has no account, so the result lives only on this page.
 */
export default function PublicGrammarQuiz({ quiz, lessonLevel, language }: Readonly<{ quiz: QuizQuestion[]; lessonLevel: string; language: AppLanguage }>) {
    const { t } = useI18n();
    const [phase, setPhase] = useState<Phase>("idle");
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [results, setResults] = useState<Record<number, boolean>>({});

    if (quiz.length === 0) return null;

    const question = quiz[index];
    const localized = localizedQuestionText(question, lessonLevel, language);
    const correct = submitted && isCorrectAnswer(question, selected);
    const correctCount = Object.values(results).filter(Boolean).length;

    const begin = () => {
        setIndex(0);
        setSelected("");
        setSubmitted(false);
        setResults({});
        setPhase("active");
    };
    const submit = () => {
        setSubmitted(true);
        setResults((r) => ({ ...r, [index]: isCorrectAnswer(question, selected) }));
    };
    const next = () => {
        if (index + 1 >= quiz.length) {
            setPhase("results");
            return;
        }
        setIndex(index + 1);
        setSelected("");
        setSubmitted(false);
    };

    return (
        <section id="step-practice" className="scroll-mt-24 overflow-hidden rounded-3xl bg-card shadow-card">
            <div className="flex items-center justify-between gap-3 bg-primary/[0.07] px-6 py-5 sm:px-8">
                <h2 className="flex items-center gap-3 text-xl font-bold text-foreground">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                        <Dumbbell className="size-5 text-primary" aria-hidden="true" />
                    </span>
                    {t.grammar.exercises}
                </h2>
                {phase === "active" && <span className="text-sm font-medium text-foreground/55">{t.grammar.questionOf(index + 1, quiz.length)}</span>}
            </div>

            <div className="p-6 sm:p-8">
                {phase === "idle" && (
                    <div className="space-y-4">
                        <p className="text-sm text-foreground/65">{t.grammar.checkUnderstanding(quiz.length)}</p>
                        <button type="button" className={quizPrimaryButton} onClick={begin}>
                            <Play className="size-4 fill-current" aria-hidden="true" />
                            {t.grammar.startExercises}
                        </button>
                    </div>
                )}

                {phase === "active" && (
                    <div dir={localized.dir}>
                        <div dir="ltr" className="flex flex-wrap items-center gap-2" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={quiz.length}>
                            {quiz.map((_, i) => {
                                const result = results[i];
                                const current = i === index;
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

                        <div className="anim-fade-up mt-6" key={index}>
                            <GrammarQuestionView question={question} localized={localized} selectedAnswer={selected} onSelect={setSelected} submitted={submitted} correct={correct} onEnter={submit} />
                            <div className="mt-6 flex justify-end">
                                {submitted ? (
                                    <button type="button" className={quizPrimaryButton} onClick={next}>
                                        {index + 1 >= quiz.length ? t.grammar.seeResults : t.grammar.nextQuestion}
                                        <ArrowRight className="size-4" aria-hidden="true" />
                                    </button>
                                ) : (
                                    <button type="button" className={quizPrimaryButton} disabled={!selected} onClick={submit}>
                                        {t.grammar.submitAnswer}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {phase === "results" && (
                    <div className="anim-fade-up flex flex-col items-center gap-5 text-center">
                        <p className="anim-pop text-5xl" aria-hidden="true">
                            {correctCount === quiz.length ? "🏆" : correctCount / quiz.length >= 0.6 ? "🎉" : "💪"}
                        </p>
                        <ScoreRing correct={correctCount} total={quiz.length} />
                        <p className="text-lg font-semibold text-foreground">{t.grammar.resultsScore(correctCount, quiz.length)}</p>
                        <button type="button" className={quizSecondaryButton} onClick={begin}>
                            <RotateCw className="size-4" aria-hidden="true" />
                            {t.grammar.retry}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
