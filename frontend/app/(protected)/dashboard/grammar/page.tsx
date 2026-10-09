"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { BookOpen, ChevronLeft, ChevronRight, ArrowRight, ClipboardCheck, Trophy } from "lucide-react";
import { getLevelMeta, levelThemeVars } from "@/componenets/learning/levelMeta";
import { getGrammarLevelSummary, getGrammarLevelView } from "@/services/grammarService";
import { GrammarLessonSummary } from "@/types/grammar";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import { LearningLevelOption, LearningLevelSelector, LearningSearch } from "@/componenets/learning";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import GrammarCategoryCard from "@/componenets/grammar/GrammarCategoryCard";
import GrammarLessonItem from "@/componenets/grammar/GrammarLessonItem";
import { useI18n } from "@/componenets/I18nProvider";
import { localizedLessonHeading } from "@/lib/grammarLocalization";
import useAuthStore from "@/store/useAuthStore";
import { useGrammarBookmark } from "@/hook/useGrammarBookmark";
import { usePendingGrammarBookmarks } from "@/hook/usePendingGrammarBookmarks";
import { CurrentLevelChip, SavedItemsButton, SavedItemsPanel, SavedItemsLabels } from "@/componenets/learning";
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

    const currentSummary = levelSummaries.find((s) => s.level === effectiveLevel);
    const levelColor = getLevelMeta(effectiveLevel).color;

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

    const savedItems = pendingBookmarks.map((l) => ({
        id: l.id,
        level: l.level,
        bookmarkedAt: l.bookmarkedAt,
        title: localizedLessonHeading(l, language).title,
        dir: localizedLessonHeading(l, language).dir,
    }));
    const savedLabels: SavedItemsLabels = {
        title: t.grammar.savedTitle,
        subtitle: t.grammar.savedSubtitle,
        waiting: t.grammar.savedWaiting,
        more: t.grammar.savedMore,
        remove: t.grammar.unbookmark,
    };
    const openSavedLesson = (id: string) => router.push(`/dashboard/grammar/lesson?id=${id}`);

    const toggleCollapsed = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

    // Only on the plain list: the first lesson still to learn gets the "next up" highlight and the continue card.
    const plainList = searchTerm === "" && !bookmarkedOnly;
    const nextLesson = plainList
        ? [...visibleCategories.flatMap((c) => c.lessons), ...uncategorized].find((l) => !l.learned)
        : undefined;

    const renderLessonRow = (lesson: GrammarLessonSummary, index: number, total: number) => {
        const localized = localizedLessonHeading(lesson, language);
        return (
            <GrammarLessonItem
                key={lesson.id}
                number={index + 1}
                title={localized.title}
                summary={localized.summary}
                dir={localized.dir}
                level={lesson.level}
                learned={lesson.learned}
                bookmarked={lesson.bookmarked}
                bookmarkPending={bookmarkPendingId === lesson.id}
                hasQuiz={lesson.quizCount > 0}
                nextLabel={nextLesson?.id === lesson.id ? t.grammar.nextUp : undefined}
                isLast={index === total - 1}
                labels={{ bookmark: t.grammar.bookmark, unbookmark: t.grammar.unbookmark, practice: t.grammar.practice, review: t.grammar.review }}
                onOpen={() => router.push(`/dashboard/grammar/lesson?id=${lesson.id}`)}
                onPractice={() => router.push(`/dashboard/grammar/practice?id=${lesson.id}`)}
                onToggleBookmark={() => toggleBookmark(lesson.id, lesson.bookmarked)}
            />
        );
    };

    return (
        <div className="min-h-screen bg-background px-6 py-10" style={levelThemeVars(levelColor)}>
            <div className="max-w-4xl mx-auto">
                <LearningPageHero
                    icon={BookOpen}
                    title={t.grammar.title}
                    subtitle={t.grammar.subtitle}
                    accent={levelColor}
                    bubbles
                    meta={
                        <CurrentLevelChip
                            onSelect={(level) => {
                                setSelectedLevel(level);
                                setPage(1);
                            }}
                        />
                    }
                    actionsBelow
                    actions={
                        pendingBookmarks.length > 0 && (
                            <SavedItemsButton
                                items={savedItems}
                                labels={savedLabels}
                                open={savedOpen}
                                onToggle={() => setSavedOpen((v) => !v)}
                                onOpen={openSavedLesson}
                            />
                        )
                    }
                />
                {savedOpen && pendingBookmarks.length > 0 && (
                    <SavedItemsPanel
                        items={savedItems}
                        labels={savedLabels}
                        onOpen={openSavedLesson}
                        onRemove={(id) => toggleBookmark(id, true)}
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

                {currentSummary && currentSummary.total > 0 && (
                    <div className="mt-4 flex items-center gap-4 rounded-2xl bg-card px-4 py-3 shadow-card ring-1 ring-border/60">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: levelColor }}>
                            <Trophy className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">
                                {effectiveLevel} · {t.grammar.levelProgress(currentSummary.learned, currentSummary.total)}
                            </p>
                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-valuemin={0} aria-valuemax={currentSummary.total} aria-valuenow={currentSummary.learned}>
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(currentSummary.learned / currentSummary.total) * 100}%`, backgroundColor: levelColor }} />
                            </div>
                        </div>
                    </div>
                )}

                {nextLesson && (
                    <button
                        type="button"
                        onClick={() => router.push(`/dashboard/grammar/lesson?id=${nextLesson.id}`)}
                        dir={localizedLessonHeading(nextLesson, language).dir}
                        className="group relative mt-4 flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-3xl border bg-card p-5 text-start shadow-card transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        style={{ borderColor: `${levelColor}66`, backgroundImage: `linear-gradient(135deg, ${levelColor}40, ${levelColor}14 65%, ${levelColor}0d)` }}
                    >
                        <span aria-hidden="true" className="absolute -end-8 -top-10 size-36 rounded-full" style={{ backgroundColor: `${levelColor}1a` }} />
                        <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: levelColor }}>
                            <BookOpen className="size-6" aria-hidden="true" />
                        </span>
                        <span className="relative min-w-0 flex-1">
                            <span className="block text-xs font-bold uppercase tracking-wider" style={{ color: levelColor }}>{t.grammar.continueLearning}</span>
                            <span className="block truncate text-lg font-extrabold text-foreground">{localizedLessonHeading(nextLesson, language).title}</span>
                        </span>
                        <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-white transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1" style={{ backgroundColor: levelColor }}>
                            <ArrowRight className="size-5 rtl:rotate-180" aria-hidden="true" />
                        </span>
                    </button>
                )}

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
                        className="inline-flex shrink-0 rounded-full border border-border/60 bg-card p-1 shadow-card"
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
                                    "cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition",
                                    bookmarkedOnly === onlyBookmarked ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/60 hover:text-foreground"
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
                            <GrammarCategoryCard
                                key={category.id}
                                title={title}
                                level={category.level}
                                itemCount={category.lessons.length}
                                learnedCount={learnedCount}
                                collapsed={isCollapsed}
                                onToggle={() => toggleCollapsed(category.id)}
                                topicsLabel={t.grammar.topicsCount(category.lessons.length)}
                                completedLabel={t.grammar.completedOf(learnedCount, category.lessons.length)}
                                headerExtra={
                                    <>
                                        {testStatus.completed && (
                                            <Badge variant="default" className="rounded-full">
                                                ✓ {t.grammar.categoryTestCompleted}
                                            </Badge>
                                        )}
                                        {!testStatus.completed && testStatus.attempted && (
                                            <span className="text-xs text-foreground/50">{t.grammar.lastScore(testStatus.score, testStatus.total)}</span>
                                        )}
                                    </>
                                }
                                footer={
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-primary/15 to-primary/5 p-4 ring-1 ring-primary/20">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                                <ClipboardCheck className="size-5" aria-hidden="true" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-bold text-foreground">{t.grammar.categoryTest.testTitle}</p>
                                                <p className="text-xs text-foreground/60">
                                                    {testStatus.attempted ? t.grammar.lastScore(testStatus.score, testStatus.total) : t.grammar.categoryTest.passMark(category.passThreshold)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/dashboard/grammar/category-test?id=${category.id}`);
                                            }}
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                        >
                                            {testStatus.attempted ? t.grammar.retakeCategoryTest : t.grammar.takeCategoryTest}
                                        </button>
                                    </div>
                                }
                            >
                                {category.lessons.map((lesson, i) => renderLessonRow(lesson, i, category.lessons.length))}
                            </GrammarCategoryCard>
                        );
                    })}

                    {uncategorized.length > 0 && visibleCategories.length > 0 && (
                        <p className="pt-2 text-sm font-semibold text-foreground/50">{t.grammar.otherLessons}</p>
                    )}

                    {paginated.length > 0 && (
                        <ol className="rounded-3xl bg-card p-4 shadow-card sm:p-5">
                            {paginated.map((lesson, i) => renderLessonRow(lesson, (currentPage - 1) * ITEMS_PER_PAGE + i, uncategorized.length))}
                        </ol>
                    )}

                    {levelView && visibleCategories.length === 0 && uncategorized.length === 0 && (
                        <div className="rounded-3xl bg-card py-12 text-center shadow-card">
                            <BookOpen className="mx-auto size-10 text-foreground/25" aria-hidden="true" />
                            <p className="mt-3 text-foreground/55">{bookmarkedOnly && searchTerm === "" ? t.grammar.noBookmarks : t.grammar.notFound}</p>
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 pt-6">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-card transition hover:bg-accent/50 disabled:cursor-default disabled:opacity-40"
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
                            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-card transition hover:bg-accent/50 disabled:cursor-default disabled:opacity-40"
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
