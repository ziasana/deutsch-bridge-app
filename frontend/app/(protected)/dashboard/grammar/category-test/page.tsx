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
import { getLevelMeta, levelThemeVars } from "@/componenets/learning/levelMeta";
import { localizedLessonText } from "@/lib/grammarLocalization";
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
    const levelColor = getLevelMeta(category.level).color;

    return (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10" dir={dir} style={levelThemeVars(levelColor)}>
            <div className="mx-auto max-w-4xl space-y-6">
                <Link href="/dashboard/grammar" className="inline-block text-sm font-medium text-foreground/60 transition hover:text-foreground">
                    {t.grammar.back}
                </Link>

                <header
                    className="relative overflow-hidden rounded-3xl p-6 text-white shadow-md sm:p-8"
                    style={{ backgroundImage: `linear-gradient(135deg, ${levelColor}, ${levelColor}b3)` }}
                >
                    <span aria-hidden="true" className="absolute -end-10 -top-12 size-48 rounded-full bg-white/10" />
                    <span aria-hidden="true" className="absolute -bottom-16 start-1/3 size-40 rounded-full bg-white/5" />
                    <div className="relative flex items-start gap-4">
                        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 sm:size-16">
                            <ClipboardCheck className="size-7 sm:size-8" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`${chip} bg-white/25 text-white`}>{category.level}</span>
                                <span className={`${chip} bg-white/15 text-white`}>{t.grammar.categoryTest.passMark(category.passThreshold)}</span>
                                {category.testStatus.completed && (
                                    <span className={`${chip} bg-green-500 text-white`}>{t.grammar.categoryTest.completedBadge}</span>
                                )}
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h1>
                            <p className="mt-2 text-sm text-white/90 sm:text-base">{t.grammar.topicsInBlock(category.lessons.length)}</p>
                        </div>
                    </div>
                </header>

                {category.lessons.length > 0 && (
                    <div className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-border/60">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground/50">{t.grammar.categoryTest.lessonsCovered}</p>
                        <ul className="flex flex-wrap gap-2">
                            {category.lessons.map((lesson) => {
                                const heading = localizedLessonText(lesson, language);
                                return (
                                    <li key={lesson.id}>
                                        <Link
                                            href={`/dashboard/grammar/lesson?id=${lesson.id}`}
                                            dir={heading.dir}
                                            className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition hover:bg-primary/20"
                                        >
                                            {heading.title}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

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
    );
}
