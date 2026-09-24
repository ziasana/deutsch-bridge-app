"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { ThumbsUp, MessageSquare, Play, ArrowRight, ChevronLeft, ChevronRight, Sparkles, Flame, Layers } from "lucide-react";
import {
    getExpressionCollectionSummary,
    getExpressionsPage,
    getContinueLearningExpressions,
    addExpressionBookmark,
    removeExpressionBookmark,
} from "@/services/expressionService";
import { ExpressionListItem, ExpressionMasteryLevel, ExpressionType } from "@/types/expression";
import { LearningSearch } from "@/componenets/learning";
import ExpressionCollectionSelector, {
    ExpressionCollectionOption,
} from "@/componenets/expressions/ExpressionCollectionSelector";
import ExpressionFilterSelect from "@/componenets/expressions/ExpressionFilterSelect";
import ExpressionCard from "@/componenets/expressions/ExpressionCard";
import ExpressionCardSkeleton from "@/componenets/expressions/ExpressionCardSkeleton";

const COLLECTION_LABEL: Record<ExpressionType, string> = {
    NOMEN_VERB_VERBINDUNG: "Nomen-Verb-Verbindungen",
    REDEWENDUNG: "Redewendungen",
};

const PROGRESS_LABEL: Record<ExpressionMasteryLevel, string> = {
    NEW: "New",
    LEARNING: "Learning",
    FAMILIAR: "Familiar",
    ACTIVE: "Active",
    MASTERED: "Mastered",
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

type SortOption = "recommended" | "progress" | "alphabetical";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "recommended", label: "Recommended" },
    { value: "progress", label: "Progress" },
    { value: "alphabetical", label: "Alphabetical" },
];

const ITEMS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 300;

const listQueryKey = (
    collection: ExpressionType,
    level: string,
    search: string,
    progress: string,
    bookmarked: boolean,
    sort: SortOption,
    page: number,
) => ["expressions", "list", collection, level, search, progress, bookmarked, sort, page];

export default function ExpressionsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [collection, setCollection] = useState<ExpressionType>("NOMEN_VERB_VERBINDUNG");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState("ALL");
    const [progressFilter, setProgressFilter] = useState("ALL");
    const [bookmarkFilter, setBookmarkFilter] = useState("ALL");
    const [sort, setSort] = useState<SortOption>("recommended");
    // Zero-based, matching the backend.
    const [page, setPage] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(0);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search]);

    // Two small rows (one per collection) - fills the collection cards without loading any expression.
    const { data: summaries = [], error: summaryError } = useQuery({
        queryKey: ["expressions", "collection-summary"],
        queryFn: () => getExpressionCollectionSummary().then((res) => res.data),
    });

    const { data: continueLearning, error: continueLearningError } = useQuery({
        queryKey: ["expressions", "continue-learning", collection],
        queryFn: () => getContinueLearningExpressions(collection).then((res) => res.data),
    });

    // Only the current collection's current page, list columns only. Cached server-side per
    // (collection, level, search, page, size) whenever no personal filter/sort is active - see
    // ExpressionService.findListPage. Any search term always queries the whole table, never just
    // whatever page happened to already be loaded.
    const {
        data: expressionPage,
        isLoading: listLoading,
        isPlaceholderData,
        error: listError,
    } = useQuery({
        queryKey: listQueryKey(collection, levelFilter, debouncedSearch, progressFilter, bookmarkFilter === "BOOKMARKED", sort, page),
        queryFn: () =>
            getExpressionsPage(collection, page, ITEMS_PER_PAGE, {
                level: levelFilter,
                search: debouncedSearch,
                progress: progressFilter,
                bookmarked: bookmarkFilter === "BOOKMARKED",
                sort,
            }).then((res) => res.data),
        placeholderData: keepPreviousData,
    });

    const totalPages = Math.max(1, expressionPage?.totalPages ?? 1);

    // Warm the next page so "Next" is instant.
    useEffect(() => {
        if (!expressionPage || isPlaceholderData || page + 1 >= totalPages) return;
        queryClient.prefetchQuery({
            queryKey: listQueryKey(collection, levelFilter, debouncedSearch, progressFilter, bookmarkFilter === "BOOKMARKED", sort, page + 1),
            queryFn: () =>
                getExpressionsPage(collection, page + 1, ITEMS_PER_PAGE, {
                    level: levelFilter,
                    search: debouncedSearch,
                    progress: progressFilter,
                    bookmarked: bookmarkFilter === "BOOKMARKED",
                    sort,
                }).then((res) => res.data),
        });
    }, [expressionPage, isPlaceholderData, page, totalPages, collection, levelFilter, debouncedSearch, progressFilter, bookmarkFilter, sort, queryClient]);

    useEffect(() => {
        const failure = listError ?? summaryError ?? continueLearningError;
        if (failure) {
            const err = failure as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Failed to load expressions.");
        }
    }, [listError, summaryError, continueLearningError]);

    const collectionOptions: ExpressionCollectionOption[] = [
        {
            type: "NOMEN_VERB_VERBINDUNG",
            label: COLLECTION_LABEL.NOMEN_VERB_VERBINDUNG,
            count: summaries.find((s) => s.type === "NOMEN_VERB_VERBINDUNG")?.total ?? 0,
            icon: ThumbsUp,
        },
        {
            type: "REDEWENDUNG",
            label: COLLECTION_LABEL.REDEWENDUNG,
            count: summaries.find((s) => s.type === "REDEWENDUNG")?.total ?? 0,
            icon: MessageSquare,
        },
    ];

    const setListCache = (updater: (prev: ExpressionListItem[]) => ExpressionListItem[]) => {
        queryClient.setQueryData<{ items: ExpressionListItem[] }>(
            listQueryKey(collection, levelFilter, debouncedSearch, progressFilter, bookmarkFilter === "BOOKMARKED", sort, page),
            (prev) => (prev ? { ...prev, items: updater(prev.items) } : prev),
        );
    };

    const toggleBookmark = (expression: ExpressionListItem) => {
        const wasBookmarked = expression.bookmarked;
        setListCache((prev) => prev.map((e) => (e.id === expression.id ? { ...e, bookmarked: !wasBookmarked } : e)));

        const request = wasBookmarked ? removeExpressionBookmark(expression.id) : addExpressionBookmark(expression.id);
        request.catch((err) => {
            setListCache((prev) => prev.map((e) => (e.id === expression.id ? { ...e, bookmarked: wasBookmarked } : e)));
            toast.error(err?.response?.data?.message ?? "Failed to update bookmark.");
        });
    };

    const resetPage = () => setPage(0);

    const openExpression = (expression: ExpressionListItem) => router.push(`/dashboard/expressions/detail?id=${expression.id}`);
    const practiceExpression = (expression: ExpressionListItem) =>
        router.push(`/dashboard/expressions/practice?expressionId=${expression.id}`);

    const items = expressionPage?.items ?? [];
    const currentPage = page + 1;
    const totalElements = expressionPage?.totalElements ?? 0;

    return (
        <div className="min-h-screen bg-background px-6 py-10" dir="ltr">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-start gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent">
                            <Sparkles className="size-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Active Expressions</h1>
                            <p className="mt-1 text-sm text-foreground/60">
                                Learn useful expressions, understand them in context, and use them yourself.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard/expressions/practice")}
                        className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                    >
                        <Play className="size-3.5 fill-current" />
                        Continue practicing
                        <ArrowRight className="size-4" />
                    </button>
                </header>

                <ExpressionCollectionSelector
                    className="mt-8"
                    options={collectionOptions}
                    selected={collection}
                    onSelect={(type) => {
                        setCollection(type);
                        resetPage();
                    }}
                />

                <div className="mt-6 flex flex-wrap items-start gap-3">
                    <LearningSearch
                        className="flex-1 min-w-[240px]"
                        value={search}
                        onChange={setSearch}
                        placeholder="Search by expression or meaning..."
                    />
                    <ExpressionFilterSelect
                        label="Level"
                        value={levelFilter}
                        onChange={(v) => {
                            setLevelFilter(v);
                            resetPage();
                        }}
                        options={[{ value: "ALL", label: "All" }, ...LEVELS.map((l) => ({ value: l, label: l }))]}
                    />
                    <ExpressionFilterSelect
                        label="Progress"
                        value={progressFilter}
                        onChange={(v) => {
                            setProgressFilter(v);
                            resetPage();
                        }}
                        options={[
                            { value: "ALL", label: "All" },
                            ...(Object.keys(PROGRESS_LABEL) as ExpressionMasteryLevel[]).map((m) => ({
                                value: m,
                                label: PROGRESS_LABEL[m],
                            })),
                        ]}
                    />
                    <ExpressionFilterSelect
                        label="Bookmarked"
                        value={bookmarkFilter}
                        onChange={(v) => {
                            setBookmarkFilter(v);
                            resetPage();
                        }}
                        options={[
                            { value: "ALL", label: "All" },
                            { value: "BOOKMARKED", label: "Bookmarked" },
                        ]}
                    />
                    <ExpressionFilterSelect
                        label="Sort"
                        value={sort}
                        onChange={(v) => {
                            setSort(v as SortOption);
                            resetPage();
                        }}
                        options={SORT_OPTIONS}
                    />
                </div>

                <section className="mt-10">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent">
                                <Flame className="size-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Continue learning</h2>
                                <p className="mt-0.5 text-sm text-foreground/55">
                                    {continueLearning && continueLearning.readyCount > 0
                                        ? `You have ${continueLearning.readyCount} expressions ready to practice.`
                                        : "You're all caught up!"}
                                </p>
                            </div>
                        </div>
                        {continueLearning && continueLearning.readyCount > continueLearning.items.length && (
                            <a
                                href="#all-expressions"
                                className="shrink-0 text-sm font-medium text-primary hover:underline flex items-center gap-1"
                            >
                                See all
                                <ArrowRight className="size-3.5" />
                            </a>
                        )}
                    </div>

                    {continueLearning && continueLearning.items.length > 0 ? (
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {continueLearning.items.map((e) => (
                                <ExpressionCard
                                    key={e.id}
                                    expression={e}
                                    collectionType={collection}
                                    practiceVariant="primary"
                                    onOpen={openExpression}
                                    onPractice={practiceExpression}
                                    onToggleBookmark={toggleBookmark}
                                />
                            ))}
                        </div>
                    ) : (
                        continueLearning && (
                            <div className="mt-4 rounded-2xl border border-border/60 bg-card p-8 text-center shadow-card">
                                <p className="text-foreground/60 text-sm">
                                    Continue exploring expressions below to learn more.
                                </p>
                            </div>
                        )
                    )}
                </section>

                <section id="all-expressions" className="mt-10 scroll-mt-6">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent">
                                <Layers className="size-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-semibold text-foreground">All expressions</h2>
                        </div>
                        <span className="text-sm text-foreground/55">{totalElements} expressions</span>
                    </div>

                    {listLoading && !expressionPage ? (
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <ExpressionCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className={`mt-4 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}>
                            {items.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {items.map((e) => (
                                        <ExpressionCard
                                            key={e.id}
                                            expression={e}
                                            collectionType={collection}
                                            practiceVariant="outline"
                                            onOpen={openExpression}
                                            onPractice={practiceExpression}
                                            onToggleBookmark={toggleBookmark}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-border/60 bg-card p-10 text-center shadow-card">
                                    <p className="font-semibold text-foreground">No expressions found</p>
                                    <p className="mt-1 text-sm text-foreground/55">
                                        Try changing your search or filters.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-3 pt-8">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-card shadow-card text-foreground text-sm disabled:opacity-40 hover:bg-accent/50 transition"
                            >
                                <ChevronLeft className="size-4" />
                                Previous
                            </button>
                            <span className="text-sm text-foreground/60">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage >= totalPages || isPlaceholderData}
                                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-card shadow-card text-foreground text-sm disabled:opacity-40 hover:bg-accent/50 transition"
                            >
                                Next
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
