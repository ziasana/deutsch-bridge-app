"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getExpressions, getDifficultExpressions } from "@/services/expressionService";
import { Expression, ExpressionType } from "@/types/expression";
import Loading from "@/componenets/Loading";
import Button from "@/componenets/Button";
import { Badge } from "@/componenets/ui/badge";

type Tab = "ALL" | ExpressionType | "DIFFICULT";

const TABS: { key: Tab; label: string }[] = [
    { key: "ALL", label: "Alle" },
    { key: "NOMEN_VERB_VERBINDUNG", label: "Nomen-Verb-Verbindungen" },
    { key: "REDEWENDUNG", label: "Redewendungen" },
    { key: "DIFFICULT", label: "Schwierig" },
];

const masteryColor: Record<string, string> = {
    NEW: "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200",
    LEARNING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    FAMILIAR: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    MASTERED: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
};

const ITEMS_PER_PAGE = 9;

export default function ExpressionsPage() {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>("ALL");
    const [expressions, setExpressions] = useState<Expression[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const request =
            tab === "DIFFICULT" ? getDifficultExpressions() : tab === "ALL" ? getExpressions() : getExpressions(tab);

        request
            .then((res) => setExpressions(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [tab]);

    const selectTab = (key: Tab) => {
        setLoading(true);
        setPage(1);
        setTab(key);
    };

    const totalPages = Math.max(1, Math.ceil(expressions.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const paginatedExpressions = expressions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                <header className="mb-6 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Active Expressions</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            Nomen-Verb-Verbindungen &amp; Redewendungen - learn to use them, not just recognize them.
                        </p>
                    </div>
                    <Button variant="primary" onClick={() => router.push("/dashboard/expressions/practice")}>
                        Start Practice Session
                    </Button>
                </header>

                <div className="flex gap-2 mb-6 flex-wrap">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => selectTab(t.key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                                tab === t.key
                                    ? "bg-blue-600 text-white"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <Loading />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedExpressions.map((e) => {
                            const mastery = e.progress?.masteryLevel ?? "NEW";
                            const overall = Math.round(e.progress?.overallScore ?? 0);
                            return (
                                <div
                                    key={e.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => router.push(`/dashboard/expressions/detail?id=${e.id}`)}
                                    onKeyDown={(ev) => {
                                        if (ev.key === "Enter" || ev.key === " ") {
                                            router.push(`/dashboard/expressions/detail?id=${e.id}`);
                                        }
                                    }}
                                    className="text-left bg-white dark:bg-gray-800 rounded-2xl shadow p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <Badge variant="secondary">{e.level}</Badge>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${masteryColor[mastery]}`}>
                                                {mastery}
                                            </span>
                                            <button
                                                onClick={(ev) => {
                                                    ev.stopPropagation();
                                                    router.push(`/dashboard/expressions/practice?expressionId=${e.id}`);
                                                }}
                                                className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/60 transition"
                                            >
                                                Practice →
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {e.type === "NOMEN_VERB_VERBINDUNG" ? "Nomen-Verb-Verbindung" : "Redewendung"}
                                        </p>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {e.expression}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{e.meaningDe}</p>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-2 bg-green-500"
                                                style={{ width: `${overall}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Active knowledge: {overall}%
                                            {e.progress ? ` · Produktion: ${Math.round(e.progress.productionScore)}%` : ""}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        {expressions.length === 0 && (
                            <p className="text-center text-gray-400 col-span-1 md:col-span-2 lg:col-span-3 py-10">
                                Keine Ergebnisse.
                            </p>
                        )}
                    </div>
                )}

                {!loading && totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-8">
                        <Button
                            variant="secondary"
                            className="px-4 py-2 text-sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Zurück
                        </Button>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                            Seite {currentPage} / {totalPages}
                        </span>
                        <Button
                            variant="secondary"
                            className="px-4 py-2 text-sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Weiter
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
