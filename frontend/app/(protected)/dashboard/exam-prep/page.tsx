"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import { getExamExercises } from "@/services/examService";
import { ExamExercisePublicResponse, ExamSection, ExamTaskType } from "@/types/exam";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";

const TASK_TYPE_LABELS: Record<ExamTaskType, string> = {
    MATCHING: "Überschriften zuordnen",
    MULTIPLE_CHOICE: "Multiple Choice",
    TRUE_FALSE_NOT_GIVEN: "Richtig / Falsch / Nicht im Text",
    WORD_BANK_CLOZE: "Lückentext",
};

const SPRACHBAUSTEINE_TASK_TYPE_LABELS: Partial<Record<ExamTaskType, string>> = {
    MULTIPLE_CHOICE: "Sprachbausteine Teil 1",
    WORD_BANK_CLOZE: "Sprachbausteine Teil 2",
};

const SECTION_TABS: { value: ExamSection; label: string }[] = [
    { value: "LESEVERSTEHEN", label: "Leseverstehen" },
    { value: "SPRACHBAUSTEINE", label: "Sprachbausteine" },
];

type CompletedFilter = "ALL" | "COMPLETED" | "OPEN";
const PAGE_SIZE = 6;

export default function ExamPrepPage() {
    const router = useRouter();
    const [exercises, setExercises] = useState<ExamExercisePublicResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [levelFilter, setLevelFilter] = useState("ALL");
    const [sectionFilter, setSectionFilter] = useState<ExamSection>("LESEVERSTEHEN");
    const [completedFilter, setCompletedFilter] = useState<CompletedFilter>("ALL");
    const [page, setPage] = useState(1);

    useEffect(() => {
        getExamExercises()
            .then((res) => setExercises(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load exercises."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;

    const inSection = exercises.filter((e) => e.section === sectionFilter);
    const levels = Array.from(new Set(inSection.map((e) => e.level))).sort();
    const filtered = inSection.filter(
        (e) =>
            (levelFilter === "ALL" || e.level === levelFilter) &&
            (completedFilter === "ALL" ||
                (completedFilter === "COMPLETED" ? e.completed : !e.completed))
    );

    const isLeseverstehen = sectionFilter === "LESEVERSTEHEN";

    const groupKeyOf = (e: ExamExercisePublicResponse) => (isLeseverstehen ? String(e.partNumber ?? 1) : e.taskType);
    const groupOrder = isLeseverstehen ? ["1", "2", "3"] : ["MULTIPLE_CHOICE", "WORD_BANK_CLOZE"];
    const groupLabel = (key: string) =>
        isLeseverstehen
            ? `Leseverstehen Teil ${key}`
            : SPRACHBAUSTEINE_TASK_TYPE_LABELS[key as ExamTaskType] ?? TASK_TYPE_LABELS[key as ExamTaskType] ?? key;

    const sortedFiltered = [...filtered].sort((a, b) => {
        const ai = groupOrder.indexOf(groupKeyOf(a));
        const bi = groupOrder.indexOf(groupKeyOf(b));
        return (ai === -1 ? groupOrder.length : ai) - (bi === -1 ? groupOrder.length : bi);
    });

    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageItems = sortedFiltered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const byGroup = pageItems.reduce<Record<string, ExamExercisePublicResponse[]>>((acc, e) => {
        const key = groupKeyOf(e);
        (acc[key] ??= []).push(e);
        return acc;
    }, {});
    const orderedGroupKeys = [
        ...groupOrder.filter((key) => byGroup[key]),
        ...Object.keys(byGroup).filter((key) => !groupOrder.includes(key)),
    ];

    const changeFilter = (fn: () => void) => {
        fn();
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Prüfungsvorbereitung</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Übe im echten Telc-Prüfungsformat. Nach jeder Aufgabe erhältst du eine Bewertung sowie
                    Tipps zur Lösung und häufige Fehlerquellen.
                </p>

                <div className="mt-6 flex gap-2">
                    {SECTION_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() =>
                                changeFilter(() => {
                                    setSectionFilter(tab.value);
                                    setLevelFilter("ALL");
                                })
                            }
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                sectionFilter === tab.value
                                    ? "bg-blue-600 text-white"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="mt-4 flex items-center gap-3 flex-wrap">
                    <label className="text-sm text-gray-600 dark:text-gray-300">Niveau:</label>
                    <select
                        value={levelFilter}
                        onChange={(e) => changeFilter(() => setLevelFilter(e.target.value))}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                        <option value="ALL">Alle Niveaus</option>
                        {levels.map((lvl) => (
                            <option key={lvl} value={lvl}>
                                {lvl}
                            </option>
                        ))}
                    </select>

                    <label className="text-sm text-gray-600 dark:text-gray-300">Status:</label>
                    <select
                        value={completedFilter}
                        onChange={(e) => changeFilter(() => setCompletedFilter(e.target.value as CompletedFilter))}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                        <option value="ALL">Alle</option>
                        <option value="OPEN">Noch offen</option>
                        <option value="COMPLETED">Erledigt</option>
                    </select>
                </div>

                <div className="mt-8 space-y-8">
                    {orderedGroupKeys.map((key) => {
                        const items = byGroup[key];
                        return (
                        <div key={key}>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                {groupLabel(key)}
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
                                                {exercise.completed && (
                                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                                                        Erledigt ✓
                                                    </Badge>
                                                )}
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
                        );
                    })}

                    {sortedFiltered.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                            Keine Übungen für diesen Filter gefunden.
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 disabled:opacity-40"
                        >
                            ‹ Zurück
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-300 px-2">
                            Seite {currentPage} von {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 disabled:opacity-40"
                        >
                            Weiter ›
                        </button>
                    </div>
                )}
            </div>
            <ToastContainer />
        </div>
    );
}
