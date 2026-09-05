"use client";

import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { getGrammarLessons, setLearningProgress } from "@/services/grammarService";
import { GrammarLesson } from "@/types/grammar";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import Button from "@/componenets/Button";

export default function GrammarLessonsPage() {
    const [lessons, setLessons] = useState<GrammarLesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [openId, setOpenId] = useState<string | null>(null);
    const [levelFilter, setLevelFilter] = useState("ALL");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        getGrammarLessons()
            .then((res) => setLessons(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load grammar lessons."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;

    const levels = Array.from(new Set(lessons.map((l) => l.level))).filter(Boolean);

    const filtered = lessons.filter((l) => levelFilter === "ALL" || l.level === levelFilter);

    const isLearned = (lesson: GrammarLesson) =>
        lesson.learningProgresses?.some((lp) => lp.learned === true) ?? false;

    const toggleLearned = (lesson: GrammarLesson) => {
        setUpdatingId(lesson.id);
        setLearningProgress({ lessonId: lesson.id, learned: !isLearned(lesson) })
            .then(() => {
                setLessons((prev) =>
                    prev.map((l) =>
                        l.id === lesson.id
                            ? { ...l, learningProgresses: [{ id: "local", learned: !isLearned(lesson) }] }
                            : l
                    )
                );
                toast.success(!isLearned(lesson) ? "Marked as learned!" : "Marked as not learned.");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update progress."))
            .finally(() => setUpdatingId(null));
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Grammar Lessons</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Structured grammar explanations with examples and exercises.
                </p>

                <div className="mt-6 flex items-center gap-3">
                    <label className="text-sm text-gray-600 dark:text-gray-300">Level:</label>
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                        <option value="ALL">All levels</option>
                        {levels.map((lvl) => (
                            <option key={lvl} value={lvl}>
                                {lvl}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-6 space-y-4">
                    {filtered.map((lesson) => {
                        const open = openId === lesson.id;
                        const learned = isLearned(lesson);
                        return (
                            <div
                                key={lesson.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
                            >
                                <button
                                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                                    onClick={() => setOpenId(open ? null : lesson.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {lesson.title}
                                        </span>
                                        <Badge variant="secondary">{lesson.level}</Badge>
                                        {learned && <Badge variant="default">Learned</Badge>}
                                    </div>
                                    <span className="text-gray-400">{open ? "−" : "+"}</span>
                                </button>

                                {open && (
                                    <div className="px-6 pb-6 space-y-4">
                                        <p className="text-gray-600 dark:text-gray-300">{lesson.summary}</p>
                                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                                            {lesson.content}
                                        </p>
                                        {lesson.example && (
                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    Example:{" "}
                                                </span>
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    {lesson.example}
                                                </span>
                                            </div>
                                        )}
                                        {lesson.usageTips && (
                                            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                    Usage tip:{" "}
                                                </span>
                                                <span className="text-blue-700 dark:text-blue-300">
                                                    {lesson.usageTips}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-2">
                                            <a
                                                href="/dashboard/exercises"
                                                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                                            >
                                                Practice this lesson →
                                            </a>
                                            <Button
                                                variant={learned ? "secondary" : "primary"}
                                                className="text-sm px-4 py-2"
                                                disabled={updatingId === lesson.id}
                                                onClick={() => toggleLearned(lesson)}
                                            >
                                                {updatingId === lesson.id
                                                    ? "Saving..."
                                                    : learned
                                                        ? "Mark as not learned"
                                                        : "Mark as learned"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                            No grammar lessons found.
                        </div>
                    )}
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}
