"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Newspaper, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import {
    getReadingArticlesPage,
    getReadingCategories,
    getReadingLevelSummary,
    removeReadingArticleBookmark,
} from "@/services/readingService";
import Loading from "@/componenets/Loading";
import ArticleCard from "@/componenets/reading/ArticleCard";
import {
    CurrentLevelChip,
    LearningLevelOption,
    LearningLevelSelector,
    LearningSearch,
    SavedItemsButton,
    SavedItemsLabels,
    SavedItemsPanel,
} from "@/componenets/learning";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import { useI18n } from "@/componenets/I18nProvider";
import useAuthStore from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { usePendingReadingBookmarks } from "@/hook/usePendingReadingBookmarks";
import { removePendingReadingBookmark } from "@/lib/readingQueryCache";

const ITEMS_PER_PAGE = 8;
const SEARCH_DEBOUNCE_MS = 300;

function formatPostedDate(iso: string, locale: string): string {
    return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

const listQueryKey = (level: string, search: string, bookmarkedOnly: boolean, categoryId: string, page: number) => [
    "reading",
    "list",
    level,
    search,
    bookmarkedOnly,
    categoryId,
    page,
];

export default function ReadingPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { t, language } = useI18n();
    const { userProfile } = useAuthStore();
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
    const [categoryId, setCategoryId] = useState("");
    // Zero-based, matching the backend.
    const [page, setPage] = useState(0);
    const { data: pendingBookmarks = [] } = usePendingReadingBookmarks();
    const [savedOpen, setSavedOpen] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(0);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search]);

    // One small row per level - fills the level cards without loading any article.
    const { data: levelSummaries = [], isLoading: summaryLoading, error: summaryError } = useQuery({
        queryKey: ["reading", "level-summary"],
        queryFn: () => getReadingLevelSummary().then((res) => res.data),
    });

    // For the category ("Thema") filter dropdown.
    const { data: categories = [] } = useQuery({
        queryKey: ["reading", "categories"],
        queryFn: () => getReadingCategories().then((res) => res.data),
    });

    // The backend can send the literal string "null" for an unset profile level.
    const profileLevel = userProfile?.learningLevel && userProfile.learningLevel !== "null" ? userProfile.learningLevel : null;
    const effectiveLevel = selectedLevel ?? profileLevel ?? levelSummaries[0]?.level ?? "A1";

    // Only the current level's current page, list columns only. Cached per (level, search, page);
    // with a known profile level this runs in parallel with the summary instead of waiting on it.
    const {
        data: articlePage,
        isLoading: listLoading,
        isPlaceholderData,
        error: listError,
    } = useQuery({
        queryKey: listQueryKey(effectiveLevel, debouncedSearch, bookmarkedOnly, categoryId, page),
        queryFn: () =>
            getReadingArticlesPage(effectiveLevel, page, ITEMS_PER_PAGE, debouncedSearch, bookmarkedOnly, categoryId).then(
                (res) => res.data
            ),
        enabled: profileLevel !== null || selectedLevel !== null || !summaryLoading,
        placeholderData: keepPreviousData,
    });

    const totalPages = Math.max(1, articlePage?.totalPages ?? 1);

    // Warm the next page so "Next" is instant.
    useEffect(() => {
        if (!articlePage || isPlaceholderData || page + 1 >= totalPages) return;
        queryClient.prefetchQuery({
            queryKey: listQueryKey(effectiveLevel, debouncedSearch, bookmarkedOnly, categoryId, page + 1),
            queryFn: () =>
                getReadingArticlesPage(effectiveLevel, page + 1, ITEMS_PER_PAGE, debouncedSearch, bookmarkedOnly, categoryId).then(
                    (res) => res.data
                ),
        });
    }, [articlePage, isPlaceholderData, page, totalPages, effectiveLevel, debouncedSearch, bookmarkedOnly, categoryId, queryClient]);

    useEffect(() => {
        const failure = listError ?? summaryError;
        if (failure) {
            const err = failure as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Failed to load reading articles.");
        }
    }, [listError, summaryError]);

    const levelOptions: LearningLevelOption[] = levelSummaries.map((s) => ({
        level: s.level,
        total: s.total,
        completed: s.learned,
    }));

    const articles = articlePage?.items ?? [];
    const currentSummary = levelSummaries.find((s) => s.level === effectiveLevel);
    // The first text still to read is shown big as "up next" - only on the plain first page, not while searching or filtering.
    const plainList = page === 0 && !debouncedSearch && !bookmarkedOnly && !categoryId;
    const featuredIndex = plainList ? articles.findIndex((a) => !a.learned) : -1;
    const currentPage = page + 1;
    const openArticle = (id: string) => router.push(`/dashboard/reading/article?id=${id}`);

    const savedLabels: SavedItemsLabels = {
        title: t.reading.savedTitle,
        subtitle: t.reading.savedSubtitle,
        waiting: t.reading.savedWaiting,
        more: t.reading.savedMore,
        remove: t.reading.unbookmark,
    };

    const removeSaved = (id: string) => {
        setRemovingId(id);
        removeReadingArticleBookmark(id)
            .then(() => {
                removePendingReadingBookmark(queryClient, id);
                toast.success(t.readingArticle.bookmarkRemoved);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update bookmark."))
            .finally(() => setRemovingId(null));
    };

    return (
        <div className="min-h-screen bg-background px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <LearningPageHero
                    icon={Newspaper}
                    title={t.reading.title}
                    subtitle={t.reading.subtitle}
                    bubbles
                    meta={
                        <CurrentLevelChip
                            onSelect={(level) => {
                                setSelectedLevel(level);
                                setPage(0);
                            }}
                        />
                    }
                    actionsBelow
                    actions={
                        pendingBookmarks.length > 0 && (
                            <SavedItemsButton
                                items={pendingBookmarks}
                                labels={savedLabels}
                                open={savedOpen}
                                onToggle={() => setSavedOpen((v) => !v)}
                                onOpen={openArticle}
                            />
                        )
                    }
                />
                {savedOpen && pendingBookmarks.length > 0 && (
                    <SavedItemsPanel
                        items={pendingBookmarks}
                        labels={savedLabels}
                        onOpen={openArticle}
                        onRemove={removeSaved}
                        removingId={removingId}
                    />
                )}

                {(summaryLoading || listLoading) && <Loading />}

                <LearningLevelSelector
                    className="mt-6"
                    levels={levelOptions}
                    selectedLevel={effectiveLevel}
                    onLevelChange={(level) => {
                        setSelectedLevel(level);
                        setPage(0);
                    }}
                    unitLabel={t.reading.textsUnit}
                    activeLabel={t.reading.currentLevel}
                    ariaLabel={t.reading.level}
                />

                {currentSummary && currentSummary.total > 0 && (
                    <div className="mt-4 flex items-center gap-4 rounded-2xl bg-card px-4 py-3 shadow-card ring-1 ring-border/60">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: getLevelMeta(effectiveLevel).color }}>
                            <Trophy className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">
                                {effectiveLevel} · {t.reading.levelProgress(currentSummary.learned, currentSummary.total)}
                            </p>
                            <div
                                className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/10"
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={currentSummary.total}
                                aria-valuenow={currentSummary.learned}
                            >
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${(currentSummary.learned / currentSummary.total) * 100}%`, backgroundColor: getLevelMeta(effectiveLevel).color }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <LearningSearch
                        className="flex-1"
                        value={search}
                        onChange={setSearch}
                        placeholder={t.reading.searchPlaceholder}
                    />
                    <div
                        role="tablist"
                        aria-label={t.reading.bookmarkedFilter}
                        className="inline-flex shrink-0 rounded-full border border-border/60 bg-card p-1 shadow-card"
                    >
                        {[
                            { label: t.reading.showAll, value: false },
                            { label: t.reading.bookmarkedFilter, value: true },
                        ].map((tab) => (
                            <button
                                key={tab.label}
                                type="button"
                                role="tab"
                                aria-selected={bookmarkedOnly === tab.value}
                                onClick={() => {
                                    setBookmarkedOnly(tab.value);
                                    setPage(0);
                                }}
                                className={cn(
                                    "cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition",
                                    bookmarkedOnly === tab.value ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/60 hover:text-foreground"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {categories.length > 0 && (
                    <div role="group" aria-label={t.reading.category} className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
                        {[{ id: "", title: t.reading.allCategories }, ...categories].map((category) => (
                            <button
                                key={category.id || "all"}
                                type="button"
                                aria-pressed={categoryId === category.id}
                                onClick={() => {
                                    setCategoryId(category.id);
                                    setPage(0);
                                }}
                                className={cn(
                                    "shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    categoryId === category.id
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border/60 bg-card text-foreground/65 hover:border-primary/40 hover:text-foreground"
                                )}
                            >
                                {category.title}
                            </button>
                        ))}
                    </div>
                )}

                <div className={cn("mt-6 grid grid-flow-dense gap-5 transition-opacity sm:grid-cols-2", isPlaceholderData && "opacity-60")}>
                    {articles.map((article, idx) => (
                        <ArticleCard
                            key={article.id}
                            article={article}
                            featured={idx === featuredIndex}
                            featuredLabel={t.reading.nextForYou}
                            quizLabel={t.reading.quiz}
                            reviewLabel={t.reading.review}
                            newWordsLabel={t.reading.newForYou}
                            viewsLabel={t.reading.views}
                            dateLabel={formatPostedDate(article.createdAt, language === "fa" ? "fa-IR-u-ca-gregory" : "en-US")}
                            onOpen={openArticle}
                        />
                    ))}
                </div>

                {articlePage && articles.length === 0 && (
                    <div className="mt-6 rounded-3xl bg-card py-12 text-center shadow-card">
                        <Newspaper className="mx-auto size-10 text-foreground/25" aria-hidden="true" />
                        <p className="mt-3 text-foreground/55">{t.reading.notFound}</p>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-8">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-card transition hover:bg-accent/50 disabled:cursor-default disabled:opacity-40"
                        >
                            <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
                            {t.reading.previous}
                        </button>
                        <span className="text-sm font-medium tabular-nums text-foreground/60">
                            {t.reading.pageOf(currentPage, totalPages)}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage >= totalPages || isPlaceholderData}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-card transition hover:bg-accent/50 disabled:cursor-default disabled:opacity-40"
                        >
                            {t.reading.next}
                            <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
