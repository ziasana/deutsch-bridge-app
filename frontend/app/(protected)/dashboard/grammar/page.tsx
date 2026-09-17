"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import { BookOpen, ChevronLeft, ChevronRight, RotateCw, ArrowRight } from "lucide-react";
import { getGrammarLessons, getGrammarCategories } from "@/services/grammarService";
import { GrammarCategoryWithLessons, GrammarLesson } from "@/types/grammar";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import { LearningLevelSelector, LearningSearch } from "@/componenets/learning";
import { CategoryAccordionCard, ContentItemRow } from "@/componenets/CategoryAccordion";
import { useI18n } from "@/componenets/I18nProvider";
import { localizedLessonText } from "@/lib/grammarLocalization";
import useAuthStore from "@/store/useAuthStore";

const ITEMS_PER_PAGE = 10;

export default function GrammarLessonsPage() {
    const router = useRouter();
    const { language, t } = useI18n();
    const { userProfile } = useAuthStore();
    const [lessons, setLessons] = useState<GrammarLesson[]>([]);
    const [categories, setCategories] = useState<GrammarCategoryWithLessons[]>([]);
    const [loading, setLoading] = useState(true);
    const [levelFilter, setLevelFilter] = useState<string | null>(null);
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

    // Defaults to the learner's own CEFR level until they explicitly pick a filter.
    const effectiveLevelFilter = levelFilter ?? userProfile?.learningLevel ?? "ALL";

    const isLearned = (lesson: GrammarLesson) =>
        lesson.learningProgresses?.some((lp) => lp.learned === true) ?? false;

    const levels = Array.from(new Set(lessons.map((l) => l.level))).filter(Boolean);
    const levelOptions = levels
        .map((level) => {
            const levelLessons = lessons.filter((l) => l.level === level);
            return {
                level,
                total: levelLessons.length,
                completed: levelLessons.filter(isLearned).length,
            };
        })
        .sort((a, b) => a.level.localeCompare(b.level));
    const searchTerm = search.trim().toLowerCase();
    const matchesSearch = (lesson: GrammarLesson) =>
        localizedLessonText(lesson, language).title.toLowerCase().includes(searchTerm);

    const categorizedLessonIds = new Set(categories.flatMap((c) => c.lessons.map((l) => l.id)));

    const visibleCategories = categories
        .filter((c) => effectiveLevelFilter === "ALL" || c.level === effectiveLevelFilter)
        .map((c) => ({ ...c, lessons: c.lessons.filter(matchesSearch) }))
        .filter((c) => c.lessons.length > 0 || searchTerm === "");

    const uncategorized = lessons.filter((l) => {
        return (
            !categorizedLessonIds.has(l.id) &&
            (effectiveLevelFilter === "ALL" || l.level === effectiveLevelFilter) &&
            matchesSearch(l)
        );
    });

    const totalPages = Math.max(1, Math.ceil(uncategorized.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginated = uncategorized.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const toggleCollapsed = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

    const renderLessonRow = (lesson: GrammarLesson) => {
        const localized = localizedLessonText(lesson, language);
        const hasQuiz = (lesson.quiz?.length ?? 0) > 0;
        const learned = isLearned(lesson);
        return (
            <ContentItemRow
                key={lesson.id}
                title={localized.title}
                description={localized.summary}
                level={lesson.level}
                learned={learned}
                dir={localized.dir}
                onClick={() => router.push(`/dashboard/grammar/lesson?id=${lesson.id}`)}
                actions={
                    hasQuiz && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/grammar/practice?id=${lesson.id}`);
                            }}
                            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition shrink-0"
                        >
                            {learned ? (
                                <>
                                    <RotateCw className="size-3.5" />
                                    {t.grammar.review}
                                </>
                            ) : (
                                <>
                                    {t.grammar.practice}
                                    <ArrowRight className="size-3.5" />
                                </>
                            )}
                        </button>
                    )
                }
            />
        );
    };

    return (
        <div className="min-h-screen bg-background px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-start gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent">
                        <BookOpen className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t.grammar.title}</h1>
                        <p className="text-foreground/60 mt-1 text-sm">{t.grammar.subtitle}</p>
                    </div>
                </div>

                <LearningLevelSelector
                    className="mt-6"
                    levels={levelOptions}
                    selectedLevel={effectiveLevelFilter === "ALL" ? null : effectiveLevelFilter}
                    onLevelChange={(level) => {
                        setLevelFilter(effectiveLevelFilter !== level ? level : "ALL");
                        setPage(1);
                    }}
                    unitLabel={t.grammar.lessonsUnit}
                    activeLabel={t.grammar.currentLevel}
                    ariaLabel={t.grammar.level}
                />

                <LearningSearch
                    className="mt-4"
                    value={search}
                    onChange={(value) => {
                        setSearch(value);
                        setPage(1);
                    }}
                    placeholder={t.grammar.searchPlaceholder}
                />

                <div className="mt-6 space-y-4">
                    {visibleCategories.map((category) => {
                        const isCollapsed = collapsed[category.id] ?? false;
                        const title = (language === "fa" && category.titleFa) || category.title;
                        const { testStatus } = category;
                        const learnedCount = category.lessons.filter(isLearned).length;
                        return (
                            <CategoryAccordionCard
                                key={category.id}
                                title={title}
                                level={category.level}
                                itemCount={category.lessons.length}
                                learnedCount={learnedCount}
                                collapsed={isCollapsed}
                                onToggle={() => toggleCollapsed(category.id)}
                                headerExtra={
                                    <>
                                        {testStatus.completed && (
                                            <Badge variant="default" className="rounded-full">
                                                ✓ Completed
                                            </Badge>
                                        )}
                                        {!testStatus.completed && testStatus.attempted && (
                                            <span className="text-xs text-foreground/50">
                                                Last score: {testStatus.score}/{testStatus.total}
                                            </span>
                                        )}
                                    </>
                                }
                                footer={
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/dashboard/grammar/category-test?id=${category.id}`);
                                        }}
                                        className="text-sm px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition"
                                    >
                                        {testStatus.attempted ? "Retake category test →" : "Take category test →"}
                                    </button>
                                }
                            >
                                {category.lessons.map((lesson) => renderLessonRow(lesson))}
                            </CategoryAccordionCard>
                        );
                    })}

                    {uncategorized.length > 0 && visibleCategories.length > 0 && (
                        <p className="text-sm font-semibold text-foreground/50 pt-2">Other lessons</p>
                    )}

                    {paginated.map((lesson) => renderLessonRow(lesson))}

                    {visibleCategories.length === 0 && uncategorized.length === 0 && (
                        <div className="text-center text-foreground/50 py-10">{t.grammar.notFound}</div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 pt-6">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-card shadow-card text-foreground text-sm disabled:opacity-40 hover:bg-accent/50 transition"
                        >
                            <ChevronLeft className="size-4" />
                            {t.grammar.previous}
                        </button>
                        <span className="text-sm text-foreground/60">
                            {t.grammar.pageOf(currentPage, totalPages)}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-card shadow-card text-foreground text-sm disabled:opacity-40 hover:bg-accent/50 transition"
                        >
                            {t.grammar.next}
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                )}
            </div>
            <ToastContainer />
        </div>
    );
}
