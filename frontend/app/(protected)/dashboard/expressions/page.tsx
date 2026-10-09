"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/componenets/Loading";
import { toast } from "@/lib/toast";
import { ThumbsUp, MessageSquare, ArrowRight, ChevronLeft, ChevronRight, Flame, Layers } from "lucide-react";
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
import ExpressionsHeader from "@/componenets/expressions/ExpressionsHeader";
import ExpressionCard from "@/componenets/expressions/ExpressionCard";
import ExpressionCardSkeleton from "@/componenets/expressions/ExpressionCardSkeleton";
import { COLLECTION_ACCENT } from "@/componenets/expressions/expressionMeta";
import { ACCENT_TITLE_COLOR, levelThemeVars } from "@/componenets/learning/levelMeta";

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

/** useSearchParams needs a Suspense boundary. */
export default function ExpressionsPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ExpressionsPageContent />
        </Suspense>
    );
}

function ExpressionsPageContent() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const params = useSearchParams();

    // The list state (collection, filters, page) lives in the URL, so "Back" from an expression or a practice
    // session returns to exactly the list the learner left - e.g. the Redewendungen, not the default collection.
    const [collection, setCollection] = useState<ExpressionType>(params.get("collection") === "REDEWENDUNG" ? "REDEWENDUNG" : "NOMEN_VERB_VERBINDUNG");
    const [search, setSearch] = useState(params.get("q") ?? "");
    const [debouncedSearch, setDebouncedSearch] = useState((params.get("q") ?? "").trim());
    const [levelFilter, setLevelFilter] = useState(LEVELS.includes(params.get("level") ?? "") ? (params.get("level") as string) : "ALL");
    const [progressFilter, setProgressFilter] = useState(params.get("progress") && params.get("progress")! in PROGRESS_LABEL ? (params.get("progress") as string) : "ALL");
    const [bookmarkFilter, setBookmarkFilter] = useState(params.get("bookmarked") === "1" ? "BOOKMARKED" : "ALL");
    const [sort, setSort] = useState<SortOption>(SORT_OPTIONS.some((o) => o.value === params.get("sort")) ? (params.get("sort") as SortOption) : "recommended");
    // Zero-based, matching the backend (the URL shows it one-based).
    const [page, setPage] = useState(Math.max(0, (Number(params.get("page")) || 1) - 1));

    // Mirror the state into the URL (replace, so filtering does not fill the history).
    useEffect(() => {
        const next = new URLSearchParams();
        if (collection !== "NOMEN_VERB_VERBINDUNG") next.set("collection", collection);
        if (debouncedSearch) next.set("q", debouncedSearch);
        if (levelFilter !== "ALL") next.set("level", levelFilter);
        if (progressFilter !== "ALL") next.set("progress", progressFilter);
        if (bookmarkFilter === "BOOKMARKED") next.set("bookmarked", "1");
        if (sort !== "recommended") next.set("sort", sort);
        if (page > 0) next.set("page", String(page + 1));
        const query = next.toString();
        router.replace(query ? `/dashboard/expressions?${query}` : "/dashboard/expressions", { scroll: false });
    }, [collection, debouncedSearch, levelFilter, progressFilter, bookmarkFilter, sort, page, router]);

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

    // How many expressions are at each mastery level in this collection: one tiny count query per level (page size 1), cached.
    const MASTERY_LEVELS: ExpressionMasteryLevel[] = ["NEW", "LEARNING", "FAMILIAR", "ACTIVE", "MASTERED"];
    const masteryQueries = useQueries({
        queries: MASTERY_LEVELS.map((level) => ({
            queryKey: ["expressions", "mastery-count", collection, level],
            queryFn: () =>
                getExpressionsPage(collection, 0, 1, { level: "ALL", search: "", progress: level, bookmarked: false, sort: "recommended" }).then(
                    (res) => res.data.totalElements,
                ),
            staleTime: 60 * 1000,
        })),
    });
    const masteryCounts = masteryQueries.every((q) => q.data !== undefined)
        ? (Object.fromEntries(MASTERY_LEVELS.map((level, i) => [level, masteryQueries[i].data as number])) as Record<ExpressionMasteryLevel, number>)
        : null;

    // Expressions floating in the header: the ones you have started (from the lists already loaded), topped up with others.
    const items = expressionPage?.items ?? [];
    const showcase = (() => {
        const pool = [...(continueLearning?.items ?? []), ...items];
        const seen = new Set<string>();
        const unique = pool.filter((e) => !seen.has(e.id) && seen.add(e.id));
        const started = unique.filter((e) => e.masteryLevel !== "NEW");
        const rest = unique.filter((e) => e.masteryLevel === "NEW");
        const MIN_BUBBLES = 3;
        const shown = started.length >= MIN_BUBBLES ? started : [...started, ...rest.slice(0, MIN_BUBBLES - started.length)];
        return shown.slice(0, 6).map((e) => e.expression);
    })();
    const currentPage = page + 1;
    const totalElements = expressionPage?.totalElements ?? 0;

    return (
        <div className="min-h-screen bg-background px-6 py-10" dir="ltr" style={levelThemeVars(COLLECTION_ACCENT[collection])}>
            <div className="max-w-4xl mx-auto">
                <ExpressionsHeader accent={COLLECTION_ACCENT[collection]} counts={masteryCounts} words={showcase} onPractice={() => router.push("/dashboard/expressions/practice")} />

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

                <section className="mt-10 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/[0.12] via-primary/[0.04] to-transparent p-4 sm:p-6">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                                <Flame className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold" style={{ color: ACCENT_TITLE_COLOR }}>Continue learning</h2>
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
                            <div className="mt-4 rounded-3xl border border-border/60 bg-card p-8 text-center shadow-card">
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
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Layers className="size-5" />
                            </div>
                            <h2 className="text-lg font-extrabold" style={{ color: ACCENT_TITLE_COLOR }}>All expressions</h2>
                        </div>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{totalElements} expressions</span>
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
                                <div className="rounded-3xl border border-border/60 bg-card p-10 text-center shadow-card">
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
                                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-default disabled:opacity-40"
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
                                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-default disabled:opacity-40"
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
