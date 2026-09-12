"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import { getExamExerciseById } from "@/services/examService";
import {
    completeExamAttempt,
    markExerciseCompleted,
    startExamAttempt,
    submitExamAnswer,
} from "@/services/examAttemptService";
import {
    ExamAnswerFeedbackResponse,
    ExamExercisePublicResponse,
    ExamPassagePublic,
    ExamQuestionPublic,
} from "@/types/exam";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import Button from "@/componenets/Button";
import AudioPlayer from "@/componenets/AudioPlayer";
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
    const audioSrc = resolveUploadUrl(passage.audioUrl);
    return (
        <>
            {audioSrc && <AudioPlayer key={audioSrc} src={audioSrc} />}
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

interface ResultItem {
    question: ExamQuestionPublic;
    feedback: ExamAnswerFeedbackResponse;
}

interface ResultsState {
    score: number;
    items: ResultItem[];
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
            {feedback.transcript && (
                <div className="mt-2 pt-2 border-t border-current/20">
                    <p className="font-semibold text-xs uppercase tracking-wide mb-1">Transkript</p>
                    <p className="whitespace-pre-line font-normal">{feedback.transcript}</p>
                </div>
            )}
        </div>
    );
}

function ResultsView({
    results,
    completed,
    markingCompleted,
    onPracticeAgain,
    onMarkCompleted,
}: Readonly<{
    results: ResultsState;
    completed: boolean;
    markingCompleted: boolean;
    onPracticeAgain: () => void;
    onMarkCompleted: () => void;
}>) {
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

            <div className="flex justify-end gap-2 pt-2 flex-wrap">
                <Button variant="secondary" className="text-sm px-4 py-2" onClick={onPracticeAgain}>
                    Erneut üben
                </Button>
                <Button
                    variant="primary"
                    className="text-sm px-4 py-2"
                    disabled={completed || markingCompleted}
                    onClick={onMarkCompleted}
                >
                    {completed ? "Als erledigt markiert ✓" : markingCompleted ? "Wird markiert..." : "Als erledigt markieren"}
                </Button>
            </div>
        </div>
    );
}

/**
 * Schriftlicher Ausdruck: no attempt/grading flow at all - just the writing prompt (as a passage)
 * and a "Lösung anzeigen" button that reveals the admin-authored model solution. The student can
 * still mark the exercise as done via the shared completion hook.
 */
function SchriftlicherAusdruckView({ exercise }: Readonly<{ exercise: ExamExercisePublicResponse }>) {
    const [showSolution, setShowSolution] = useState(false);
    const { completed, marking, markCompleted } = useExerciseCompletion(exercise);

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-2">
                {exercise.passages.map((p) => (
                    <PassageBody key={p.id} passage={p} />
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
                {showSolution && exercise.modelSolution ? (
                    <div
                        className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed [&_p]:my-1"
                        dangerouslySetInnerHTML={{ __html: resolveUploadUrlsInHtml(exercise.modelSolution) }}
                    />
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Schreibe deine Antwort in einem eigenen Dokument. Wenn du fertig bist, kannst du dir eine
                        mögliche Lösung ansehen.
                    </p>
                )}

                <div className="flex justify-end gap-2 flex-wrap">
                    {!showSolution && (
                        <Button variant="secondary" className="text-sm px-4 py-2" onClick={() => setShowSolution(true)}>
                            Lösung anzeigen
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        className="text-sm px-4 py-2"
                        disabled={completed || marking}
                        onClick={markCompleted}
                    >
                        {completed ? "Als erledigt markiert ✓" : marking ? "Wird markiert..." : "Als erledigt markieren"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function StartCard({ starting, onStart }: Readonly<{ starting: boolean; onStart: () => void }>) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Bereit? Starte die Übung und bearbeite die Aufgaben der Reihe nach.
            </p>
            <Button variant="primary" className="text-sm px-4 py-2" disabled={starting} onClick={onStart}>
                {starting ? "Wird geladen..." : "Übung starten"}
            </Button>
        </div>
    );
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

/** Shared "mark as completed" state/handler for both quiz flows. */
function useExerciseCompletion(exercise: ExamExercisePublicResponse) {
    const [completed, setCompleted] = useState(exercise.completed);
    const [marking, setMarking] = useState(false);

    const markCompleted = () => {
        setMarking(true);
        markExerciseCompleted(exercise.id)
            .then(() => setCompleted(true))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Konnte nicht als erledigt markiert werden."))
            .finally(() => setMarking(false));
    };

    return { completed, marking, markCompleted };
}

interface GridQuizState {
    attemptId: string;
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    answerOptions: string[];
    answers: Record<string, string>;
    submitting: boolean;
}

/**
 * Word-bank cloze (Sprachbausteine Teil 2): every gap is shown at once as a card in a grid, each
 * with a dropdown; a single "Antworten abgeben" submits everything together, mirroring how this
 * part is actually taken in the real exam (a running text with 10 gaps answered all at once).
 */
function ClozeGridQuiz({ exercise }: Readonly<{ exercise: ExamExercisePublicResponse }>) {
    const [quiz, setQuiz] = useState<GridQuizState | null>(null);
    const [results, setResults] = useState<ResultsState | null>(null);
    const [starting, setStarting] = useState(false);
    const { completed, marking, markCompleted } = useExerciseCompletion(exercise);

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

    const practiceAgain = () => {
        setResults(null);
        setQuiz(null);
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
        return (
            <ResultsView
                results={results}
                completed={completed}
                markingCompleted={marking}
                onPracticeAgain={practiceAgain}
                onMarkCompleted={markCompleted}
            />
        );
    }
    if (!quiz) return <StartCard starting={starting} onStart={beginAttempt} />;
    if (quiz.questions.length === 0) {
        return <p className="text-sm text-gray-500 dark:text-gray-400">Diese Übung enthält noch keine Aufgaben.</p>;
    }

    const allAnswered = quiz.questions.every((q) => quiz.answers[q.id]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Beantworte alle {quiz.questions.length} Aufgaben und klicke dann auf &quot;Antworten abgeben&quot;.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            </div>

            <div className="flex justify-end pt-2">
                <Button variant="primary" className="text-sm px-4 py-2" disabled={!allAnswered || quiz.submitting} onClick={submitAll}>
                    {quiz.submitting ? "Wird geprüft..." : "Antworten abgeben"}
                </Button>
            </div>
        </div>
    );
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
            : taskType === "MATCHING" || taskType === "WORD_BANK_CLOZE"
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
            {feedback.transcript && (
                <div className="mt-2 pt-2 border-t border-current/20">
                    <p className="font-semibold text-xs uppercase tracking-wide mb-1">Transkript</p>
                    <p className="whitespace-pre-line font-normal">{feedback.transcript}</p>
                </div>
            )}
        </div>
    );
}

interface StepQuizState {
    attemptId: string;
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    answerOptions: string[];
    currentIndex: number;
    selectedAnswer: string;
    feedback: ExamAnswerFeedbackResponse | null;
    submitting: boolean;
    items: ResultItem[];
}

/**
 * Every other task type: one question at a time, with immediate right/wrong feedback and tips
 * before moving on, then an overall score screen at the end.
 */
function StepQuiz({ exercise }: Readonly<{ exercise: ExamExercisePublicResponse }>) {
    const [quiz, setQuiz] = useState<StepQuizState | null>(null);
    const [results, setResults] = useState<ResultsState | null>(null);
    const [starting, setStarting] = useState(false);
    const { completed, marking, markCompleted } = useExerciseCompletion(exercise);

    const practiceAgain = () => {
        setResults(null);
        setQuiz(null);
    };

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
                    items: [],
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
                setQuiz((prev) =>
                    prev
                        ? { ...prev, feedback: res.data, submitting: false, items: [...prev.items, { question, feedback: res.data }] }
                        : prev
                );
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
                    setResults({ score: res.data.score, items: quiz.items });
                })
                .catch((err) => toast.error(err?.response?.data?.message ?? "Übung konnte nicht abgeschlossen werden."));
            return;
        }
        setQuiz({ ...quiz, currentIndex: quiz.currentIndex + 1, selectedAnswer: "", feedback: null });
    };

    if (results) {
        return (
            <ResultsView
                results={results}
                completed={completed}
                markingCompleted={marking}
                onPracticeAgain={practiceAgain}
                onMarkCompleted={markCompleted}
            />
        );
    }
    if (!quiz) return <StartCard starting={starting} onStart={beginAttempt} />;

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
                    <PassageBody passage={currentPassage} />
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

interface HoerenListQuizState {
    attemptId: string;
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    answerOptions: string[];
    answers: Record<string, string>;
    submitting: boolean;
}

/**
 * Hoerverstehen: every clip is listed at once as a numbered item with its own audio player and
 * inline +/- buttons for Richtig/Falsch; a single "Antworten abgeben" grades everything together
 * and only then reveals correctness/explanations/transcripts (mirrors ClozeGridQuiz's batching,
 * so a student can revisit any clip before submitting but never sees feedback mid-attempt).
 */
function HoerenListQuiz({ exercise }: Readonly<{ exercise: ExamExercisePublicResponse }>) {
    const [quiz, setQuiz] = useState<HoerenListQuizState | null>(null);
    const [results, setResults] = useState<ResultsState | null>(null);
    const [starting, setStarting] = useState(false);
    const { completed, marking, markCompleted } = useExerciseCompletion(exercise);

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

    const practiceAgain = () => {
        setResults(null);
        setQuiz(null);
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
        return (
            <ResultsView
                results={results}
                completed={completed}
                markingCompleted={marking}
                onPracticeAgain={practiceAgain}
                onMarkCompleted={markCompleted}
            />
        );
    }
    if (!quiz) return <StartCard starting={starting} onStart={beginAttempt} />;
    if (quiz.questions.length === 0) {
        return <p className="text-sm text-gray-500 dark:text-gray-400">Diese Übung enthält noch keine Aufgaben.</p>;
    }

    const allAnswered = quiz.questions.every((q) => quiz.answers[q.id]);
    const showPassageLabels = quiz.passages.length > 1;

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Höre jeden Text an und markiere, ob die Aussage richtig ({quiz.answerOptions[0] ?? "+"}) oder falsch (
                    {quiz.answerOptions[1] ?? "-"}) ist. Dein Ergebnis siehst du, sobald du alle Antworten abgegeben hast.
                </p>
                {quiz.passages.map((passage) => (
                    <div
                        key={passage.id}
                        className="rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 p-4"
                    >
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">{passage.label}</p>
                        <PassageBody passage={passage} />
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
                <ol className="space-y-3">
                    {quiz.questions.map((question, idx) => {
                        const passage = question.sectionIndex != null ? quiz.passages[question.sectionIndex] : null;
                        const selected = quiz.answers[question.id] ?? "";
                        return (
                            <li
                                key={question.id}
                                className="flex gap-3 items-start border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                            >
                                <span className="font-semibold text-gray-400 dark:text-gray-500 pt-1.5 w-5 shrink-0">{idx + 1}.</span>
                                <div className="flex gap-2 pt-0.5 shrink-0">
                                    {quiz.answerOptions.map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            disabled={quiz.submitting}
                                            onClick={() =>
                                                setQuiz((prev) =>
                                                    prev ? { ...prev, answers: { ...prev.answers, [question.id]: option } } : prev
                                                )
                                            }
                                            className={`w-9 h-9 rounded-lg border text-sm font-semibold ${
                                                selected === option
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                                            }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                                <p className="font-medium text-gray-900 dark:text-white pt-1.5">
                                    {showPassageLabels && passage && (
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                            {passage.label}:{" "}
                                        </span>
                                    )}
                                    {question.prompt}
                                </p>
                            </li>
                        );
                    })}
                </ol>

                <div className="flex justify-end pt-2">
                    <Button
                        variant="primary"
                        className="text-sm px-4 py-2"
                        disabled={!allAnswered || quiz.submitting}
                        onClick={submitAll}
                    >
                        {quiz.submitting ? "Wird geprüft..." : "Antworten abgeben"}
                    </Button>
                </div>
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

                {exercise.section !== "HOERVERSTEHEN" && exercise.section !== "SCHRIFTLICHER_AUSDRUCK" && (
                    <>
                        {(exercise.taskType === "MATCHING" || exercise.taskType === "WORD_BANK_CLOZE") && (
                            <AnswerOptionsPoolView answerOptions={exercise.answerOptions ?? []} taskType={exercise.taskType} />
                        )}
                        <PassagesView passages={exercise.passages} taskType={exercise.taskType} />
                    </>
                )}

                {exercise.section === "HOERVERSTEHEN" ? (
                    <HoerenListQuiz exercise={exercise} />
                ) : exercise.section === "SCHRIFTLICHER_AUSDRUCK" ? (
                    <SchriftlicherAusdruckView exercise={exercise} />
                ) : exercise.taskType === "WORD_BANK_CLOZE" ? (
                    <ClozeGridQuiz exercise={exercise} />
                ) : (
                    <StepQuiz exercise={exercise} />
                )}
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
