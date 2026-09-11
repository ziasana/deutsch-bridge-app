"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import { getExamExerciseById } from "@/services/examService";
import { completeExamAttempt, startExamAttempt, submitExamAnswer } from "@/services/examAttemptService";
import {
    ExamAnswerFeedbackResponse,
    ExamAnswerRecord,
    ExamExercisePublicResponse,
    ExamPassagePublic,
    ExamQuestionPublic,
} from "@/types/exam";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import Button from "@/componenets/Button";

const TFN_OPTIONS = [
    { value: "RICHTIG", label: "Richtig" },
    { value: "FALSCH", label: "Falsch" },
    { value: "NICHT_IM_TEXT", label: "Nicht im Text" },
];

const letterFor = (index: number) => String.fromCharCode(97 + index);

function HeadlinesView({ answerOptions }: Readonly<{ answerOptions: string[] }>) {
    if (answerOptions.length === 0) return null;
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Überschriften — nicht jede passt zu einem Text:
            </p>
            <ul className="space-y-2">
                {answerOptions.map((headline, idx) => (
                    <li key={headline} className="text-sm text-gray-800 dark:text-gray-200">
                        <span className="font-semibold">{letterFor(idx)})</span> {headline}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function PassagesView({ passages, taskType }: Readonly<{ passages: ExamPassagePublic[]; taskType: string }>) {
    if (passages.length === 0) return null;

    if (taskType === "MULTIPLE_CHOICE") {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-2">
                {passages.map((p) => (
                    <p key={p.id} className="text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                        {p.content}
                    </p>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {passages.map((p) => (
                <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">{p.label}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{p.content}</p>
                </div>
            ))}
        </div>
    );
}

function FeedbackCard({ feedback }: Readonly<{ feedback: ExamAnswerFeedbackResponse }>) {
    return (
        <div
            className={`rounded-lg p-3 text-sm space-y-1 ${
                feedback.correct
                    ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                    : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200"
            }`}
        >
            <p className="font-semibold">{feedback.correct ? "Richtig!" : "Leider falsch."}</p>
            {!feedback.correct && (
                <p>
                    Richtige Antwort: <span className="font-medium">{feedback.correctAnswer}</span>
                </p>
            )}
            {feedback.explanation && <p className="mt-1">💡 {feedback.explanation}</p>}
            {feedback.commonMistake && <p className="mt-1 italic">⚠️ Häufiger Fehler: {feedback.commonMistake}</p>}
        </div>
    );
}

interface QuizState {
    attemptId: string;
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    answerOptions: string[];
    currentIndex: number;
    selectedAnswer: string;
    feedback: ExamAnswerFeedbackResponse | null;
    submitting: boolean;
}

interface ResultsState {
    score: number;
    breakdown: ExamAnswerRecord[];
}

function QuestionInput({
    question,
    answerOptions,
    taskType,
    selectedAnswer,
    disabled,
    onSelect,
}: Readonly<{
    question: ExamQuestionPublic;
    answerOptions: string[];
    taskType: string;
    selectedAnswer: string;
    disabled: boolean;
    onSelect: (value: string) => void;
}>) {
    const options =
        taskType === "TRUE_FALSE_NOT_GIVEN"
            ? TFN_OPTIONS
            : taskType === "MATCHING"
                ? answerOptions.map((o, idx) => ({ value: o, label: `${letterFor(idx)}) ${o}` }))
                : (question.options ?? []).map((o) => ({ value: o, label: o }));

    return (
        <div className="space-y-2">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${
                        selectedAnswer === option.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                            : "border-gray-300 dark:border-gray-600"
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

function ExerciseQuiz({ exercise }: Readonly<{ exercise: ExamExercisePublicResponse }>) {
    const [quiz, setQuiz] = useState<QuizState | null>(null);
    const [results, setResults] = useState<ResultsState | null>(null);
    const [starting, setStarting] = useState(false);

    const beginAttempt = () => {
        setStarting(true);
        startExamAttempt(exercise.id)
            .then((res) => {
                setQuiz({
                    attemptId: res.data.attemptId,
                    passages: res.data.passages,
                    questions: res.data.questions,
                    answerOptions: res.data.answerOptions ?? [],
                    currentIndex: 0,
                    selectedAnswer: "",
                    feedback: null,
                    submitting: false,
                });
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Übung konnte nicht gestartet werden."))
            .finally(() => setStarting(false));
    };

    const answerQuestion = () => {
        if (!quiz) return;
        const question = quiz.questions[quiz.currentIndex];
        setQuiz({ ...quiz, submitting: true });
        submitExamAnswer(quiz.attemptId, { questionId: question.id, answer: quiz.selectedAnswer })
            .then((res) => {
                setQuiz((prev) => (prev ? { ...prev, feedback: res.data, submitting: false } : prev));
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message ?? "Antwort konnte nicht übermittelt werden.");
                setQuiz((prev) => (prev ? { ...prev, submitting: false } : prev));
            });
    };

    const nextQuestion = () => {
        if (!quiz) return;
        if (quiz.currentIndex + 1 >= quiz.questions.length) {
            completeExamAttempt(quiz.attemptId)
                .then((res) => {
                    setResults({ score: res.data.score, breakdown: res.data.answerBreakdown });
                })
                .catch((err) => toast.error(err?.response?.data?.message ?? "Übung konnte nicht abgeschlossen werden."));
            return;
        }
        setQuiz({ ...quiz, currentIndex: quiz.currentIndex + 1, selectedAnswer: "", feedback: null });
    };

    if (results) {
        const correctCount = results.breakdown.filter((a) => a.correct).length;
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ergebnis</h2>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{Math.round(results.score)}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {correctCount} von {results.breakdown.length} Aufgaben richtig
                </p>

                <div className="space-y-3 pt-2">
                    {results.breakdown.map((answer, idx) => (
                        <div
                            key={answer.questionId}
                            className={`rounded-lg p-3 text-sm ${
                                answer.correct
                                    ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                    : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                            }`}
                        >
                            <p className="font-semibold">
                                Aufgabe {idx + 1}: {answer.correct ? "Richtig" : "Falsch"}
                            </p>
                            {answer.explanation && <p className="mt-1">💡 {answer.explanation}</p>}
                            {answer.commonMistake && <p className="mt-1 italic">⚠️ {answer.commonMistake}</p>}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Bereit? Starte die Übung und bearbeite die Aufgaben der Reihe nach.
                </p>
                <Button variant="primary" className="text-sm px-4 py-2" disabled={starting} onClick={beginAttempt}>
                    {starting ? "Wird geladen..." : "Übung starten"}
                </Button>
            </div>
        );
    }

    const question = quiz.questions[quiz.currentIndex];
    if (!question) {
        return <p className="text-sm text-gray-500 dark:text-gray-400">Diese Übung enthält noch keine Aufgaben.</p>;
    }

    const currentPassage =
        exercise.taskType === "MATCHING" && question.sectionIndex != null ? quiz.passages[question.sectionIndex] : null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Aufgabe {quiz.currentIndex + 1} von {quiz.questions.length}
                {currentPassage && ` — ${currentPassage.label}`}
            </p>

            {currentPassage && (
                <div className="rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 p-4">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">{currentPassage.label}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{currentPassage.content}</p>
                </div>
            )}

            <p className="font-medium text-gray-900 dark:text-white">{question.prompt}</p>

            <QuestionInput
                question={question}
                answerOptions={quiz.answerOptions}
                taskType={exercise.taskType}
                selectedAnswer={quiz.selectedAnswer}
                disabled={Boolean(quiz.feedback)}
                onSelect={(value) => setQuiz({ ...quiz, selectedAnswer: value })}
            />

            {quiz.feedback && <FeedbackCard feedback={quiz.feedback} />}

            <div className="flex justify-end pt-2">
                {quiz.feedback ? (
                    <Button variant="primary" className="text-sm px-4 py-2" onClick={nextQuestion}>
                        {quiz.currentIndex + 1 >= quiz.questions.length ? "Ergebnis anzeigen" : "Nächste Aufgabe"}
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        className="text-sm px-4 py-2"
                        disabled={!quiz.selectedAnswer || quiz.submitting}
                        onClick={answerQuestion}
                    >
                        {quiz.submitting ? "Wird geprüft..." : "Antwort abgeben"}
                    </Button>
                )}
            </div>
        </div>
    );
}

function ExamExerciseContent() {
    const searchParams = useSearchParams();
    const exerciseId = searchParams.get("id") ?? "";
    const [exercise, setExercise] = useState<ExamExercisePublicResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!exerciseId) return;
        getExamExerciseById(exerciseId)
            .then((res) => setExercise(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Übung konnte nicht geladen werden."))
            .finally(() => setLoading(false));
    }, [exerciseId]);

    if (!exerciseId) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
                <div className="max-w-4xl mx-auto text-center text-gray-500 dark:text-gray-400 py-20">
                    Keine Übung ausgewählt.{" "}
                    <Link href="/dashboard/exam-prep" className="underline">
                        Zurück zur Prüfungsvorbereitung
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) return <Loading />;

    if (!exercise) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
                <div className="max-w-4xl mx-auto text-center text-gray-500 dark:text-gray-400 py-20">
                    Übung nicht gefunden.{" "}
                    <Link href="/dashboard/exam-prep" className="underline">
                        Zurück zur Prüfungsvorbereitung
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-4xl mx-auto space-y-6">
                <Link
                    href="/dashboard/exam-prep"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-block"
                >
                    ← Zurück zur Prüfungsvorbereitung
                </Link>

                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{exercise.title}</h1>
                    <Badge variant="secondary">{exercise.level}</Badge>
                </div>

                {exercise.taskType === "MATCHING" && <HeadlinesView answerOptions={exercise.answerOptions ?? []} />}

                <PassagesView passages={exercise.passages} taskType={exercise.taskType} />

                <ExerciseQuiz exercise={exercise} />
            </div>
            <ToastContainer />
        </div>
    );
}

export default function ExamExercisePage() {
    return (
        <Suspense fallback={<Loading />}>
            <ExamExerciseContent />
        </Suspense>
    );
}
