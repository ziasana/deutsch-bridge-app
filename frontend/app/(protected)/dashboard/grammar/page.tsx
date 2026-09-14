"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import { getGrammarLessons } from "@/services/grammarService";
import { GrammarLesson } from "@/types/grammar";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import { useI18n } from "@/componenets/I18nProvider";
import { localizedLessonText } from "@/lib/grammarLocalization";

const ITEMS_PER_PAGE = 10;

export default function GrammarLessonsPage() {
    const router = useRouter();
    const { language, t } = useI18n();
    const [lessons, setLessons] = useState<GrammarLesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [levelFilter, setLevelFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        getGrammarLessons()
            .then((res) => setLessons(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load grammar lessons."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;

    const levels = Array.from(new Set(lessons.map((l) => l.level))).filter(Boolean);
    const filtered = lessons.filter((l) => {
        const localizedTitle = localizedLessonText(l, language).title;
        return (
            (levelFilter === "ALL" || l.level === levelFilter) &&
            localizedTitle.toLowerCase().includes(search.trim().toLowerCase())
        );
    });

    const isLearned = (lesson: GrammarLesson) =>
        lesson.learningProgresses?.some((lp) => lp.learned === true) ?? false;

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t.grammar.title}</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">{t.grammar.subtitle}</p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder={t.grammar.searchPlaceholder}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm flex-1 min-w-[200px]"
                    />
                    <label className="text-sm text-gray-600 dark:text-gray-300">{t.grammar.level}</label>
                    <select
                        value={levelFilter}
                        onChange={(e) => {
                            setLevelFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                        <option value="ALL">{t.grammar.allLevels}</option>
                        {levels.map((lvl) => (
                            <option key={lvl} value={lvl}>
                                {lvl}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-6 space-y-3">
                    {paginated.map((lesson) => {
                        const learned = isLearned(lesson);
                        const localized = localizedLessonText(lesson, language);
                        return (
                            <button
                                key={lesson.id}
                                onClick={() => router.push(`/dashboard/grammar/lesson?id=${lesson.id}`)}
                                dir={localized.dir}
                                className={`w-full flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden p-4 hover:shadow-xl transition ${
                                    localized.dir === "rtl" ? "text-right" : "text-left"
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                            {localized.title}
                                        </span>
                                        <Badge variant="secondary">{lesson.level}</Badge>
                                        {learned && <Badge variant="default">{t.grammar.learned}</Badge>}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                                        {localized.summary}
                                    </p>
                                </div>
                                <span className="text-gray-400 text-xl shrink-0">›</span>
                            </button>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-10">{t.grammar.notFound}</div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 pt-6">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm disabled:opacity-50"
                        >
                            {t.grammar.previous}
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            {t.grammar.pageOf(currentPage, totalPages)}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm disabled:opacity-50"
                        >
                            {t.grammar.next}
                        </button>
                    </div>
                )}
            </div>
            <ToastContainer />
        </div>
    );
}
