"use client";

import { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { getReadingArticles } from "@/services/readingService";
import { setLearningProgress } from "@/services/grammarService";
import { ReadingArticle, KeyVocabularyItem } from "@/types/reading";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import Button from "@/componenets/Button";

function HighlightedContent({
    content,
    keyVocabulary,
    activeWord,
    onWordClick,
}: Readonly<{
    content: string;
    keyVocabulary: KeyVocabularyItem[];
    activeWord: string | null;
    onWordClick: (word: string) => void;
}>) {
    const words = useMemo(
        () => keyVocabulary.filter((v) => v.word?.trim()).map((v) => v.word.trim()),
        [keyVocabulary]
    );

    if (words.length === 0) {
        return <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">{content}</p>;
    }

    const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    // Word-boundary lookarounds use \p{L} (any Unicode letter) rather than \b, since \b only
    // recognizes ASCII word characters and would misplace boundaries around German umlauts.
    const pattern = new RegExp(`(?<![\\p{L}])(${escaped.join("|")})(?![\\p{L}])`, "giu");
    const parts = content.split(pattern);

    return (
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
            {parts.map((part, idx) => {
                const match = words.find((w) => w.toLowerCase() === part.toLowerCase());
                if (!match) return <span key={idx}>{part}</span>;

                const isActive = activeWord?.toLowerCase() === part.toLowerCase();
                return (
                    <mark
                        key={idx}
                        onClick={() => onWordClick(part)}
                        className={`cursor-pointer rounded px-0.5 not-italic ${
                            isActive
                                ? "bg-blue-300 dark:bg-blue-600"
                                : "bg-yellow-200 dark:bg-yellow-700/60 hover:bg-yellow-300 dark:hover:bg-yellow-600/60"
                        }`}
                    >
                        {part}
                    </mark>
                );
            })}
        </p>
    );
}

export default function ReadingPage() {
    const [articles, setArticles] = useState<ReadingArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [openId, setOpenId] = useState<string | null>(null);
    const [levelFilter, setLevelFilter] = useState("ALL");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [activeWord, setActiveWord] = useState<{ articleId: string; word: string } | null>(null);

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

    const toggleLearned = (article: ReadingArticle) => {
        setUpdatingId(article.id);
        setLearningProgress({ readingId: article.id, learned: !isLearned(article) })
            .then(() => {
                setArticles((prev) =>
                    prev.map((a) =>
                        a.id === article.id
                            ? { ...a, learningProgresses: [{ id: "local", learned: !isLearned(article) }] }
                            : a
                    )
                );
                toast.success(!isLearned(article) ? "Marked as learned!" : "Marked as not learned.");
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update progress."))
            .finally(() => setUpdatingId(null));
    };

    const findMeaning = (article: ReadingArticle, word: string) =>
        article.keyVocabulary.find((v) => v.word.toLowerCase() === word.toLowerCase())?.meaning;

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
                        onChange={(e) => setLevelFilter(e.target.value)}
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

                <div className="mt-6 space-y-4">
                    {filtered.map((article) => {
                        const open = openId === article.id;
                        const learned = isLearned(article);
                        const active =
                            activeWord?.articleId === article.id ? activeWord.word : null;
                        const meaning = active ? findMeaning(article, active) : null;

                        return (
                            <div
                                key={article.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
                            >
                                <button
                                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                                    onClick={() => {
                                        setOpenId(open ? null : article.id);
                                        setActiveWord(null);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {article.title}
                                        </span>
                                        <Badge variant="secondary">{article.level}</Badge>
                                        {learned && <Badge variant="default">Learned</Badge>}
                                    </div>
                                    <span className="text-gray-400">{open ? "−" : "+"}</span>
                                </button>

                                {open && (
                                    <div className="px-6 pb-6 space-y-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                            {article.topic}
                                        </p>

                                        <HighlightedContent
                                            content={article.content}
                                            keyVocabulary={article.keyVocabulary}
                                            activeWord={active}
                                            onWordClick={(word) =>
                                                setActiveWord({ articleId: article.id, word })
                                            }
                                        />

                                        {active && meaning && (
                                            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                    {active}:{" "}
                                                </span>
                                                <span className="text-blue-700 dark:text-blue-300">{meaning}</span>
                                            </div>
                                        )}

                                        {article.keyVocabulary.length > 0 && (
                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                                                    Key vocabulary
                                                </span>
                                                <div className="flex flex-wrap gap-2">
                                                    {article.keyVocabulary.map((v) => (
                                                        <button
                                                            key={v.word}
                                                            onClick={() =>
                                                                setActiveWord({ articleId: article.id, word: v.word })
                                                            }
                                                            className="text-xs px-2 py-1 rounded-full bg-yellow-200 dark:bg-yellow-700/60 text-gray-800 dark:text-gray-100"
                                                        >
                                                            {v.word}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-end pt-2">
                                            <Button
                                                variant={learned ? "secondary" : "primary"}
                                                className="text-sm px-4 py-2"
                                                disabled={updatingId === article.id}
                                                onClick={() => toggleLearned(article)}
                                            >
                                                {updatingId === article.id
                                                    ? "Saving..."
                                                    : learned
                                                        ? "Mark as not learned"
                                                        : "Mark as learned"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                            No reading articles found.
                        </div>
                    )}
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}
