"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import { getExamExerciseById } from "@/services/examService";
import { completeExamAttempt, startExamAttempt, submitExamAnswer } from "@/services/examAttemptService";
import {
    ExamAnswerFeedbackResponse,
    ExamExercisePublicResponse,
    ExamPassagePublic,
    ExamQuestionPublic,
} from "@/types/exam";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import Button from "@/componenets/Button";
import { resolveUploadUrl, resolveUploadUrlsInHtml } from "@/lib/backendOrigin";

const TFN_OPTIONS = [
    { value: "RICHTIG", label: "Richtig" },
    { value: "FALSCH", label: "Falsch" },
    { value: "NICHT_IM_TEXT", label: "Nicht im Text" },
];

const letterFor = (index: number) => String.fromCharCode(97 + index);

function AnswerOptionsPoolView({
    answerOptions,
    taskType,
}: Readonly<{ answerOptions: string[]; taskType: string }>) {
    if (answerOptions.length === 0) return null;
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {taskType === "WORD_BANK_CLOZE"
                    ? "Wörter — nicht jedes passt in eine Lücke:"
                    : "Überschriften — nicht jede passt zu einem Text:"}
            </p>
            <ul className="space-y-2">
                {answerOptions.map((option, idx) => (
                    <li key={option} className="text-sm text-gray-800 dark:text-gray-200">
                        <span className="font-semibold">{letterFor(idx)})</span> {option}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function PassageBody({ passage }: Readonly<{ passage: ExamPassagePublic }>) {
    return (
        <>
            {passage.imageUrl && (
                <img src={resolveUploadUrl(passage.imageUrl) ?? undefined} alt="" className="max-w-full rounded-lg mb-2" />
            )}
            {passage.content && (
                <div
                    className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed [&_p]:my-1"
                    dangerouslySetInnerHTML={{ __html: resolveUploadUrlsInHtml(passage.content) }}
                />
            )}
        </>
    );
}

function PassagesView({ passages, taskType }: Readonly<{ passages: ExamPassagePublic[]; taskType: string }>) {
    if (passages.length === 0) return null;

    if (taskType === "MULTIPLE_CHOICE" || taskType === "WORD_BANK_CLOZE") {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-2">
                {passages.map((p) => (
                    <PassageBody key={p.id} passage={p} />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {passages.map((p) => (
                <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">{p.label}</p>
                    <PassageBody passage={p} />
                </div>
            ))}
        </div>
    );
}

interface QuizState {
    attemptId: string;
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    answerOptions: string[];
    answers: Record<string, string>;
    submitting: boolean;
}

interface ResultItem {
    question: ExamQuestionPublic;
    feedback: ExamAnswerFeedbackResponse;
}

interface ResultsState {
    score: number;
    items: ResultItem[];
}

/** Dropdown of answer choices - MC/TFN use the question's own options, MATCHING/WORD_BANK_CLOZE share one pool. */
function QuestionSelect({
    question,
    answerOptions,
    taskType,
    value,
    disabled,
    onChange,
}: Readonly<{
    question: ExamQuestionPublic;
    answerOptions: string[];
    taskType: string;
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
}>) {
    const options =
        taskType === "TRUE_FALSE_NOT_GIVEN"
            ? TFN_OPTIONS
            : taskType === "MATCHING" || taskType === "WORD_BANK_CLOZE"
                ? answerOptions.map((o, idx) => ({ value: o, label: `${letterFor(idx)}) ${o}` }))
                : (question.options ?? []).map((o) => ({ value: o, label: o }));

    return (
        <select
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-60"
        >
            <option value="">Antwort wählen...</option>
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

function ResultCard({ index, item }: Readonly<{ index: number; item: ResultItem }>) {
    const { question, feedback } = item;
    return (
        <div
            className={`rounded-lg p-3 text-sm space-y-1 ${
                feedback.correct
                    ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                    : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200"
            }`}
        >
            <p className="font-semibold">
                Aufgabe {index + 1}{question.prompt ? ` — ${question.prompt}` : ""}: {feedback.correct ? "Richtig" : "Falsch"}
            </p>
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
                    answers: {},
                    submitting: false,
                });
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Übung konnte nicht gestartet werden."))
            .finally(() => setStarting(false));
    };

    const submitAll = async () => {
        if (!quiz) return;
        setQuiz({ ...quiz, submitting: true });
        try {
            const items: ResultItem[] = [];
            for (const question of quiz.questions) {
                const res = await submitExamAnswer(quiz.attemptId, {
                    questionId: question.id,
                    answer: quiz.answers[question.id] ?? "",
                });
                items.push({ question, feedback: res.data });
            }
            const completeRes = await completeExamAttempt(quiz.attemptId);
            setResults({ score: completeRes.data.score, items });
        } catch (err) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Übung konnte nicht abgeschlossen werden.");
            setQuiz((prev) => (prev ? { ...prev, submitting: false } : prev));
        }
    };

    if (results) {
        const correctCount = results.items.filter((item) => item.feedback.correct).length;
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ergebnis</h2>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{Math.round(results.score)}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {correctCount} von {results.items.length} Aufgaben richtig
                </p>

                <div className="space-y-3 pt-2">
                    {results.items.map((item, idx) => (
                        <ResultCard key={item.question.id} index={idx} item={item} />
                    ))}
                </div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Bereit? Starte die Übung, beantworte alle Aufgaben und gib sie anschließend ab.
                </p>
                <Button variant="primary" className="text-sm px-4 py-2" disabled={starting} onClick={beginAttempt}>
                    {starting ? "Wird geladen..." : "Übung starten"}
                </Button>
            </div>
        );
    }

    if (quiz.questions.length === 0) {
        return <p className="text-sm text-gray-500 dark:text-gray-400">Diese Übung enthält noch keine Aufgaben.</p>;
    }

    const allAnswered = quiz.questions.every((q) => quiz.answers[q.id]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Beantworte alle {quiz.questions.length} Aufgaben und klicke dann auf &quot;Antworten abgeben&quot;.
            </p>

            {quiz.questions.map((question, idx) => {
                const referencedPassage = question.sectionIndex != null ? quiz.passages[question.sectionIndex] : null;
                return (
                    <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                            {idx + 1}. {referencedPassage && `${referencedPassage.label}: `}
                            {question.prompt}
                        </p>
                        <QuestionSelect
                            question={question}
                            answerOptions={quiz.answerOptions}
                            taskType={exercise.taskType}
                            value={quiz.answers[question.id] ?? ""}
                            disabled={quiz.submitting}
                            onChange={(value) =>
                                setQuiz((prev) => (prev ? { ...prev, answers: { ...prev.answers, [question.id]: value } } : prev))
                            }
                        />
                    </div>
                );
            })}

            <div className="flex justify-end pt-2">
                <Button variant="primary" className="text-sm px-4 py-2" disabled={!allAnswered || quiz.submitting} onClick={submitAll}>
                    {quiz.submitting ? "Wird geprüft..." : "Antworten abgeben"}
                </Button>
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

                {(exercise.taskType === "MATCHING" || exercise.taskType === "WORD_BANK_CLOZE") && (
                    <AnswerOptionsPoolView answerOptions={exercise.answerOptions ?? []} taskType={exercise.taskType} />
                )}

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
