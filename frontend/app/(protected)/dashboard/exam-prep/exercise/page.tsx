"use client";

import { Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
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
    ExamTranscript,
} from "@/types/exam";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import Button from "@/componenets/Button";
import AudioPlayer from "@/componenets/AudioPlayer";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import TranscriptModal from "@/componenets/exam/TranscriptModal";
import TranscriptContent from "@/componenets/exam/TranscriptContent";
import { isEmptyTranscript } from "@/lib/transcriptFormat";
import { FileText } from "lucide-react";

const TFN_OPTIONS = [
    { value: "RICHTIG", label: "Richtig" },
    { value: "FALSCH", label: "Falsch" },
    { value: "NICHT_IM_TEXT", label: "Nicht im Text" },
];

/** SITUATION_MATCHING's correctAnswer for "no ad fits" (the "x" on the answer sheet). */
const NO_AD_ANSWER = "X";

/** SITUATION_MATCHING answers are passage ids; show the ad's label ("e") instead of the raw id. */
const answerLabelFor = (passages: ExamPassagePublic[], value: string) =>
    value === NO_AD_ANSWER ? "x (keine Anzeige)" : (passages.find((p) => p.id === value)?.label ?? value);

const letterFor = (index: number) => String.fromCharCode(97 + index);
/** Admin-edited label for an answer option, falling back to its positional letter. */
const optionLabelFor = (labels: string[] | null | undefined, index: number) => labels?.[index]?.trim() || letterFor(index);

function AnswerOptionsPoolView({
    answerOptions,
    answerOptionLabels,
    taskType,
}: Readonly<{ answerOptions: string[]; answerOptionLabels: string[]; taskType: string }>) {
    if (answerOptions.length === 0) return null;
    return (
        <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {taskType === "WORD_BANK_CLOZE"
                    ? "Wörter — nicht jedes passt in eine Lücke:"
                    : "Überschriften — nicht jede passt zu einem Text:"}
            </p>
            <ul className="space-y-2">
                {answerOptions.map((option, idx) => (
                    <li key={option} className="text-sm text-gray-800 dark:text-gray-200">
                        <span className="font-semibold">{optionLabelFor(answerOptionLabels, idx)})</span> {option}
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
                <LessonMarkdown content={passage.content} className="text-sm text-gray-700 dark:text-gray-300" />
            )}
        </>
    );
}

function PassagesView({ passages, taskType }: Readonly<{ passages: ExamPassagePublic[]; taskType: string }>) {
    if (passages.length === 0) return null;

    if (taskType === "MULTIPLE_CHOICE" || taskType === "WORD_BANK_CLOZE") {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-2">
                {passages.map((p) => (
                    <PassageBody key={p.id} passage={p} />
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {passages.map((p) => (
                <div key={p.id} className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-4">
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
    transcripts: ExamTranscript[];
}

function ResultCard({
    index,
    item,
    hideTranscript,
    formatAnswer,
}: Readonly<{ index: number; item: ResultItem; hideTranscript?: boolean; formatAnswer?: (value: string) => string }>) {
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
                Aufgabe {question.questionNumber ?? index + 1}{question.prompt ? ` — ${question.prompt}` : ""}: {feedback.correct ? "Richtig" : "Falsch"}
            </p>
            {!feedback.correct && (
                <p>
                    Richtige Antwort: <span className="font-medium">{formatAnswer ? formatAnswer(feedback.correctAnswer) : feedback.correctAnswer}</span>
                </p>
            )}
            {feedback.explanation && <p className="mt-1">💡 {feedback.explanation}</p>}
            {feedback.commonMistake && <p className="mt-1 italic">⚠️ Häufiger Fehler: {feedback.commonMistake}</p>}
            {!isEmptyTranscript(feedback.transcript) && !hideTranscript && (
                <div className="mt-2 pt-2 border-t border-current/20">
                    <p className="font-semibold text-xs uppercase tracking-wide mb-1">Transkript</p>
                    <TranscriptContent transcript={feedback.transcript ?? ""} variant="compact" />
                </div>
            )}
        </div>
    );
}

function ResultsView({
    results,
    defaultExplanation,
    defaultCommonMistake,
    completed,
    markingCompleted,
    onPracticeAgain,
    onMarkCompleted,
    formatAnswer,
}: Readonly<{
    formatAnswer?: (value: string) => string;
    results: ResultsState;
    defaultExplanation?: string | null;
    defaultCommonMistake?: string | null;
    completed: boolean;
    markingCompleted: boolean;
    onPracticeAgain: () => void;
    onMarkCompleted: () => void;
}>) {
    const correctCount = results.items.filter((item) => item.feedback.correct).length;
    const [transcriptOpen, setTranscriptOpen] = useState(false);

    // Finishing the attempt counts as completing the exercise, regardless of score.
    useEffect(() => {
        if (!completed && !markingCompleted) {
            onMarkCompleted();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ergebnis</h2>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{Math.round(results.score)}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
                {correctCount} von {results.items.length} Aufgaben richtig
            </p>

            {results.transcripts.length > 0 && (
                <>
                    <button
                        type="button"
                        onClick={() => setTranscriptOpen(true)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                        <FileText className="size-4" />
                        Transkript anzeigen
                    </button>
                    <TranscriptModal
                        open={transcriptOpen}
                        onClose={() => setTranscriptOpen(false)}
                        transcripts={results.transcripts}
                    />
                </>
            )}

            {(defaultExplanation || defaultCommonMistake) && (
                <div className="rounded-lg p-3 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200 space-y-1">
                    {defaultExplanation && <p>💡 {defaultExplanation}</p>}
                    {defaultCommonMistake && <p className="italic">⚠️ Häufiger Fehler: {defaultCommonMistake}</p>}
                </div>
            )}

            <div className="space-y-3 pt-2">
                {results.items.map((item, idx) => (
                    // The transcript link above covers every transcript; don't repeat it under each question.
                    <ResultCard key={item.question.id} index={idx} item={item} hideTranscript={results.transcripts.length > 0} formatAnswer={formatAnswer} />
                ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 flex-wrap">
                <Button variant="secondary" className="text-sm px-4 py-2" onClick={onPracticeAgain}>
                    Erneut üben
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
            <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-2">
                {exercise.passages.map((p) => (
                    <PassageBody key={p.id} passage={p} />
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-4">
                {showSolution && exercise.modelSolution ? (
                    <LessonMarkdown
                        content={exercise.modelSolution}
                        className="text-sm text-gray-700 dark:text-gray-300"
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

function TestformatInformationView({ exercise }: Readonly<{ exercise: ExamExercisePublicResponse }>) {
    const { completed, marking, markCompleted } = useExerciseCompletion(exercise);

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-2">
                {exercise.passages.map((p) => (
                    <PassageBody key={p.id} passage={p} />
                ))}
            </div>

            <div className="flex justify-end">
                <Button variant="primary" className="text-sm px-4 py-2" disabled={completed || marking} onClick={markCompleted}>
                    {completed ? "Als erledigt markiert ✓" : marking ? "Wird markiert..." : "Als erledigt markieren"}
                </Button>
            </div>
        </div>
    );
}

function StartCard({ starting, onStart }: Readonly<{ starting: boolean; onStart: () => void }>) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-3">
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
    answerOptionLabels,
    taskType,
    value,
    disabled,
    choices,
    onChange,
}: Readonly<{
    question: ExamQuestionPublic;
    answerOptions: string[];
    answerOptionLabels: string[];
    taskType: string;
    value: string;
    disabled: boolean;
    /** Overrides the options derived from taskType (used by SITUATION_MATCHING, whose choices are the ads). */
    choices?: { value: string; label: string; disabled?: boolean }[];
    onChange: (value: string) => void;
}>) {
    const options: { value: string; label: string; disabled?: boolean }[] =
        choices ?? (taskType === "TRUE_FALSE_NOT_GIVEN"
            ? TFN_OPTIONS
            : taskType === "MATCHING" || taskType === "WORD_BANK_CLOZE"
                ? answerOptions.map((o, idx) => ({ value: o, label: `${optionLabelFor(answerOptionLabels, idx)}) ${o}` }))
                : (question.options ?? []).map((o) => ({ value: o, label: o })));

    return (
        <select
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-60"
        >
            <option value="">Antwort wählen...</option>
            {options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
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
    answerOptionLabels: string[];
    answers: Record<string, string>;
    submitting: boolean;
}

/**
 * Grid quizzes (answered all at once): word-bank cloze (Sprachbausteine Teil 2) and
 * SITUATION_MATCHING (Leseverstehen Teil 3, situations matched to ads). Every gap is shown at once as a card in a grid, each
 * with a dropdown; a single "Antworten abgeben" submits everything together, mirroring how this
 * part is actually taken in the real exam (a running text with 10 gaps answered all at once).
 */
function ClozeGridQuiz({ exercise }: Readonly<{ exercise: ExamExercisePublicResponse }>) {
    const [quiz, setQuiz] = useState<GridQuizState | null>(null);
    const isSituationMatching = exercise.taskType === "SITUATION_MATCHING";
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
                    answerOptionLabels: res.data.answerOptionLabels ?? [],
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
            setResults({ score: completeRes.data.score, items, transcripts: completeRes.data.transcripts ?? [] });
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
                defaultExplanation={exercise.defaultExplanation}
                defaultCommonMistake={exercise.defaultCommonMistake}
                completed={completed}
                markingCompleted={marking}
                onPracticeAgain={practiceAgain}
                onMarkCompleted={markCompleted}
                formatAnswer={isSituationMatching ? (value) => answerLabelFor(exercise.passages, value) : undefined}
            />
        );
    }
    if (!quiz) return <StartCard starting={starting} onStart={beginAttempt} />;
    if (quiz.questions.length === 0) {
        return <p className="text-sm text-gray-500 dark:text-gray-400">Diese Übung enthält noch keine Aufgaben.</p>;
    }

    const allAnswered = quiz.questions.every((q) => quiz.answers[q.id]);

    // Each ad may be used once: disable it in every other situation's dropdown once picked ("x" stays available).
    const choicesFor = (questionId: string) =>
        isSituationMatching
            ? [
                  ...quiz.passages.map((p) => ({
                      value: p.id,
                      label: p.label,
                      disabled: Object.entries(quiz.answers).some(([id, answer]) => id !== questionId && answer === p.id),
                  })),
                  { value: NO_AD_ANSWER, label: "x (keine Anzeige)" },
              ]
            : undefined;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Beantworte alle {quiz.questions.length} Aufgaben und klicke dann auf &quot;Antworten abgeben&quot;.
                {isSituationMatching && " Jede Anzeige darf nur einmal benutzt werden. Wenn keine Anzeige passt, wähle x."}
            </p>

            <div className={`grid gap-3 sm:grid-cols-2 ${isSituationMatching ? "" : "lg:grid-cols-3 xl:grid-cols-4"}`}>
                {quiz.questions.map((question, idx) => {
                    const referencedPassage = question.sectionIndex != null ? quiz.passages[question.sectionIndex] : null;
                    return (
                        <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                            <p className="font-medium text-gray-900 dark:text-white">
                                {question.questionNumber ?? idx + 1}. {referencedPassage && `${referencedPassage.label}: `}
                                {question.prompt}
                            </p>
                            <QuestionSelect
                                question={question}
                                answerOptions={quiz.answerOptions}
                answerOptionLabels={quiz.answerOptionLabels}
                                taskType={exercise.taskType ?? ""}
                                value={quiz.answers[question.id] ?? ""}
                                disabled={quiz.submitting}
                                choices={choicesFor(question.id)}
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
    answerOptionLabels,
    taskType,
    selectedAnswer,
    disabled,
    onSelect,
}: Readonly<{
    question: ExamQuestionPublic;
    answerOptions: string[];
    answerOptionLabels: string[];
    taskType: string;
    selectedAnswer: string;
    disabled: boolean;
    onSelect: (value: string) => void;
}>) {
    const options =
        taskType === "TRUE_FALSE_NOT_GIVEN"
            ? TFN_OPTIONS
            : taskType === "MATCHING" || taskType === "WORD_BANK_CLOZE"
                ? answerOptions.map((o, idx) => ({ value: o, label: `${optionLabelFor(answerOptionLabels, idx)}) ${o}` }))
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
            {!isEmptyTranscript(feedback.transcript) && (
                <div className="mt-2 pt-2 border-t border-current/20">
                    <p className="font-semibold text-xs uppercase tracking-wide mb-1">Transkript</p>
                    <TranscriptContent transcript={feedback.transcript ?? ""} variant="compact" />
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
    answerOptionLabels: string[];
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
                    answerOptionLabels: res.data.answerOptionLabels ?? [],
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
                    setResults({ score: res.data.score, items: quiz.items, transcripts: res.data.transcripts ?? [] });
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
                defaultExplanation={exercise.defaultExplanation}
                defaultCommonMistake={exercise.defaultCommonMistake}
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
        <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                {question.questionNumber != null && question.questionNumber !== quiz.currentIndex + 1
                    ? `Aufgabe ${question.questionNumber} (${quiz.currentIndex + 1} von ${quiz.questions.length})`
                    : `Aufgabe ${quiz.currentIndex + 1} von ${quiz.questions.length}`}
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
                answerOptionLabels={quiz.answerOptionLabels}
                taskType={exercise.taskType ?? ""}
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
    answerOptionLabels: string[];
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
                    answerOptionLabels: res.data.answerOptionLabels ?? [],
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
            setResults({ score: completeRes.data.score, items, transcripts: completeRes.data.transcripts ?? [] });
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
                defaultExplanation={exercise.defaultExplanation}
                defaultCommonMistake={exercise.defaultCommonMistake}
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
            <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-3">
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

            <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-4">
                <ol className="space-y-3">
                    {quiz.questions.map((question, idx) => {
                        const passage = question.sectionIndex != null ? quiz.passages[question.sectionIndex] : null;
                        const selected = quiz.answers[question.id] ?? "";
                        return (
                            <li
                                key={question.id}
                                className="flex gap-3 items-start border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                            >
                                <span className="font-semibold text-gray-400 dark:text-gray-500 pt-1.5 w-5 shrink-0">
                                    {question.questionNumber ?? idx + 1}.
                                </span>
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
    const router = useRouter();
    const searchParams = useSearchParams();
    const exerciseId = searchParams.get("id") ?? "";
    const {
        data: exercise = null,
        isLoading: loading,
        error,
    } = useQuery({
        queryKey: ["exam", "exercise", exerciseId],
        queryFn: () => getExamExerciseById(exerciseId).then((res) => res.data),
        enabled: !!exerciseId,
    });

    useEffect(() => {
        if (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Übung konnte nicht geladen werden.");
        }
    }, [error]);

    if (!exerciseId) {
        return (
            <div dir="ltr" className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
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
            <div dir="ltr" className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
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
        <div dir="ltr" className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Behaves like the browser's back button (returns to the Teil list this exercise was opened from). */}
                <button
                    type="button"
                    onClick={() => {
                        if (window.history.length > 1) {
                            router.back();
                        } else {
                            const levelQuery = exercise.level ? `&level=${encodeURIComponent(exercise.level)}` : "";
                            router.push(`/dashboard/exam-prep?section=${exercise.section}${levelQuery}`);
                        }
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-block"
                >
                    ← Zurück
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{exercise.title}</h1>
                    <Badge variant="secondary">{exercise.level ?? "Alle Niveaus"}</Badge>
                </div>

                {exercise.teilDescription && (
                    <div className="rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {exercise.teilDescription}
                    </div>
                )}

                {exercise.section !== "HOERVERSTEHEN" &&
                    exercise.section !== "SCHRIFTLICHER_AUSDRUCK" &&
                    exercise.section !== "TESTFORMAT_INFORMATION" && (
                    <>
                        {(exercise.taskType === "MATCHING" || exercise.taskType === "WORD_BANK_CLOZE") && (
                            <AnswerOptionsPoolView answerOptions={exercise.answerOptions ?? []} answerOptionLabels={exercise.answerOptionLabels ?? []} taskType={exercise.taskType} />
                        )}
                        <PassagesView passages={exercise.passages} taskType={exercise.taskType ?? ""} />
                    </>
                )}

                {exercise.section === "HOERVERSTEHEN" ? (
                    <HoerenListQuiz exercise={exercise} />
                ) : exercise.section === "SCHRIFTLICHER_AUSDRUCK" ? (
                    <SchriftlicherAusdruckView exercise={exercise} />
                ) : exercise.section === "TESTFORMAT_INFORMATION" ? (
                    <TestformatInformationView exercise={exercise} />
                ) : exercise.taskType === "WORD_BANK_CLOZE" || exercise.taskType === "SITUATION_MATCHING" ? (
                    <ClozeGridQuiz exercise={exercise} />
                ) : (
                    <StepQuiz exercise={exercise} />
                )}
            </div>
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
