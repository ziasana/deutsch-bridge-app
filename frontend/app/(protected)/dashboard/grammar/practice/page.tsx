"use client";

import { Suspense, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { getGrammarLessonById } from "@/services/grammarService";
import { grammarLessonQueryKey } from "@/lib/grammarQueryCache";
import Loading from "@/componenets/Loading";
import { Dumbbell } from "lucide-react";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import GrammarQuizSection from "@/componenets/GrammarQuizSection";
import { useI18n } from "@/componenets/I18nProvider";
import { localizedLessonText } from "@/lib/grammarLocalization";

export default function GrammarPracticePage() {
    return (
        <Suspense fallback={<Loading />}>
            <GrammarPracticeContent />
        </Suspense>
    );
}

function GrammarPracticeContent() {
    const searchParams = useSearchParams();
    const lessonId = searchParams.get("id") ?? "";
    const { language, t } = useI18n();
    // Full lesson (content, examples, quiz) is only fetched here, once per lesson, and shared with
    // the practice page through the same cache entry.
    const { data: lesson, isLoading: loading, error: lessonError } = useQuery({
        queryKey: grammarLessonQueryKey(lessonId),
        queryFn: () => getGrammarLessonById(lessonId).then((res) => res.data),
        enabled: !!lessonId,
    });

    useEffect(() => {
        if (lessonError) {
            const err = lessonError as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Failed to load this lesson.");
        }
    }, [lessonError]);

    const message = (text: string) => (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-3xl rounded-[10px] bg-card p-10 text-center shadow-card">
                <p className="text-foreground/65">{text}</p>
                <Link href="/dashboard/grammar" className="mt-3 inline-block font-semibold text-primary hover:underline">
                    {t.grammar.back}
                </Link>
            </div>
        </div>
    );

    if (loading) return <Loading />;
    if (!lessonId) return message(t.grammar.noLesson);
    if (!lesson || (lesson.quiz?.length ?? 0) === 0) return message(t.grammar.notFoundLesson);

    const localized = localizedLessonText(lesson, language);

    return (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href="/dashboard/grammar" className="inline-block text-sm font-medium text-foreground/60 transition hover:text-foreground">
                            {t.grammar.back}
                    </Link>
                    <Link href={`/dashboard/grammar/lesson?id=${lesson.id}`} className="text-sm font-medium text-primary hover:underline">
                        View full lesson
                    </Link>
                </div>

                <LearningPageHero
                    icon={Dumbbell}
                    title={localized.title}
                    subtitle={localized.summary}
                    dir={localized.dir}
                    meta={<span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{lesson.level}</span>}
                />

                <GrammarQuizSection quiz={lesson.quiz ?? []} lessonId={lesson.id} lessonLevel={lesson.level} language={language} autoStart />
            </div>
        </div>
    );
}
