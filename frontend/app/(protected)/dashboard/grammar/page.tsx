"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import { getGrammarLessons, getGrammarCategories } from "@/services/grammarService";
import { GrammarCategoryWithLessons, GrammarLesson } from "@/types/grammar";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import { useI18n } from "@/componenets/I18nProvider";
import { localizedLessonText } from "@/lib/grammarLocalization";

const ITEMS_PER_PAGE = 10;

export default function GrammarLessonsPage() {
    const router = useRouter();
    const { language, t } = useI18n();
    const [lessons, setLessons] = useState<GrammarLesson[]>([]);
    const [categories, setCategories] = useState<GrammarCategoryWithLessons[]>([]);
    const [loading, setLoading] = useState(true);
    const [levelFilter, setLevelFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    useEffect(() => {
        Promise.all([getGrammarLessons(), getGrammarCategories()])
            .then(([lessonsRes, categoriesRes]) => {
                setLessons(lessonsRes.data);
                setCategories(categoriesRes.data);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load grammar lessons."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;

    const levels = Array.from(new Set(lessons.map((l) => l.level))).filter(Boolean);
    const searchTerm = search.trim().toLowerCase();
    const matchesSearch = (lesson: GrammarLesson) =>
        localizedLessonText(lesson, language).title.toLowerCase().includes(searchTerm);

    const categorizedLessonIds = new Set(categories.flatMap((c) => c.lessons.map((l) => l.id)));

    const visibleCategories = categories
        .filter((c) => levelFilter === "ALL" || c.level === levelFilter)
        .map((c) => ({ ...c, lessons: c.lessons.filter(matchesSearch) }))
        .filter((c) => c.lessons.length > 0 || searchTerm === "");

    const uncategorized = lessons.filter((l) => {
        return (
            !categorizedLessonIds.has(l.id) &&
            (levelFilter === "ALL" || l.level === levelFilter) &&
            matchesSearch(l)
        );
    });

    const isLearned = (lesson: GrammarLesson) =>
        lesson.learningProgresses?.some((lp) => lp.learned === true) ?? false;

    const totalPages = Math.max(1, Math.ceil(uncategorized.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginated = uncategorized.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const toggleCollapsed = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

    const renderLessonRow = (lesson: GrammarLesson) => {
        const learned = isLearned(lesson);
        const localized = localizedLessonText(lesson, language);
        const hasQuiz = (lesson.quiz?.length ?? 0) > 0;
        return (
            <div
                key={lesson.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/dashboard/grammar/lesson?id=${lesson.id}`)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        router.push(`/dashboard/grammar/lesson?id=${lesson.id}`);
                    }
                }}
                dir={localized.dir}
                className={`w-full flex items-center gap-4 bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] overflow-hidden p-4 hover:shadow-xl transition cursor-pointer ${
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
                        {hasQuiz && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/dashboard/grammar/practice?id=${lesson.id}`);
                                }}
                                className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/60 transition shrink-0"
                            >
                                Practice →
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">{localized.summary}</p>
                </div>
                <span className="text-gray-400 text-xl shrink-0">›</span>
            </div>
        );
    };

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

                <div className="mt-6 space-y-4">
                    {visibleCategories.map((category) => {
                        const isCollapsed = collapsed[category.id] ?? false;
                        const title = (language === "fa" && category.titleFa) || category.title;
                        const { testStatus } = category;
                        return (
                            <div
                                key={category.id}
                                className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] overflow-hidden"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleCollapsed(category.id)}
                                    className="w-full flex items-center justify-between gap-3 p-4 text-left"
                                >
                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                            {title}
                                        </span>
                                        <Badge variant="secondary">{category.level}</Badge>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {category.lessons.length} topic{category.lessons.length === 1 ? "" : "s"}
                                        </span>
                                        {testStatus.completed && (
                                            <Badge variant="default">✓ Completed</Badge>
                                        )}
                                        {!testStatus.completed && testStatus.attempted && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                Last score: {testStatus.score}/{testStatus.total}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-gray-400 shrink-0">{isCollapsed ? "▸" : "▾"}</span>
                                </button>

                                {!isCollapsed && (
                                    <div className="px-4 pb-4 space-y-3">
                                        {category.lessons.map((lesson) => renderLessonRow(lesson))}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/dashboard/grammar/category-test?id=${category.id}`);
                                            }}
                                            className="text-sm px-3 py-2 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-medium hover:bg-purple-100 dark:hover:bg-purple-900/60 transition"
                                        >
                                            {testStatus.attempted ? "Retake category test →" : "Take category test →"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {uncategorized.length > 0 && visibleCategories.length > 0 && (
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 pt-2">Other lessons</p>
                    )}

                    {paginated.map((lesson) => renderLessonRow(lesson))}

                    {visibleCategories.length === 0 && uncategorized.length === 0 && (
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
