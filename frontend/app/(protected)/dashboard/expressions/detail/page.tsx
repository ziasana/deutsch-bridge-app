"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getExpressionById, markExpressionViewed } from "@/services/expressionService";
import { Expression } from "@/types/expression";
import Loading from "@/componenets/Loading";
import Button from "@/componenets/Button";
import { Badge } from "@/componenets/ui/badge";

const CONTEXT_LABEL: Record<string, string> = {
    EVERYDAY: "Alltag",
    WORK: "Beruf",
    UNIVERSITY: "Uni",
    SOCIETY: "Gesellschaft",
    EXAM: "Prüfung",
};

function ExpressionDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [expression, setExpression] = useState<Expression | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        getExpressionById(id)
            .then((res) => setExpression(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
        // Fire-and-forget: records the first view for the recognition score without blocking the page.
        markExpressionViewed(id).catch((err) => console.error(err));
    }, [id]);

    if (loading) return <Loading />;

    if (!expression) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-10 text-center max-w-md">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nicht gefunden</h2>
                    <Button variant="primary" onClick={() => router.push("/dashboard/expressions")}>
                        Zurück zur Übersicht
                    </Button>
                </div>
            </div>
        );
    }

    const overall = Math.round(expression.progress?.overallScore ?? 0);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
            <div className="max-w-3xl mx-auto">
                <Link href="/dashboard/expressions" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    ← Zurück zur Übersicht
                </Link>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">{expression.level}</Badge>
                        <Badge variant="secondary">
                            {expression.type === "NOMEN_VERB_VERBINDUNG" ? "Nomen-Verb-Verbindung" : "Redewendung"}
                        </Badge>
                        {expression.register && <Badge variant="secondary">{expression.register}</Badge>}
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{expression.expression}</h1>

                    <div className="mb-6">
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-2 bg-green-500" style={{ width: `${overall}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Active knowledge: {overall}% · {expression.progress?.masteryLevel ?? "NEW"}
                        </p>
                    </div>

                    <section className="mb-6">
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Bedeutung
                        </h2>
                        <p className="text-lg text-gray-900 dark:text-white font-medium mb-1">{expression.meaningDe}</p>
                        {expression.meaningEn && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm">🇬🇧 {expression.meaningEn}</p>
                        )}
                        {expression.meaningFa && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm" dir="rtl">
                                🇮🇷 {expression.meaningFa}
                            </p>
                        )}
                    </section>

                    {expression.type === "REDEWENDUNG" && (expression.literalMeaning || expression.figurativeMeaning) && (
                        <section className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {expression.literalMeaning && (
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                        Wörtliche Bedeutung
                                    </h2>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm">{expression.literalMeaning}</p>
                                </div>
                            )}
                            {expression.figurativeMeaning && (
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                        Übertragene Bedeutung
                                    </h2>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm">{expression.figurativeMeaning}</p>
                                </div>
                            )}
                        </section>
                    )}

                    {expression.grammarNote && (
                        <section className="mb-6">
                            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Grammatik
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">{expression.grammarNote}</p>
                        </section>
                    )}

                    {expression.examples.length > 0 && (
                        <section className="mb-6">
                            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                Beispiele
                            </h2>
                            <div className="space-y-3">
                                {expression.examples.map((ex) => (
                                    <div key={ex.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-gray-900 dark:text-white italic">&quot;{ex.sentence}&quot;</p>
                                            {ex.context && (
                                                <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                                                    {CONTEXT_LABEL[ex.context] ?? ex.context}
                                                </span>
                                            )}
                                        </div>
                                        {ex.translationEn && (
                                            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">🇬🇧 {ex.translationEn}</p>
                                        )}
                                        {ex.translationFa && (
                                            <p className="text-gray-600 dark:text-gray-300 text-sm" dir="rtl">
                                                🇮🇷 {ex.translationFa}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {expression.patterns.length > 0 && (
                        <section className="mb-6">
                            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                Patterns
                            </h2>
                            <div className="space-y-2">
                                {expression.patterns.map((p) => (
                                    <div key={p.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                                        <p className="text-gray-900 dark:text-white text-sm font-medium">{p.pattern}</p>
                                        {p.example && <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{p.example}</p>}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {expression.usageNote && (
                        <section className="mb-6">
                            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Usage
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">{expression.usageNote}</p>
                        </section>
                    )}

                    {expression.commonMistakes && (
                        <section className="mb-8">
                            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Common mistakes
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">{expression.commonMistakes}</p>
                        </section>
                    )}

                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => router.push(`/dashboard/expressions/practice?expressionId=${expression.id}&skipIntro=1`)}
                    >
                        Practice this expression
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function ExpressionDetailPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ExpressionDetailContent />
        </Suspense>
    );
}
