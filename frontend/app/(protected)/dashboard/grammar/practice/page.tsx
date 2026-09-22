"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { getGrammarLessonById } from "@/services/grammarService";
import { GrammarLesson } from "@/types/grammar";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
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
    const [lesson, setLesson] = useState<GrammarLesson | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!lessonId) return;
        getGrammarLessonById(lessonId)
            .then((res) => setLesson(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load this lesson."))
            .finally(() => setLoading(false));
    }, [lessonId]);

    if (!lessonId || loading) {
        return loading ? (
            <Loading />
        ) : (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
                <div className="max-w-3xl mx-auto text-center text-gray-500 dark:text-gray-400 py-20">
                    {t.grammar.noLesson}{" "}
                    <Link href="/dashboard/grammar" className="underline">
                        {t.grammar.back}
                    </Link>
                </div>
            </div>
        );
    }

    if (!lesson || (lesson.quiz?.length ?? 0) === 0) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
                <div className="max-w-3xl mx-auto text-center text-gray-500 dark:text-gray-400 py-20">
                    {t.grammar.notFoundLesson}{" "}
                    <Link href="/dashboard/grammar" className="underline">
                        {t.grammar.back}
                    </Link>
                </div>
            </div>
        );
    }

    const localized = localizedLessonText(lesson, language);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <Link
                        href="/dashboard/grammar"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        {t.grammar.back}
                    </Link>
                    <Link
                        href={`/dashboard/grammar/lesson?id=${lesson.id}`}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                    >
                        View full lesson
                    </Link>
                </div>

                <div className="flex items-center gap-2 flex-wrap" dir={localized.dir}>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{localized.title}</h1>
                    <Badge variant="secondary">{lesson.level}</Badge>
                </div>

                <GrammarQuizSection
                    quiz={lesson.quiz ?? []}
                    lessonId={lesson.id}
                    lessonLevel={lesson.level}
                    language={language}
                    autoStart
                />
            </div>
        </div>
    );
}
