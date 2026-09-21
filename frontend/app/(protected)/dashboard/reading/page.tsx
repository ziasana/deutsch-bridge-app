"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { Newspaper, CheckCircle2, Circle, ChevronRight, RotateCw, ArrowRight } from "lucide-react";
import { getReadingArticles } from "@/services/readingService";
import { ReadingArticle } from "@/types/reading";
import Loading from "@/componenets/Loading";
import { getArticleImageSrc } from "@/lib/readingImages";
import { LearningLevelSelector, LearningSearch } from "@/componenets/learning";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import { useI18n } from "@/componenets/I18nProvider";
import useAuthStore from "@/store/useAuthStore";

const ITEMS_PER_PAGE = 8;

function formatPostedDate(iso: string, locale: string): string {
    return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

export default function ReadingPage() {
    const router = useRouter();
    const { t, language } = useI18n();
    const { userProfile } = useAuthStore();
    const [articles, setArticles] = useState<ReadingArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [levelFilter, setLevelFilter] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        getReadingArticles()
            .then((res) => setArticles(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load reading articles."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;

    // Defaults to the learner's own CEFR level until they explicitly pick a filter.
    const effectiveLevelFilter = levelFilter ?? userProfile?.learningLevel ?? "ALL";

    const isLearned = (article: ReadingArticle) =>
        article.learningProgresses?.some((lp) => lp.learned === true) ?? false;

    const levels = Array.from(new Set(articles.map((a) => a.level))).filter(Boolean);
    const levelOptions = levels
        .map((level) => {
            const levelArticles = articles.filter((a) => a.level === level);
            return {
                level,
                total: levelArticles.length,
                completed: levelArticles.filter(isLearned).length,
            };
        })
        .sort((a, b) => a.level.localeCompare(b.level));

    const searchTerm = search.trim().toLowerCase();
    const filtered = articles.filter(
        (a) =>
            (effectiveLevelFilter === "ALL" || a.level === effectiveLevelFilter) &&
            (searchTerm === "" || a.title.toLowerCase().includes(searchTerm))
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

                <LearningLevelSelector
                    className="mt-6"
                    levels={levelOptions}
                    selectedLevel={effectiveLevelFilter === "ALL" ? null : effectiveLevelFilter}
                    onLevelChange={(level) => {
                        setLevelFilter(effectiveLevelFilter !== level ? level : "ALL");
                        setPage(1);
                    }}
                    unitLabel={t.reading.textsUnit}
                    activeLabel={t.reading.currentLevel}
                    ariaLabel={t.reading.level}
                />

                <LearningSearch
                    className="mt-4"
                    value={search}
                    onChange={(value) => {
                        setSearch(value);
                        setPage(1);
                    }}
                    placeholder={t.reading.searchPlaceholder}
                />

                <div className="mt-6 space-y-3">
                    {paginated.map((article) => {
                        const learned = isLearned(article);
                        const levelColor = getLevelMeta(article.level).color;
                        return (
                            <button
                                key={article.id}
                                onClick={() => router.push(`/dashboard/reading/article?id=${article.id}`)}
                                className={`w-full flex items-center gap-4 rounded-[10px] overflow-hidden p-3 text-left transition ${
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
                                            router.push(`/dashboard/reading/article?id=${article.id}`);
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
                            </button>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="text-center text-foreground/50 py-10">
                            {t.reading.notFound}
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 pt-6">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg bg-card shadow-card text-foreground text-sm disabled:opacity-40 hover:bg-accent/50 transition"
                        >
                            {t.reading.previous}
                        </button>
                        <span className="text-sm text-foreground/60">
                            {t.reading.pageOf(currentPage, totalPages)}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
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
