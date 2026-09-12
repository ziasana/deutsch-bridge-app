"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import { getReadingArticles } from "@/services/readingService";
import { ReadingArticle } from "@/types/reading";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import { getArticleImageSrc } from "@/lib/readingImages";

const ITEMS_PER_PAGE = 8;

function formatPostedDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function ReadingPage() {
    const router = useRouter();
    const [articles, setArticles] = useState<ReadingArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [levelFilter, setLevelFilter] = useState("ALL");
    const [page, setPage] = useState(1);

    useEffect(() => {
        getReadingArticles()
            .then((res) => setArticles(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load reading articles."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;

    const levels = Array.from(new Set(articles.map((a) => a.level))).filter(Boolean);
    const filtered = articles.filter((a) => levelFilter === "ALL" || a.level === levelFilter);

    const isLearned = (article: ReadingArticle) =>
        article.learningProgresses?.some((lp) => lp.learned === true) ?? false;

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Reading</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Read articles at your level and tap highlighted words to learn new vocabulary in context.
                </p>

                <div className="mt-6 flex items-center gap-3">
                    <label className="text-sm text-gray-600 dark:text-gray-300">Level:</label>
                    <select
                        value={levelFilter}
                        onChange={(e) => {
                            setLevelFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                        <option value="ALL">All levels</option>
                        {levels.map((lvl) => (
                            <option key={lvl} value={lvl}>
                                {lvl}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-6 space-y-3">
                    {paginated.map((article) => {
                        const learned = isLearned(article);
                        return (
                            <button
                                key={article.id}
                                onClick={() => router.push(`/dashboard/reading/article?id=${article.id}`)}
                                className="w-full flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden p-3 text-left hover:shadow-xl transition"
                            >
                                <img
                                    src={getArticleImageSrc(article.imageUrl, article.level)}
                                    alt=""
                                    className="w-28 h-20 object-cover rounded-xl shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                            {article.title}
                                        </span>
                                        <Badge variant="secondary">{article.level}</Badge>
                                        {learned && <Badge variant="default">Learned</Badge>}
                                        {article.newWordCount > 0 && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {article.newWordCount} new for you
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                                        {article.topic}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        <span>👁 {article.viewCount} views</span>
                                        <span>Posted {formatPostedDate(article.createdAt)}</span>
                                    </div>
                                </div>
                                <span className="text-gray-400 text-xl shrink-0">›</span>
                            </button>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                            No reading articles found.
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 pt-6">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
            <ToastContainer />
        </div>
    );
}
