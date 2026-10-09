"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { getGrammarLessonById, getGrammarLessonNavigation, setLearningProgress } from "@/services/grammarService";
import { grammarLessonQueryKey, markLessonLearnedInCache } from "@/lib/grammarQueryCache";
import Loading from "@/componenets/Loading";
import { BookOpen, Bookmark, BookmarkCheck, Check, ChevronLeft, ChevronRight, Clock, Lightbulb, MessageSquareQuote, PartyPopper, PlayCircle } from "lucide-react";
import LessonStepper, { StepInfo } from "@/componenets/learning/LessonStepper";
import { TEXT_SIZES, TextSizeControl, useTextSize } from "@/componenets/learning/TextSize";
import { getLevelMeta, levelThemeVars } from "@/componenets/learning/levelMeta";
import GrammarQuizSection from "@/componenets/GrammarQuizSection";
import { useI18n } from "@/componenets/I18nProvider";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { isTranslatableLevel, localizedLessonHeading, localizedLessonText } from "@/lib/grammarLocalization";
import { GrammarLessonNeighbor } from "@/types/grammar";
import { useGrammarBookmark } from "@/hook/useGrammarBookmark";
import { cn } from "@/lib/utils";

/**
 * Previous/Next within the level's list order. Never gated on the quiz or on "learned" - a learner is
 * always free to move on, whether skimming or studying deeply.
 */
function LessonNavRow({
    previous,
    next,
    onNavigate,
}: Readonly<{
    previous: GrammarLessonNeighbor | null | undefined;
    next: GrammarLessonNeighbor | null | undefined;
    onNavigate: (id: string) => void;
}>) {
    const { language, t } = useI18n();
    if (!previous && !next) return null;

    const titleOf = (lesson: GrammarLessonNeighbor) =>
        localizedLessonHeading({ ...lesson, summary: "", summaryFa: null }, language).title;
    const card =
        "group flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-start shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

    return (
        <nav aria-label={`${t.grammar.previousLesson} / ${t.grammar.nextLesson}`} dir={language === "fa" ? "rtl" : "ltr"} className="flex items-stretch justify-between gap-3">
            {previous ? (
                <button type="button" onClick={() => onNavigate(previous.id)} title={titleOf(previous)} className={card}>
                    <ChevronLeft className="size-5 shrink-0 text-primary transition group-hover:-translate-x-0.5 rtl:rotate-180" aria-hidden="true" />
                    <span className="min-w-0">
                        <span className="block text-xs font-semibold uppercase tracking-wide text-foreground/45">{t.grammar.previousLesson}</span>
                        <span className="block truncate text-sm font-semibold text-foreground">{titleOf(previous)}</span>
                    </span>
                </button>
            ) : (
                <span className="flex-1" />
            )}
            {next ? (
                <button type="button" onClick={() => onNavigate(next.id)} title={titleOf(next)} className={`${card} justify-end text-end`}>
                    <span className="min-w-0">
                        <span className="block text-xs font-semibold uppercase tracking-wide text-foreground/45">{t.grammar.nextLesson}</span>
                        <span className="block truncate text-sm font-semibold text-foreground">{titleOf(next)}</span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-primary transition group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden="true" />
                </button>
            ) : (
                <span className="flex-1" />
            )}
        </nav>
    );
}

export default function GrammarLessonDetailPage() {
    return (
        <Suspense fallback={<Loading />}>
            <GrammarLessonDetailRouter />
        </Suspense>
    );
}

/**
 * Keys the content by lesson id, so Previous/Next - which push a new id onto this same route - fully
 * remount the page: the quiz answers and the in-flight button states never leak into the next lesson.
 */
function GrammarLessonDetailRouter() {
    const lessonId = useSearchParams().get("id") ?? "";
    return <GrammarLessonDetailContent key={lessonId} lessonId={lessonId} />;
}

function GrammarLessonDetailContent({ lessonId }: Readonly<{ lessonId: string }>) {
    const router = useRouter();
    const { language, t } = useI18n();
    const queryClient = useQueryClient();
    const [updatingLearned, setUpdatingLearned] = useState(false);
    const { toggle: toggleBookmark, pendingId: bookmarkPendingId } = useGrammarBookmark();
    const [textSize, setTextSize] = useTextSize("grammar.textSize");
    const articleRef = useRef<HTMLElement>(null);
    // How much of the lesson text has scrolled past the bottom of the screen (0..1).
    const [readProgress, setReadProgress] = useState(0);

    // Full lesson (content, examples, quiz) is only fetched here, once per lesson, and shared with
    // the practice page through the same cache entry.
    const { data: lesson, isLoading: loading, error: lessonError } = useQuery({
        queryKey: grammarLessonQueryKey(lessonId),
        queryFn: () => getGrammarLessonById(lessonId).then((res) => res.data),
        enabled: !!lessonId,
    });

    // Previous/Next in the level's list order - lightweight and cached server-side, so always fetch.
    const { data: navigation } = useQuery({
        queryKey: ["grammar", "navigation", lessonId],
        queryFn: () => getGrammarLessonNavigation(lessonId).then((res) => res.data),
        enabled: !!lessonId,
    });
    const goToLesson = (id: string) => router.push(`/dashboard/grammar/lesson?id=${id}`);

    // Warm the next lesson so "Next" opens instantly.
    const nextLessonId = navigation?.next?.id;
    useEffect(() => {
        if (!nextLessonId) return;
        queryClient.prefetchQuery({
            queryKey: grammarLessonQueryKey(nextLessonId),
            queryFn: () => getGrammarLessonById(nextLessonId).then((res) => res.data),
        });
    }, [nextLessonId, queryClient]);

    useEffect(() => {
        if (lessonError) {
            const err = lessonError as { response?: { data?: { message?: string } } };
            toast.error(err?.response?.data?.message ?? "Failed to load this lesson.");
        }
    }, [lessonError]);

    useEffect(() => {
        let frame = 0;
        const update = () => {
            frame = 0;
            const el = articleRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            setReadProgress(Math.min(1, Math.max(0, (window.innerHeight - rect.top) / rect.height)));
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [lesson]);

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
    const levelColor = getLevelMeta(lesson.level).color;
    const sizeClass = TEXT_SIZES[textSize];
    const hasSupplement = Boolean(localized.example || localized.usageTips);
    const hasQuiz = (lesson.quiz?.length ?? 0) > 0;
    const wordTotal = [localized.content, localized.example, localized.usageTips].join(" ").split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(wordTotal / 130));
    const steps: StepInfo[] = [
        { id: "step-explain", label: t.grammar.steps.explanation, done: learned || readProgress >= 0.5 },
        ...(hasSupplement ? [{ id: "step-example", label: t.grammar.steps.example, done: learned || readProgress >= 0.95 }] : []),
        ...(hasQuiz ? [{ id: "step-practice", label: t.grammar.steps.practice, done: learned }] : []),
    ];

    return (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10" style={levelThemeVars(levelColor)}>
            <div className="mx-auto max-w-4xl space-y-6">
                <Link href="/dashboard/grammar" className="inline-block text-sm font-medium text-foreground/60 transition hover:text-foreground">
                    {t.grammar.back}
                </Link>
                {language === "fa" && !isTranslatable && <p className="text-xs text-foreground/55">{t.grammar.notTranslatable}</p>}

                <header
                    dir={localized.dir}
                    className="relative overflow-hidden rounded-3xl p-6 text-white shadow-md sm:p-8"
                    style={{ backgroundImage: `linear-gradient(135deg, ${levelColor}, ${levelColor}b3)` }}
                >
                    <span aria-hidden="true" className="absolute -end-10 -top-12 size-48 rounded-full bg-white/10" />
                    <span aria-hidden="true" className="absolute -bottom-16 start-1/3 size-40 rounded-full bg-white/5" />
                    <button
                        type="button"
                        disabled={bookmarkPendingId === lesson.id}
                        onClick={() => toggleBookmark(lesson.id, lesson.bookmarked)}
                        aria-pressed={lesson.bookmarked}
                        aria-label={lesson.bookmarked ? t.grammar.unbookmark : t.grammar.bookmark}
                        title={lesson.bookmarked ? t.grammar.unbookmark : t.grammar.bookmark}
                        className={cn(
                            "absolute end-4 top-4 flex size-10 cursor-pointer items-center justify-center rounded-full transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-60 sm:end-6 sm:top-6",
                            lesson.bookmarked ? "bg-white text-primary shadow-md" : "bg-white/20 text-white hover:bg-white/30",
                        )}
                    >
                        {lesson.bookmarked ? <BookmarkCheck className="size-5" /> : <Bookmark className="size-5" />}
                    </button>

                    <div className="relative flex items-start gap-4 pe-12">
                        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 sm:size-16">
                            <BookOpen className="size-7 sm:size-8" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`${chip} bg-white/25 text-white`}>{lesson.level}</span>
                                {lesson.categoryTitle && <span className={`${chip} bg-white/15 text-white`}>{lesson.categoryTitle}</span>}
                                {learned && (
                                    <span className={`${chip} bg-green-500 text-white`}>
                                        <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                                        {t.grammar.learned}
                                    </span>
                                )}
                            </div>
                            <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">{localized.title}</h1>
                            {localized.summary && <p className="mt-2 text-sm leading-relaxed text-white/90 sm:text-base">{localized.summary}</p>}
                            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/80">
                                <Clock className="size-3.5" aria-hidden="true" />
                                {t.grammar.minRead(minutes)}
                            </p>
                        </div>
                    </div>
                </header>

                <LessonStepper steps={steps} progress={readProgress} label={t.grammar.progress(steps.filter((step) => step.done).length, steps.length)} />

                <article id="step-explain" ref={articleRef} className="scroll-mt-24 space-y-6" dir={localized.dir}>
                    <div className="space-y-5 rounded-3xl bg-card p-6 shadow-card sm:p-8">
                        <div className="flex justify-end" dir="ltr">
                            <TextSizeControl size={textSize} onChange={setTextSize} labels={t.grammar.textSize} />
                        </div>

                        <LessonMarkdown content={localized.content} className={cn("text-foreground/85 transition-[font-size,line-height]", sizeClass)} />

                        {lesson.videoLink && (
                            <a
                                href={lesson.videoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                            >
                                <PlayCircle className="size-5" aria-hidden="true" />
                                {t.grammar.watchVideo}
                            </a>
                        )}
                    </div>

                    {hasSupplement && (
                        <div id="step-example" className="scroll-mt-24 space-y-6">
                            {localized.example && (
                                <aside className="overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-primary/15">
                                    <div className="flex items-center gap-3 bg-primary/10 px-6 py-3 sm:px-8">
                                        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                            <MessageSquareQuote className="size-5" aria-hidden="true" />
                                        </span>
                                        <p className="font-bold text-foreground">{t.grammar.example}</p>
                                    </div>
                                    <div className="p-6 sm:p-8">
                                        <LessonMarkdown content={localized.example} className={cn("text-foreground/85 transition-[font-size,line-height]", sizeClass)} />
                                    </div>
                                </aside>
                            )}

                            {localized.usageTips && (
                                <aside className="overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-learning-vocabulary/30">
                                    <div className="flex items-center gap-3 bg-learning-vocabulary/15 px-6 py-3 sm:px-8">
                                        <span className="flex size-9 items-center justify-center rounded-xl bg-learning-vocabulary text-white">
                                            <Lightbulb className="size-5" aria-hidden="true" />
                                        </span>
                                        <p className="font-bold text-foreground">{t.grammar.usageTip}</p>
                                    </div>
                                    <div className="p-6 sm:p-8">
                                        <LessonMarkdown content={localized.usageTips} className={cn("text-foreground/85 transition-[font-size,line-height]", sizeClass)} />
                                    </div>
                                </aside>
                            )}
                        </div>
                    )}

                    <div className={cn("flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6 shadow-card transition sm:p-7", learned ? "bg-green-500/10 ring-1 ring-green-500/30" : "bg-card")}>
                        <div className="flex min-w-0 items-center gap-3">
                            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", learned ? "bg-green-500 text-white" : "bg-primary/10 text-primary")}>
                                {learned ? <PartyPopper className="size-6" aria-hidden="true" /> : <Check className="size-6" strokeWidth={3} aria-hidden="true" />}
                            </span>
                            <div className="min-w-0">
                                <p className="font-bold text-foreground">{learned ? t.grammar.learned : t.grammar.understoodTitle}</p>
                                {!learned && <p className="text-sm text-foreground/60">{t.grammar.understoodText}</p>}
                            </div>
                        </div>
                        <button
                            type="button"
                            disabled={updatingLearned}
                            onClick={toggleLearned}
                            className={
                                learned
                                    ? "inline-flex cursor-pointer items-center gap-2 rounded-full border border-green-500/30 bg-card px-5 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:opacity-60 dark:text-green-400"
                                    : "inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-60"
                            }
                        >
                            <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                            {updatingLearned ? t.grammar.saving : learned ? t.grammar.markNotLearned : t.grammar.markLearned}
                        </button>
                    </div>
                </article>

                <GrammarQuizSection quiz={lesson.quiz ?? []} lessonId={lesson.id} lessonLevel={lesson.level} language={language} />

                <LessonNavRow previous={navigation?.previous} next={navigation?.next} onNavigate={goToLesson} />
            </div>
        </div>
    );
}
