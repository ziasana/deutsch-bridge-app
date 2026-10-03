"use client";

import { Suspense, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { getGrammarCategoryById } from "@/services/grammarService";
import { CategoryTestStatus, GrammarCategoryWithLessons } from "@/types/grammar";
import Loading from "@/componenets/Loading";
import { ClipboardCheck } from "lucide-react";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
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
            <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10" dir={dir}>
                <div className="mx-auto max-w-3xl rounded-[10px] bg-card p-10 text-center shadow-card">
                    <p className="text-foreground/65">{t.grammar.categoryNotFound}</p>
                    <Link href="/dashboard/grammar" className="mt-3 inline-block font-semibold text-primary hover:underline">
                        {t.grammar.back}
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) return <Loading />;

    if (!category) {
        return (
            <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10" dir={dir}>
                <div className="mx-auto max-w-3xl rounded-[10px] bg-card p-10 text-center shadow-card">
                    <p className="text-foreground/65">{t.grammar.categoryNotFound}</p>
                    <Link href="/dashboard/grammar" className="mt-3 inline-block font-semibold text-primary hover:underline">
                        {t.grammar.back}
                    </Link>
                </div>
            </div>
        );
    }

    const title = (language === "fa" && category.titleFa) || category.title;

    const chip = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold";

    return (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10" dir={dir}>
            <div className="mx-auto max-w-4xl space-y-6">
                <Link href="/dashboard/grammar" className="inline-block text-sm font-medium text-foreground/60 transition hover:text-foreground">
                    {t.grammar.back}
                </Link>

                <LearningPageHero
                    icon={ClipboardCheck}
                    title={title}
                    subtitle={t.grammar.topicsInBlock(category.lessons.length)}
                    meta={<span className={`${chip} bg-primary/10 text-primary`}>{category.level}</span>}
                />

                <div className="rounded-[10px] bg-card p-6 shadow-card sm:p-8">
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
