"use client";

import { Suspense, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { getGrammarCategoryById } from "@/services/grammarService";
import { CategoryTestStatus, GrammarCategoryWithLessons } from "@/types/grammar";
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
    const queryClient = useQueryClient();
    const categoryQueryKey = ["grammar", "category", categoryId];

    // Only this category (its lessons' quizzes feed the test), cached per category.
    const { data: category, isLoading: loading, error: categoryError } = useQuery({
        queryKey: categoryQueryKey,
        queryFn: () => getGrammarCategoryById(categoryId).then((res) => res.data),
        enabled: !!categoryId,
    });

    useEffect(() => {
        if (categoryError) {
            const err = categoryError as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? t.grammar.categoryTest.failedLoadCategory);
        }
    }, [categoryError, t]);

    // Keep this page's cache and the level list's test badge in step with a new result.
    const handleStatusChange = (status: CategoryTestStatus) => {
        queryClient.setQueryData<GrammarCategoryWithLessons>(categoryQueryKey, (prev) =>
            prev ? { ...prev, testStatus: status } : prev
        );
        queryClient.invalidateQueries({ queryKey: ["grammar", "level"] });
    };

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
                        onStatusChange={handleStatusChange}
                    />
                </div>
            </div>
        </div>
    );
}
