"use client";

import { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { getGrammarLessons, setLearningProgress } from "@/services/grammarService";
import {
    getExerciseProgress,
    resetExerciseProgress,
    saveExerciseAnswer,
} from "@/services/exerciseProgressService";
import { GrammarLesson, QuizQuestion } from "@/types/grammar";
import Loading from "@/componenets/Loading";
import Button from "@/componenets/Button";
import { Badge } from "@/componenets/ui/badge";

interface FlatQuestion extends QuizQuestion {
    lessonId: string;
    lessonTitle: string;
    key: string;
}

const questionKey = (lessonId: string, index: number) => `${lessonId}:${index}`;

export default function ExercisesPage() {
    const [lessons, setLessons] = useState<GrammarLesson[]>([]);
    const [answered, setAnswered] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState<string>("");
    const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
    const [wasCorrect, setWasCorrect] = useState(false);
    const [finished, setFinished] = useState(false);
    const [resumed, setResumed] = useState(false);

    const loadProgress = () =>
        getExerciseProgress().then((res) => {
            const map: Record<string, boolean> = {};
            res.data.forEach((a) => {
                map[a.questionKey] = a.correct;
            });
            setAnswered(map);
        });

    useEffect(() => {
        Promise.all([getGrammarLessons(), loadProgress()])
            .then(([lessonsRes]) => setLessons(lessonsRes.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load exercises."))
            .finally(() => setLoading(false));
    }, []);

    const questionsByLesson = useMemo(() => {
        const map: Record<string, FlatQuestion[]> = {};
        lessons.forEach((lesson) => {
            map[lesson.id] = (lesson.quiz ?? []).map((q, i) => ({
                ...q,
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                key: questionKey(lesson.id, i),
            }));
        });
        return map;
    }, [lessons]);

    const topics = useMemo(
        () =>
            lessons
                .map((lesson) => {
                    const questions = questionsByLesson[lesson.id] ?? [];
                    const answeredCount = questions.filter((q) => answered[q.key] !== undefined).length;
                    return { lesson, total: questions.length, answeredCount };
                })
                .filter((t) => t.total > 0),
        [lessons, questionsByLesson, answered]
    );

    const openTopic = (lessonId: string) => {
        const questions = questionsByLesson[lessonId] ?? [];
        const firstUnanswered = questions.findIndex((q) => answered[q.key] === undefined);
        setSelectedLessonId(lessonId);
        setCurrent(firstUnanswered === -1 ? 0 : firstUnanswered);
        setFinished(firstUnanswered === -1 && questions.length > 0);
        setResumed(firstUnanswered > 0);
        setSelected("");
        setHasAnsweredCurrent(false);
    };

    const backToTopics = () => {
        setSelectedLessonId(null);
        setFinished(false);
    };

    if (loading) return <Loading />;

    if (topics.length === 0) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
                <div className="max-w-2xl mx-auto text-center text-gray-500 dark:text-gray-400 py-20">
                    No exercises available yet. Check back once grammar lessons have been added.
                </div>
            </div>
        );
    }

    // ---- Topic selection screen ----
    if (!selectedLessonId) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Exercises</h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                        Pick a topic to practice. You can stop anytime and pick up where you left off.
                    </p>

                    <div className="mt-6 space-y-4">
                        {topics.map(({ lesson, total, answeredCount }) => {
                            const inProgress = answeredCount > 0 && answeredCount < total;
                            const done = answeredCount === total;
                            return (
                                <button
                                    key={lesson.id}
                                    onClick={() => openTopic(lesson.id)}
                                    className="w-full text-left bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {lesson.title}
                                            </h2>
                                            <Badge variant="secondary">{lesson.level}</Badge>
                                            {done && <Badge variant="default">Completed</Badge>}
                                            {inProgress && <Badge variant="outline">In progress</Badge>}
                                        </div>
                                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                                            {done ? "Review →" : inProgress ? "Continue →" : "Start →"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        {answeredCount} / {total} questions answered
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <ToastContainer />
            </div>
        );
    }

    // ---- Quiz screen for the selected topic ----
    const questions = questionsByLesson[selectedLessonId] ?? [];
    const answeredCount = questions.filter((q) => answered[q.key] !== undefined).length;
    const correctCount = questions.filter((q) => answered[q.key]).length;
    const question = questions[current];

    const checkAnswer = (answer: string | boolean) => {
        if (hasAnsweredCurrent || !question) return;
        const correct =
            String(answer).trim().toLowerCase() === String(question.answer).trim().toLowerCase();
        setWasCorrect(correct);
        setHasAnsweredCurrent(true);
        setAnswered((prev) => ({ ...prev, [question.key]: correct }));

        saveExerciseAnswer({ questionKey: question.key, correct }).catch(() => {
            toast.error("Couldn't save your progress for this question.");
        });
    };

    const next = () => {
        if (current + 1 < questions.length) {
            setCurrent((c) => c + 1);
            setSelected("");
            setHasAnsweredCurrent(false);
        } else {
            finishTopic();
        }
    };

    const finishTopic = () => {
        setFinished(true);
        const results = questions.map((q) => answered[q.key]).filter((v) => v !== undefined) as boolean[];
        const allCorrect = results.length === questions.length && results.every(Boolean);
        if (allCorrect) {
            setLearningProgress({ lessonId: selectedLessonId, learned: true }).catch(() => {
                /* best-effort */
            });
        }
    };

    const restartTopic = () => {
        const keysToReset = questions.map((q) => q.key);
        resetExerciseProgress(keysToReset)
            .then(() => {
                setAnswered((prev) => {
                    const copy = { ...prev };
                    keysToReset.forEach((k) => delete copy[k]);
                    return copy;
                });
                setCurrent(0);
                setSelected("");
                setHasAnsweredCurrent(false);
                setWasCorrect(false);
                setFinished(false);
                setResumed(false);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to reset progress."));
    };

    const lessonTitle = lessons.find((l) => l.id === selectedLessonId)?.title ?? "";

    if (finished) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
                <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{lessonTitle} — complete!</h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-4">
                        You scored {correctCount} out of {questions.length}.
                    </p>
                    <div className="flex gap-3 justify-center mt-8">
                        <Button variant="primary" onClick={restartTopic}>
                            Try again
                        </Button>
                        <Button variant="secondary" onClick={backToTopics}>
                            Back to topics
                        </Button>
                    </div>
                </div>
                <ToastContainer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={backToTopics}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
                >
                    ← Back to topics
                </button>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{lessonTitle}</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Practice tasks to reinforce your grammar and vocabulary.
                </p>

                <div className="mt-4 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>
                        Question {current + 1} of {questions.length}
                    </span>
                    {resumed && answeredCount > 0 && (
                        <Badge variant="outline">Resumed from where you left off</Badge>
                    )}
                </div>

                <div className="mt-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        {question.question}
                    </h2>

                    {question.type === "mcq" && (
                        <div className="space-y-3">
                            {question.options?.map((option) => {
                                const isSelected = selected === option;
                                const showCorrect =
                                    hasAnsweredCurrent && option.toLowerCase() === String(question.answer).toLowerCase();
                                const showWrong = hasAnsweredCurrent && isSelected && !showCorrect;
                                return (
                                    <button
                                        key={option}
                                        disabled={hasAnsweredCurrent}
                                        onClick={() => {
                                            setSelected(option);
                                            checkAnswer(option);
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                                            showCorrect
                                                ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                                                : showWrong
                                                    ? "border-red-500 bg-red-50 dark:bg-red-900/30"
                                                    : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        } text-gray-900 dark:text-white`}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {question.type === "fill" && (
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={selected}
                                disabled={hasAnsweredCurrent}
                                onChange={(e) => setSelected(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && checkAnswer(selected)}
                                placeholder="Type your answer..."
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            {!hasAnsweredCurrent && (
                                <Button variant="primary" onClick={() => checkAnswer(selected)}>
                                    Check answer
                                </Button>
                            )}
                            {hasAnsweredCurrent && (
                                <p className={wasCorrect ? "text-green-600" : "text-red-600"}>
                                    {wasCorrect
                                        ? "Correct!"
                                        : `Not quite — the correct answer is "${question.answer}".`}
                                </p>
                            )}
                        </div>
                    )}

                    {question.type === "truefalse" && (
                        <div className="flex gap-4">
                            {["True", "False"].map((label) => {
                                const value = label === "True";
                                const isSelected = selected === label;
                                const showCorrect =
                                    hasAnsweredCurrent &&
                                    String(value).toLowerCase() === String(question.answer).toLowerCase();
                                const showWrong = hasAnsweredCurrent && isSelected && !showCorrect;
                                return (
                                    <button
                                        key={label}
                                        disabled={hasAnsweredCurrent}
                                        onClick={() => {
                                            setSelected(label);
                                            checkAnswer(value);
                                        }}
                                        className={`flex-1 px-4 py-3 rounded-lg border transition ${
                                            showCorrect
                                                ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                                                : showWrong
                                                    ? "border-red-500 bg-red-50 dark:bg-red-900/30"
                                                    : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        } text-gray-900 dark:text-white`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {hasAnsweredCurrent && (
                        <div className="mt-6 flex justify-end">
                            <Button variant="primary" onClick={next}>
                                {current + 1 < questions.length ? "Next question" : "Finish"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}
