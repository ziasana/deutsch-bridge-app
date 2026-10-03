"use client";

import { Suspense, useEffect, useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { getGrammarLessonById, setLearningProgress } from "@/services/grammarService";
import { grammarLessonQueryKey, markLessonLearnedInCache } from "@/lib/grammarQueryCache";
import Loading from "@/componenets/Loading";
import { BookOpen, Bookmark, BookmarkCheck, Check, Lightbulb, MessageSquareQuote, PlayCircle } from "lucide-react";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import GrammarQuizSection from "@/componenets/GrammarQuizSection";
import { useI18n } from "@/componenets/I18nProvider";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { isTranslatableLevel, localizedLessonText } from "@/lib/grammarLocalization";
import { useGrammarBookmark } from "@/hook/useGrammarBookmark";
import { cn } from "@/lib/utils";

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
    const queryClient = useQueryClient();
    const [updatingLearned, setUpdatingLearned] = useState(false);
    const { toggle: toggleBookmark, pendingId: bookmarkPendingId } = useGrammarBookmark();

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

    if (!lessonId) return message(t.grammar.noLesson);

    if (loading) return <Loading />;

    if (!lesson) return message(t.grammar.notFoundLesson);

    const learned = lesson.learningProgresses?.some((lp) => lp.learned === true) ?? false;
    const localized = localizedLessonText(lesson, language);
    const isTranslatable = isTranslatableLevel(lesson.level);

    const toggleLearned = () => {
        setUpdatingLearned(true);
        setLearningProgress({ lessonId: lesson.id, learned: !learned })
            .then(() => {
                markLessonLearnedInCache(queryClient, lesson.id, !learned);
                toast.success(!learned ? t.grammar.markedLearned : t.grammar.markedNotLearned);
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update progress."))
            .finally(() => setUpdatingLearned(false));
    };

    const chip = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold";

    return (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-4xl space-y-6">
                <Link href="/dashboard/grammar" className="inline-block text-sm font-medium text-foreground/60 transition hover:text-foreground">
                    {t.grammar.back}
                </Link>
                {language === "fa" && !isTranslatable && <p className="text-xs text-foreground/55">{t.grammar.notTranslatable}</p>}

                <LearningPageHero
                    icon={BookOpen}
                    title={localized.title}
                    subtitle={localized.summary}
                    dir={localized.dir}
                    meta={
                        <>
                            <span className={`${chip} bg-primary/10 text-primary`}>{lesson.level}</span>
                            {learned && (
                                <span className={`${chip} bg-green-500/10 text-green-700 dark:text-green-400`}>
                                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                                    {t.grammar.learned}
                                </span>
                            )}
                        </>
                    }
                />

                <article className="relative space-y-6 rounded-[10px] bg-card p-6 shadow-card sm:p-8" dir={localized.dir}>
                    {/* The card is white, so the button gets its own tint (and a solid fill once saved) to stay visible. */}
                    <button
                        type="button"
                        disabled={bookmarkPendingId === lesson.id}
                        onClick={() => toggleBookmark(lesson.id, lesson.bookmarked)}
                        aria-pressed={lesson.bookmarked}
                        aria-label={lesson.bookmarked ? t.grammar.unbookmark : t.grammar.bookmark}
                        title={lesson.bookmarked ? t.grammar.unbookmark : t.grammar.bookmark}
                        className={cn(
                            "absolute end-4 top-4 flex size-10 cursor-pointer items-center justify-center rounded-full border transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-60 sm:end-6 sm:top-6",
                            lesson.bookmarked
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                    >
                        {lesson.bookmarked ? <BookmarkCheck className="size-5" /> : <Bookmark className="size-5" />}
                    </button>

                    <LessonMarkdown content={localized.content} className="text-foreground/85" />

                    {lesson.videoLink && (
                        <a
                            href={lesson.videoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                            <PlayCircle className="size-4" aria-hidden="true" />
                            {t.grammar.watchVideo}
                        </a>
                    )}

                    {localized.example && (
                        <aside className="rounded-2xl border-s-4 border-primary/40 bg-accent/50 p-4 sm:p-5">
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                                <MessageSquareQuote className="size-4" aria-hidden="true" />
                                {t.grammar.example}
                            </div>
                            <LessonMarkdown content={localized.example} className="text-foreground/80" />
                        </aside>
                    )}

                    {localized.usageTips && (
                        <aside className="rounded-2xl border-s-4 border-learning-vocabulary bg-learning-vocabulary/10 p-4 sm:p-5">
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-learning-vocabulary">
                                <Lightbulb className="size-4" aria-hidden="true" />
                                {t.grammar.usageTip}
                            </div>
                            <LessonMarkdown content={localized.usageTips} className="text-foreground/80" />
                        </aside>
                    )}

                    <div className="border-t border-border/60 pt-5">
                        <button
                            type="button"
                            disabled={updatingLearned}
                            onClick={toggleLearned}
                            className={
                                learned
                                    ? "inline-flex cursor-pointer items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-5 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:opacity-60 dark:text-green-400"
                                    : "inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-60"
                            }
                        >
                            <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                            {updatingLearned ? t.grammar.saving : learned ? t.grammar.markNotLearned : t.grammar.markLearned}
                        </button>
                    </div>
                </article>

                <GrammarQuizSection quiz={lesson.quiz ?? []} lessonId={lesson.id} lessonLevel={lesson.level} language={language} />
            </div>
        </div>
    );
}
