"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { QuizQuestion } from "@/types/grammar";
import { getExerciseProgress, saveExerciseAnswer, resetExerciseProgress } from "@/services/exerciseProgressService";
import { setLearningProgress } from "@/services/grammarService";
import Button from "@/componenets/Button";
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
                setLearningProgress({ lessonId, learned: true }).catch(() => {
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
        <div ref={sectionRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.grammar.exercises}</h2>

            {phase === "idle" && (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {answeredCount > 0
                            ? `${answeredCount} / ${quiz.length} questions answered - pick up where you left off.`
                            : t.grammar.checkUnderstanding(quiz.length)}
                    </p>
                    <Button variant="primary" className="text-sm px-4 py-2" onClick={beginQuiz}>
                        {answeredCount > 0 ? "Continue exercises" : t.grammar.startExercises}
                    </Button>
                </div>
            )}

            {phase === "active" && (
                <div className="space-y-3" dir={localizedQuestion.dir}>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t.grammar.questionOf(currentIndex + 1, quiz.length)}
                    </p>
                    {localizedQuestion.title && (
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                            <InlineMarkdown content={localizedQuestion.title} autoDir />
                        </p>
                    )}
                    <p className="font-medium text-gray-900 dark:text-white">
                        <InlineMarkdown content={localizedQuestion.question} autoDir />
                    </p>

                    {question.type === "mcq" && (
                        <div className="space-y-2">
                            {(question.options ?? []).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    disabled={submitted}
                                    onClick={() => setSelectedAnswer(option)}
                                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${
                                        selectedAnswer === option
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                            : "border-gray-300 dark:border-gray-600"
                                    }`}
                                >
                                    <InlineMarkdown content={option} autoDir />
                                </button>
                            ))}
                        </div>
                    )}

                    {question.type === "truefalse" && (
                        <div className="flex gap-2">
                            {[
                                { value: "True", label: t.grammar.true },
                                { value: "False", label: t.grammar.false },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    disabled={submitted}
                                    onClick={() => setSelectedAnswer(option.value)}
                                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                                        selectedAnswer === option.value
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                            : "border-gray-300 dark:border-gray-600"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {question.type === "fill" && (
                        <input
                            type="text"
                            value={selectedAnswer}
                            disabled={submitted}
                            onChange={(e) => setSelectedAnswer(e.target.value)}
                            placeholder={t.grammar.typeAnswer}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                    )}

                    {submitted && (
                        <div
                            className={`rounded-lg p-3 text-sm ${
                                correct
                                    ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                    : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                            }`}
                        >
                            <p className="font-semibold">{correct ? t.grammar.correct : t.grammar.incorrect}</p>
                            {!correct && (
                                <p>
                                    {t.grammar.correctAnswer}
                                    <span className="font-medium">
                                        {typeof question.answer === "boolean" ? (
                                            question.answer ? (
                                                t.grammar.true
                                            ) : (
                                                t.grammar.false
                                            )
                                        ) : (
                                            <InlineMarkdown content={question.answer} autoDir />
                                        )}
                                    </span>
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        {submitted ? (
                            <Button variant="primary" className="text-sm px-4 py-2" onClick={nextQuestion}>
                                {currentIndex + 1 >= quiz.length ? t.grammar.seeResults : t.grammar.nextQuestion}
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                className="text-sm px-4 py-2"
                                disabled={!selectedAnswer}
                                onClick={submitAnswer}
                            >
                                {t.grammar.submitAnswer}
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {phase === "results" && (
                <div className="space-y-3">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t.grammar.resultsScore(correctCount, quiz.length)}
                    </p>
                    <Button variant="secondary" className="text-sm px-4 py-2" onClick={retryQuiz}>
                        {t.grammar.retry}
                    </Button>
                </div>
            )}
        </div>
    );
}
