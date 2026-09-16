"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { submitCategoryTest, markCategoryComplete } from "@/services/grammarService";
import { CategoryTestStatus, GrammarLesson, QuizQuestion } from "@/types/grammar";
import Button from "@/componenets/Button";
import { localizedQuestionText } from "@/lib/grammarLocalization";
import { AppLanguage } from "@/lib/i18n/translations";

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

function normalize(value: string): string {
    return value.trim().toLowerCase();
}

function isCorrect(question: QuizQuestion, selected: string): boolean {
    if (typeof question.answer === "boolean") {
        return normalize(selected) === (question.answer ? "true" : "false");
    }
    return normalize(selected) === normalize(question.answer);
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
        () => lessons.flatMap((l) => (l.quiz ?? []).map((q) => ({ ...q, lessonId: l.id }))),
        [lessons]
    );

    const [phase, setPhase] = useState<Phase>("idle");
    const [questions, setQuestions] = useState<PooledQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [status, setStatus] = useState<CategoryTestStatus>(initialStatus);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);

    if (pool.length === 0) {
        return (
            <p className="text-sm text-gray-500 dark:text-gray-400">
                No exercises available yet in this category&apos;s lessons.
            </p>
        );
    }

    const beginTest = () => {
        const picked = shuffle(pool).slice(0, Math.min(MAX_QUESTIONS, pool.length));
        setQuestions(picked);
        setCurrentIndex(0);
        setSelectedAnswer("");
        setSubmitted(false);
        setCorrectCount(0);
        setPhase("active");
    };

    const question = questions[currentIndex];
    const localized = question ? localizedQuestionText(question, level, language) : null;
    const correct = submitted && question ? isCorrect(question, selectedAnswer) : false;

    const submitAnswer = () => {
        if (!question) return;
        setSubmitted(true);
        if (isCorrect(question, selectedAnswer)) {
            setCorrectCount((c) => c + 1);
        }
    };

    const finishTest = (finalCorrect: number) => {
        setPhase("results");
        setIsSubmitting(true);
        submitCategoryTest(categoryId, { score: finalCorrect, total: questions.length })
            .then((res) => {
                setStatus(res.data);
                onStatusChange?.(res.data);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save your test result."))
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
                toast.success("Category marked as complete!");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to mark this category complete."))
            .finally(() => setIsCompleting(false));
    };

    return (
        <div className="space-y-3">
            {phase === "idle" && (
                <div className="space-y-2">
                    {status.attempted && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Last attempt: {status.score} / {status.total} —{" "}
                            {status.passed ? "Passed" : "Not passed"}
                            {status.completed ? " · Completed" : ""}
                        </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.min(MAX_QUESTIONS, pool.length)} random question
                        {Math.min(MAX_QUESTIONS, pool.length) > 1 ? "s" : ""} from this category&apos;s lessons. Needs{" "}
                        {passThreshold}% to pass.
                    </p>
                    <Button variant="primary" className="text-sm px-4 py-2" onClick={beginTest}>
                        {status.attempted ? "Retake category test" : "Start category test"}
                    </Button>
                </div>
            )}

            {phase === "active" && question && (
                <div className="space-y-3" dir={localized?.dir}>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Question {currentIndex + 1} of {questions.length}
                    </p>
                    {localized?.title && (
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{localized.title}</p>
                    )}
                    <p className="font-medium text-gray-900 dark:text-white">{localized?.question}</p>

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
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}

                    {question.type === "truefalse" && (
                        <div className="flex gap-2">
                            {[
                                { value: "True", label: "True" },
                                { value: "False", label: "False" },
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
                            placeholder="Type your answer"
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
                            <p className="font-semibold">{correct ? "Correct!" : "Not quite."}</p>
                            {!correct && (
                                <p>
                                    Correct answer:{" "}
                                    <span className="font-medium">
                                        {typeof question.answer === "boolean"
                                            ? question.answer
                                                ? "True"
                                                : "False"
                                            : question.answer}
                                    </span>
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        {submitted ? (
                            <Button variant="primary" className="text-sm px-4 py-2" onClick={nextQuestion}>
                                {currentIndex + 1 >= questions.length ? "See results" : "Next question"}
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                className="text-sm px-4 py-2"
                                disabled={!selectedAnswer}
                                onClick={submitAnswer}
                            >
                                Submit answer
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {phase === "results" && (
                <div className="space-y-3">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {correctCount} / {questions.length} correct
                    </p>
                    {!isSubmitting && (
                        <p
                            className={`text-sm font-medium ${
                                status.passed
                                    ? "text-green-700 dark:text-green-300"
                                    : "text-red-700 dark:text-red-300"
                            }`}
                        >
                            {status.passed
                                ? `Passed! (needs ${passThreshold}%)`
                                : `Not passed yet — needs ${passThreshold}% to pass.`}
                        </p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                        <Button variant="secondary" className="text-sm px-4 py-2" onClick={beginTest}>
                            Retake test
                        </Button>
                        {status.passed && !status.completed && (
                            <Button
                                variant="primary"
                                className="text-sm px-4 py-2"
                                disabled={isCompleting || isSubmitting}
                                onClick={handleMarkComplete}
                            >
                                {isCompleting ? "Saving..." : "Mark as complete"}
                            </Button>
                        )}
                        {status.completed && (
                            <span className="text-sm px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 font-medium">
                                ✓ Completed
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
