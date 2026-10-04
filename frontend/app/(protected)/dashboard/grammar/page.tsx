"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { BookOpen, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, RotateCw, ArrowRight } from "lucide-react";
import { getGrammarLevelSummary, getGrammarLevelView } from "@/services/grammarService";
import { GrammarLessonSummary } from "@/types/grammar";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import { LearningLevelOption, LearningLevelSelector, LearningSearch } from "@/componenets/learning";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import { CategoryAccordionCard, ContentItemRow } from "@/componenets/CategoryAccordion";
import { useI18n } from "@/componenets/I18nProvider";
import { localizedLessonHeading } from "@/lib/grammarLocalization";
import useAuthStore from "@/store/useAuthStore";
import { useGrammarBookmark } from "@/hook/useGrammarBookmark";
import { usePendingGrammarBookmarks } from "@/hook/usePendingGrammarBookmarks";
import { SavedLessonsButton, SavedLessonsPanel } from "@/componenets/grammar/SavedLessons";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

export default function GrammarLessonsPage() {
    const router = useRouter();
    const { language, t } = useI18n();
    const { userProfile } = useAuthStore();
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
    const { toggle: toggleBookmark, pendingId: bookmarkPendingId } = useGrammarBookmark();
    const { data: pendingBookmarks = [] } = usePendingGrammarBookmarks();
    const [savedOpen, setSavedOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    // One small row per level - fills the level cards without loading any lesson.
    const { data: levelSummaries = [], isLoading: summaryLoading, error: summaryError } = useQuery({
        queryKey: ["grammar", "level-summary"],
        queryFn: () => getGrammarLevelSummary().then((res) => res.data),
    });

    // The backend can send the literal string "null" for an unset profile level.
    const profileLevel = userProfile?.learningLevel && userProfile.learningLevel !== "null" ? userProfile.learningLevel : null;
    const effectiveLevel = selectedLevel ?? profileLevel ?? levelSummaries[0]?.level ?? "A1";

    // Only the current level's categories + lessons as light rows, cached per level. With a known
    // profile level this runs in parallel with the summary instead of waiting on it.
    const { data: levelView, isLoading: levelLoading, error: levelError } = useQuery({
        queryKey: ["grammar", "level", effectiveLevel],
        queryFn: () => getGrammarLevelView(effectiveLevel).then((res) => res.data),
        enabled: profileLevel !== null || selectedLevel !== null || !summaryLoading,
    });

    const queryError = levelError ?? summaryError;

    useEffect(() => {
        if (queryError) {
            const err = queryError as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Failed to load grammar lessons.");
        }
    }, [queryError]);

    const levelOptions: LearningLevelOption[] = levelSummaries.map((s) => ({
        level: s.level,
        total: s.total,
        completed: s.learned,
    }));

    const searchTerm = search.trim().toLowerCase();
    const matchesSearch = (lesson: GrammarLessonSummary) =>
        (!bookmarkedOnly || lesson.bookmarked) &&
        localizedLessonHeading(lesson, language).title.toLowerCase().includes(searchTerm);

    const visibleCategories = (levelView?.categories ?? [])
        .map((c) => ({ ...c, lessons: c.lessons.filter(matchesSearch) }))
        .filter((c) => c.lessons.length > 0 || (searchTerm === "" && !bookmarkedOnly));

    const uncategorized = (levelView?.uncategorized ?? []).filter(matchesSearch);

    const totalPages = Math.max(1, Math.ceil(uncategorized.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginated = uncategorized.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const toggleCollapsed = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

    const renderLessonRow = (lesson: GrammarLessonSummary) => {
        const localized = localizedLessonHeading(lesson, language);
        const hasQuiz = lesson.quizCount > 0;
        const learned = lesson.learned;
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
                    <>
                    <button
                        type="button"
                        disabled={bookmarkPendingId === lesson.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(lesson.id, lesson.bookmarked);
                        }}
                        aria-pressed={lesson.bookmarked}
                        aria-label={lesson.bookmarked ? t.grammar.unbookmark : t.grammar.bookmark}
                        title={lesson.bookmarked ? t.grammar.unbookmark : t.grammar.bookmark}
                        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground/45 transition hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {lesson.bookmarked ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
                    </button>
                    {hasQuiz && (
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
                    )}
                    </>
                }
            />
        );
    };

    return (
        <div className="min-h-screen bg-background px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <LearningPageHero
                    icon={BookOpen}
                    title={t.grammar.title}
                    subtitle={t.grammar.subtitle}
                    bubbles
                    actionsBelow
                    actions={
                        pendingBookmarks.length > 0 && (
                            <SavedLessonsButton lessons={pendingBookmarks} open={savedOpen} onToggle={() => setSavedOpen((v) => !v)} />
                        )
                    }
                />
                {savedOpen && pendingBookmarks.length > 0 && (
                    <SavedLessonsPanel
                        lessons={pendingBookmarks}
                        onRemoveBookmark={(id) => toggleBookmark(id, true)}
                        removingId={bookmarkPendingId}
                    />
                )}

                {(summaryLoading || levelLoading) && <Loading />}

                <LearningLevelSelector
                    className="mt-6"
                    levels={levelOptions}
                    selectedLevel={effectiveLevel}
                    onLevelChange={(level) => {
                        setSelectedLevel(level);
                        setPage(1);
                    }}
                    unitLabel={t.grammar.lessonsUnit}
                    activeLabel={t.grammar.currentLevel}
                    ariaLabel={t.grammar.level}
                />

                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <LearningSearch
                        className="min-w-[220px] flex-1"
                        value={search}
                        onChange={(value) => {
                            setSearch(value);
                            setPage(1);
                        }}
                        placeholder={t.grammar.searchPlaceholder}
                    />
                    <div
                        role="tablist"
                        aria-label={t.grammar.bookmarkedFilter}
                        className="inline-flex shrink-0 rounded-[10px] border border-border/60 bg-card p-1 shadow-card"
                    >
                        {[false, true].map((onlyBookmarked) => (
                            <button
                                key={String(onlyBookmarked)}
                                type="button"
                                role="tab"
                                aria-selected={bookmarkedOnly === onlyBookmarked}
                                onClick={() => {
                                    setBookmarkedOnly(onlyBookmarked);
                                    setPage(1);
                                }}
                                className={cn(
                                    "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                                    bookmarkedOnly === onlyBookmarked ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:text-foreground"
                                )}
                            >
                                {onlyBookmarked ? t.grammar.bookmarkedFilter : t.grammar.showAll}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    {visibleCategories.map((category) => {
                        const isCollapsed = collapsed[category.id] ?? false;
                        const title = (language === "fa" && category.titleFa) || category.title;
                        const { testStatus } = category;
                        const learnedCount = category.lessons.filter((l) => l.learned).length;
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
                                                ✓ {t.grammar.categoryTestCompleted}
                                            </Badge>
                                        )}
                                        {!testStatus.completed && testStatus.attempted && (
                                            <span className="text-xs text-foreground/50">
                                                {t.grammar.lastScore(testStatus.score, testStatus.total)}
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
                                        {testStatus.attempted ? t.grammar.retakeCategoryTest : t.grammar.takeCategoryTest}
                                    </button>
                                }
                            >
                                {category.lessons.map((lesson) => renderLessonRow(lesson))}
                            </CategoryAccordionCard>
                        );
                    })}

                    {uncategorized.length > 0 && visibleCategories.length > 0 && (
                        <p className="text-sm font-semibold text-foreground/50 pt-2">{t.grammar.otherLessons}</p>
                    )}

                    {paginated.map((lesson) => renderLessonRow(lesson))}

                    {levelView && visibleCategories.length === 0 && uncategorized.length === 0 && (
                        <div className="text-center text-foreground/50 py-10">
                            {bookmarkedOnly && searchTerm === "" ? t.grammar.noBookmarks : t.grammar.notFound}
                        </div>
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
        </div>
    );
}
