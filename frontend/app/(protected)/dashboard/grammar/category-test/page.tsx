"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { getGrammarCategories } from "@/services/grammarService";
import { GrammarCategoryWithLessons } from "@/types/grammar";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import CategoryTestSection from "@/componenets/CategoryTestSection";
import { useI18n } from "@/componenets/I18nProvider";

export default function CategoryTestPage() {
    return (
        <Suspense fallback={<Loading />}>
            <CategoryTestContent />
        </Suspense>
    );
}

function CategoryTestContent() {
    const searchParams = useSearchParams();
    const categoryId = searchParams.get("id") ?? "";
    const { language, dir, t } = useI18n();
    const [category, setCategory] = useState<GrammarCategoryWithLessons | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!categoryId) return;
        getGrammarCategories()
            .then((res) => {
                const found = res.data.find((c) => c.id === categoryId) ?? null;
                setCategory(found);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? t.grammar.categoryTest.failedLoadCategory))
            .finally(() => setLoading(false));
    }, [categoryId, t]);

    if (!categoryId) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10" dir={dir}>
                <div className="max-w-3xl mx-auto text-center text-gray-500 dark:text-gray-400 py-20">
                    {t.grammar.categoryNotFound}{" "}
                    <Link href="/dashboard/grammar" className="underline">
                        {t.grammar.back}
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) return <Loading />;

    if (!category) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10" dir={dir}>
                <div className="max-w-3xl mx-auto text-center text-gray-500 dark:text-gray-400 py-20">
                    {t.grammar.categoryNotFound}{" "}
                    <Link href="/dashboard/grammar" className="underline">
                        {t.grammar.back}
                    </Link>
                </div>
            </div>
        );
    }

    const title = (language === "fa" && category.titleFa) || category.title;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10" dir={dir}>
            <div className="max-w-3xl mx-auto space-y-4">
                <Link href="/dashboard/grammar" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    {t.grammar.back}
                </Link>

                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
                    <Badge variant="secondary">{category.level}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t.grammar.topicsInBlock(category.lessons.length)}
                </p>

                <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6">
                    <CategoryTestSection
                        categoryId={category.id}
                        lessons={category.lessons}
                        level={category.level}
                        passThreshold={category.passThreshold}
                        language={language}
                        initialStatus={category.testStatus}
                    />
                </div>
            </div>
        </div>
    );
}
