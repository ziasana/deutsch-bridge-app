"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import { ThumbsUp, MessageSquare, Play, ArrowRight, ChevronLeft, ChevronRight, Sparkles, Flame, Layers } from "lucide-react";
import { getExpressions, addExpressionBookmark, removeExpressionBookmark } from "@/services/expressionService";
import { Expression, ExpressionMasteryLevel, ExpressionType } from "@/types/expression";
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

const MASTERY_PRIORITY: Record<ExpressionMasteryLevel, number> = {
    LEARNING: 0,
    FAMILIAR: 1,
    ACTIVE: 2,
    NEW: 3,
    MASTERED: 4,
};

type SortOption = "recommended" | "progress" | "alphabetical";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "recommended", label: "Recommended" },
    { value: "progress", label: "Progress" },
    { value: "alphabetical", label: "Alphabetical" },
];

const ITEMS_PER_PAGE = 12;
const CONTINUE_LEARNING_COUNT = 3;

export default function ExpressionsPage() {
    const router = useRouter();
    const [expressions, setExpressions] = useState<Expression[]>([]);
    const [loading, setLoading] = useState(true);
    const [collection, setCollection] = useState<ExpressionType>("NOMEN_VERB_VERBINDUNG");
    const [search, setSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState("ALL");
    const [progressFilter, setProgressFilter] = useState("ALL");
    const [bookmarkFilter, setBookmarkFilter] = useState("ALL");
    const [sort, setSort] = useState<SortOption>("recommended");
    const [page, setPage] = useState(1);

    useEffect(() => {
        getExpressions()
            .then((res) => setExpressions(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const toggleBookmark = (expression: Expression) => {
        const wasBookmarked = expression.bookmarked;
        setExpressions((prev) => prev.map((e) => (e.id === expression.id ? { ...e, bookmarked: !wasBookmarked } : e)));

        const request = wasBookmarked ? removeExpressionBookmark(expression.id) : addExpressionBookmark(expression.id);
        request.catch((err) => {
            setExpressions((prev) => prev.map((e) => (e.id === expression.id ? { ...e, bookmarked: wasBookmarked } : e)));
            toast.error(err?.response?.data?.message ?? "Failed to update bookmark.");
        });
    };

    const collectionExpressions = useMemo(
        () => expressions.filter((e) => e.type === collection),
        [expressions, collection],
    );

    const collectionOptions: ExpressionCollectionOption[] = [
        {
            type: "NOMEN_VERB_VERBINDUNG",
            label: COLLECTION_LABEL.NOMEN_VERB_VERBINDUNG,
            count: expressions.filter((e) => e.type === "NOMEN_VERB_VERBINDUNG").length,
            icon: ThumbsUp,
        },
        {
            type: "REDEWENDUNG",
            label: COLLECTION_LABEL.REDEWENDUNG,
            count: expressions.filter((e) => e.type === "REDEWENDUNG").length,
            icon: MessageSquare,
        },
    ];

    const levels = useMemo(
        () => Array.from(new Set(collectionExpressions.map((e) => e.level))).filter(Boolean).sort(),
        [collectionExpressions],
    );

    const continueLearning = useMemo(() => {
        const candidates = collectionExpressions.filter((e) => (e.progress?.masteryLevel ?? "NEW") !== "MASTERED");
        const sorted = [...candidates].sort((a, b) => {
            const pa = MASTERY_PRIORITY[a.progress?.masteryLevel ?? "NEW"];
            const pb = MASTERY_PRIORITY[b.progress?.masteryLevel ?? "NEW"];
            if (pa !== pb) return pa - pb;
            return (a.progress?.overallScore ?? 0) - (b.progress?.overallScore ?? 0);
        });
        return { items: sorted.slice(0, CONTINUE_LEARNING_COUNT), readyCount: candidates.length };
    }, [collectionExpressions]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return collectionExpressions.filter((e) => {
            if (levelFilter !== "ALL" && e.level !== levelFilter) return false;
            const mastery = e.progress?.masteryLevel ?? "NEW";
            if (progressFilter !== "ALL" && mastery !== progressFilter) return false;
            if (bookmarkFilter === "BOOKMARKED" && !e.bookmarked) return false;
            if (!term) return true;
            return (
                e.expression.toLowerCase().includes(term) ||
                e.meaningDe.toLowerCase().includes(term) ||
                e.meaningEn.toLowerCase().includes(term) ||
                e.examples.some((ex) => ex.sentence.toLowerCase().includes(term))
            );
        });
    }, [collectionExpressions, search, levelFilter, progressFilter, bookmarkFilter]);

    const sorted = useMemo(() => {
        const list = [...filtered];
        if (sort === "alphabetical") {
            list.sort((a, b) => a.expression.localeCompare(b.expression));
        } else if (sort === "progress") {
            list.sort((a, b) => (b.progress?.overallScore ?? 0) - (a.progress?.overallScore ?? 0));
        }
        return list;
    }, [filtered, sort]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginated = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const resetPage = () => setPage(1);

    const openExpression = (expression: Expression) => router.push(`/dashboard/expressions/detail?id=${expression.id}`);
    const practiceExpression = (expression: Expression) =>
        router.push(`/dashboard/expressions/practice?expressionId=${expression.id}`);

    return (
        <div className="min-h-screen bg-background px-6 py-10">
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
                        onChange={(value) => {
                            setSearch(value);
                            resetPage();
                        }}
                        placeholder="Search by expression, meaning or example..."
                    />
                    <ExpressionFilterSelect
                        label="Level"
                        value={levelFilter}
                        onChange={(v) => {
                            setLevelFilter(v);
                            resetPage();
                        }}
                        options={[{ value: "ALL", label: "All" }, ...levels.map((l) => ({ value: l, label: l }))]}
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
                        onChange={(v) => setSort(v as SortOption)}
                        options={SORT_OPTIONS}
                    />
                </div>

                {loading ? (
                    <>
                        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <ExpressionCardSkeleton key={i} />
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <section className="mt-10">
                            <div className="flex items-end justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent">
                                        <Flame className="size-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">Continue learning</h2>
                                        <p className="mt-0.5 text-sm text-foreground/55">
                                            {continueLearning.readyCount > 0
                                                ? `You have ${continueLearning.readyCount} expressions ready to practice.`
                                                : "You're all caught up!"}
                                        </p>
                                    </div>
                                </div>
                                {continueLearning.readyCount > CONTINUE_LEARNING_COUNT && (
                                    <a
                                        href="#all-expressions"
                                        className="shrink-0 text-sm font-medium text-primary hover:underline flex items-center gap-1"
                                    >
                                        See all
                                        <ArrowRight className="size-3.5" />
                                    </a>
                                )}
                            </div>

                            {continueLearning.items.length > 0 ? (
                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {continueLearning.items.map((e) => (
                                        <ExpressionCard
                                            key={e.id}
                                            expression={e}
                                            practiceVariant="primary"
                                            onOpen={openExpression}
                                            onPractice={practiceExpression}
                                            onToggleBookmark={toggleBookmark}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-4 rounded-2xl border border-border/60 bg-card p-8 text-center shadow-card">
                                    <p className="text-foreground/60 text-sm">
                                        Continue exploring expressions below to learn more.
                                    </p>
                                </div>
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
                                <span className="text-sm text-foreground/55">{sorted.length} expressions</span>
                            </div>

                            {paginated.length > 0 ? (
                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginated.map((e) => (
                                        <ExpressionCard
                                            key={e.id}
                                            expression={e}
                                            practiceVariant="outline"
                                            onOpen={openExpression}
                                            onPractice={practiceExpression}
                                            onToggleBookmark={toggleBookmark}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-4 rounded-2xl border border-border/60 bg-card p-10 text-center shadow-card">
                                    <p className="font-semibold text-foreground">No expressions found</p>
                                    <p className="mt-1 text-sm text-foreground/55">
                                        Try changing your search or filters.
                                    </p>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-3 pt-8">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-card shadow-card text-foreground text-sm disabled:opacity-40 hover:bg-accent/50 transition"
                                    >
                                        <ChevronLeft className="size-4" />
                                        Previous
                                    </button>
                                    <span className="text-sm text-foreground/60">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-card shadow-card text-foreground text-sm disabled:opacity-40 hover:bg-accent/50 transition"
                                    >
                                        Next
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
            <ToastContainer />
        </div>
    );
}
