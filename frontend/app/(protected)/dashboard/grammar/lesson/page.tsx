"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { getGrammarLessonById, setLearningProgress } from "@/services/grammarService";
import { GrammarLesson } from "@/types/grammar";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import Button from "@/componenets/Button";
import GrammarQuizSection from "@/componenets/GrammarQuizSection";
import { useI18n } from "@/componenets/I18nProvider";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { isTranslatableLevel, localizedLessonText } from "@/lib/grammarLocalization";

export default function GrammarLessonDetailPage() {
    return (
        <Suspense fallback={<Loading />}>
            <GrammarLessonDetailContent />
        </Suspense>
    );
}

function GrammarLessonDetailContent() {
    const searchParams = useSearchParams();
    const lessonId = searchParams.get("id") ?? "";
    const { language, t } = useI18n();
    const [lesson, setLesson] = useState<GrammarLesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingLearned, setUpdatingLearned] = useState(false);

    useEffect(() => {
        if (!lessonId) return;
        getGrammarLessonById(lessonId)
            .then((res) => setLesson(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load this lesson."))
            .finally(() => setLoading(false));
    }, [lessonId]);

    if (!lessonId) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
                <div className="max-w-4xl mx-auto text-center text-gray-500 dark:text-gray-400 py-20">
                    {t.grammar.noLesson}{" "}
                    <Link href="/dashboard/grammar" className="underline">
                        {t.grammar.back}
                    </Link>
                </div>
            </div>
        );
    }

    if (loading) return <Loading />;

    if (!lesson) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
                <div className="max-w-4xl mx-auto text-center text-gray-500 dark:text-gray-400 py-20">
                    {t.grammar.notFoundLesson}{" "}
                    <Link href="/dashboard/grammar" className="underline">
                        {t.grammar.back}
                    </Link>
                </div>
            </div>
        );
    }

    const learned = lesson.learningProgresses?.some((lp) => lp.learned === true) ?? false;
    const localized = localizedLessonText(lesson, language);
    const isTranslatable = isTranslatableLevel(lesson.level);

    const toggleLearned = () => {
        setUpdatingLearned(true);
        setLearningProgress({ lessonId: lesson.id, learned: !learned })
            .then(() => {
                setLesson((prev) =>
                    prev ? { ...prev, learningProgresses: [{ id: "local", learned: !learned }] } : prev
                );
                toast.success(!learned ? t.grammar.markedLearned : t.grammar.markedNotLearned);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update progress."))
            .finally(() => setUpdatingLearned(false));
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-10">
            <div className="max-w-4xl mx-auto space-y-6">
                <Link
                    href="/dashboard/grammar"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-block"
                >
                    {t.grammar.back}
                </Link>
                {language === "fa" && !isTranslatable && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.grammar.notTranslatable}</p>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-[10px] shadow-[0_5px_5px_0_rgba(82,63,105,0.05)] dark:shadow-[0_5px_5px_0_rgba(0,0,0,0.25)] p-6 space-y-4" dir={localized.dir}>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{localized.title}</h1>
                        <Badge variant="secondary">{lesson.level}</Badge>
                        {learned && <Badge variant="default">{t.grammar.learned}</Badge>}
                    </div>

                    <p className="text-gray-600 dark:text-gray-300">{localized.summary}</p>

                    <LessonMarkdown content={localized.content} className="text-gray-800 dark:text-gray-200" />

                    {lesson.videoLink && (
                        <div className="pt-1">
                            <a
                                href={lesson.videoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                {t.grammar.watchVideo}
                            </a>
                        </div>
                    )}

                    {localized.example && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                {t.grammar.example}
                            </div>
                            <LessonMarkdown content={localized.example} className="text-gray-700 dark:text-gray-300" />
                        </div>
                    )}

                    {localized.usageTips && (
                        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                            <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                                {t.grammar.usageTip}
                            </div>
                            <LessonMarkdown content={localized.usageTips} className="text-blue-700 dark:text-blue-300" />
                        </div>
                    )}

                    <div className="pt-2">
                        <Button
                            variant={learned ? "secondary" : "primary"}
                            className="text-sm px-4 py-2"
                            disabled={updatingLearned}
                            onClick={toggleLearned}
                        >
                            {updatingLearned
                                ? t.grammar.saving
                                : learned
                                ? t.grammar.markNotLearned
                                : t.grammar.markLearned}
                        </Button>
                    </div>
                </div>

                <GrammarQuizSection
                    quiz={lesson.quiz ?? []}
                    lessonId={lesson.id}
                    lessonLevel={lesson.level}
                    language={language}
                />
            </div>
        </div>
    );
}
