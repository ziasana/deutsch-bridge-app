"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import { getExamExercises } from "@/services/examService";
import { ExamExercisePublicResponse, ExamTaskType } from "@/types/exam";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";

const TASK_TYPE_LABELS: Record<ExamTaskType, string> = {
    MATCHING: "Überschriften zuordnen",
    MULTIPLE_CHOICE: "Multiple Choice",
    TRUE_FALSE_NOT_GIVEN: "Richtig / Falsch / Nicht im Text",
};

export default function ExamPrepPage() {
    const router = useRouter();
    const [exercises, setExercises] = useState<ExamExercisePublicResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [levelFilter, setLevelFilter] = useState("ALL");

    useEffect(() => {
        getExamExercises("LESEVERSTEHEN")
            .then((res) => setExercises(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load exercises."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;

    const levels = Array.from(new Set(exercises.map((e) => e.level))).sort();
    const filtered = exercises.filter((e) => levelFilter === "ALL" || e.level === levelFilter);

    const byTaskType = filtered.reduce<Record<string, ExamExercisePublicResponse[]>>((acc, e) => {
        (acc[e.taskType] ??= []).push(e);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Prüfungsvorbereitung</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Übe Leseverstehen im echten Telc-Prüfungsformat. Nach jeder Aufgabe erhältst du eine
                    Bewertung sowie Tipps zur Lösung und häufige Fehlerquellen.
                </p>

                <div className="mt-6 flex items-center gap-3">
                    <label className="text-sm text-gray-600 dark:text-gray-300">Niveau:</label>
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                        <option value="ALL">Alle Niveaus</option>
                        {levels.map((lvl) => (
                            <option key={lvl} value={lvl}>
                                {lvl}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-8 space-y-8">
                    {Object.entries(byTaskType).map(([taskType, items]) => (
                        <div key={taskType}>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                {TASK_TYPE_LABELS[taskType as ExamTaskType] ?? taskType}
                            </h2>
                            <div className="space-y-3">
                                {items.map((exercise) => (
                                    <button
                                        key={exercise.id}
                                        onClick={() => router.push(`/dashboard/exam-prep/exercise?id=${exercise.id}`)}
                                        className="w-full flex items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 text-left hover:shadow-xl transition"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                                    {exercise.title}
                                                </span>
                                                <Badge variant="secondary">{exercise.level}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {exercise.questions.length} Aufgaben
                                            </p>
                                        </div>
                                        <span className="text-gray-400 text-xl shrink-0">›</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                            Keine Übungen für dieses Niveau gefunden.
                        </div>
                    )}
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}
