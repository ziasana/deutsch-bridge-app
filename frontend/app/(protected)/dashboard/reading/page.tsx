"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Newspaper, CheckCircle2, Circle, ChevronRight, RotateCw, ArrowRight } from "lucide-react";
import { getReadingArticlesPage, getReadingLevelSummary } from "@/services/readingService";
import Loading from "@/componenets/Loading";
import { getArticleImageSrc } from "@/lib/readingImages";
import { LearningLevelOption, LearningLevelSelector, LearningSearch } from "@/componenets/learning";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import { useI18n } from "@/componenets/I18nProvider";
import useAuthStore from "@/store/useAuthStore";

const ITEMS_PER_PAGE = 8;
const SEARCH_DEBOUNCE_MS = 300;

function formatPostedDate(iso: string, locale: string): string {
    return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

const listQueryKey = (level: string, search: string, page: number) => ["reading", "list", level, search, page];

export default function ReadingPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { t, language } = useI18n();
    const { userProfile } = useAuthStore();
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    // Zero-based, matching the backend.
    const [page, setPage] = useState(0);

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
        queryKey: listQueryKey(effectiveLevel, debouncedSearch, page),
        queryFn: () => getReadingArticlesPage(effectiveLevel, page, ITEMS_PER_PAGE, debouncedSearch).then((res) => res.data),
        enabled: profileLevel !== null || selectedLevel !== null || !summaryLoading,
        placeholderData: keepPreviousData,
    });

    const totalPages = Math.max(1, articlePage?.totalPages ?? 1);

    // Warm the next page so "Next" is instant.
    useEffect(() => {
        if (!articlePage || isPlaceholderData || page + 1 >= totalPages) return;
        queryClient.prefetchQuery({
            queryKey: listQueryKey(effectiveLevel, debouncedSearch, page + 1),
            queryFn: () =>
                getReadingArticlesPage(effectiveLevel, page + 1, ITEMS_PER_PAGE, debouncedSearch).then((res) => res.data),
        });
    }, [articlePage, isPlaceholderData, page, totalPages, effectiveLevel, debouncedSearch, queryClient]);

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
    const currentPage = page + 1;
    const openArticle = (id: string) => router.push(`/dashboard/reading/article?id=${id}`);

    return (
        <div className="min-h-screen bg-background px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-start gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Newspaper className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t.reading.title}</h1>
                        <p className="text-foreground/60 mt-1 text-sm">{t.reading.subtitle}</p>
                    </div>
                </div>

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

                <LearningSearch
                    className="mt-4"
                    value={search}
                    onChange={setSearch}
                    placeholder={t.reading.searchPlaceholder}
                />

                <div className={`mt-6 space-y-3 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}>
                    {articles.map((article) => {
                        const learned = article.learned;
                        const levelColor = getLevelMeta(article.level).color;
                        return (
                            <div
                                key={article.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => openArticle(article.id)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        openArticle(article.id);
                                    }
                                }}
                                className={`w-full flex items-center gap-4 rounded-[10px] overflow-hidden p-3 text-left transition cursor-pointer ${
                                    learned ? "" : "bg-card shadow-card hover:shadow-lg"
                                }`}
                                style={learned ? { backgroundColor: `${levelColor}14` } : undefined}
                            >
                                {learned ? (
                                    <span
                                        className="flex size-6 shrink-0 items-center justify-center rounded-full"
                                        style={{ backgroundColor: levelColor }}
                                    >
                                        <CheckCircle2 className="size-4 text-white" strokeWidth={2.5} />
                                    </span>
                                ) : (
                                    <Circle className="size-6 shrink-0 text-foreground/25" />
                                )}

                                <img
                                    src={getArticleImageSrc(article.imageUrl, article.level)}
                                    alt=""
                                    className="w-28 h-20 object-cover rounded-xl shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-lg font-semibold text-foreground truncate">
                                            {article.title}
                                        </span>
                                        {article.newWordCount > 0 && (
                                            <span className="text-xs text-foreground/50">
                                                {t.reading.newForYou(article.newWordCount)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-foreground/55 truncate mt-1">
                                        {article.topic}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-foreground/50">
                                        <span>{t.reading.views(article.viewCount)}</span>
                                        <span>
                                            {t.reading.posted(
                                                formatPostedDate(
                                                    article.createdAt,
                                                    language === "fa" ? "fa-IR-u-ca-gregory" : "en-US"
                                                )
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span
                                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                                        style={{ backgroundColor: `${levelColor}1a`, color: levelColor }}
                                    >
                                        {article.level}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openArticle(article.id);
                                        }}
                                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition shrink-0"
                                    >
                                        {learned ? (
                                            <>
                                                <RotateCw className="size-3.5" />
                                                {t.reading.review}
                                            </>
                                        ) : (
                                            <>
                                                {t.reading.quiz}
                                                <ArrowRight className="size-3.5" />
                                            </>
                                        )}
                                    </button>
                                    <ChevronRight className="size-4 text-foreground/30" />
                                </div>
                            </div>
                        );
                    })}

                    {articlePage && articles.length === 0 && (
                        <div className="text-center text-foreground/50 py-10">
                            {t.reading.notFound}
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 pt-6">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-4 py-2 rounded-lg bg-card shadow-card text-foreground text-sm disabled:opacity-40 hover:bg-accent/50 transition"
                        >
                            {t.reading.previous}
                        </button>
                        <span className="text-sm text-foreground/60">
                            {t.reading.pageOf(currentPage, totalPages)}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage >= totalPages || isPlaceholderData}
                            className="px-4 py-2 rounded-lg bg-card shadow-card text-foreground text-sm disabled:opacity-40 hover:bg-accent/50 transition"
                        >
                            {t.reading.next}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
