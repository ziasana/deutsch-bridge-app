"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import Loading from "@/componenets/Loading";
import GrammarCategoryCard from "@/componenets/grammar/GrammarCategoryCard";
import GrammarLessonItem from "@/componenets/grammar/GrammarLessonItem";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import { getLevelMeta, levelThemeVars } from "@/componenets/learning/levelMeta";
import LevelPicker from "@/componenets/marketing/learn/LevelPicker";
import UnlockBanner from "@/componenets/marketing/learn/UnlockBanner";
import { useUnlockPrompt } from "@/componenets/marketing/learn/UnlockPrompt";
import { usePublicOverview } from "@/componenets/marketing/learn/usePublicOverview";
import { useMarketing } from "@/componenets/marketing/useMarketing";
import { getPublicGrammarLevel } from "@/services/publicLearnService";
import type { PublicGrammarLesson } from "@/types/publicLearn";
import { useI18n } from "@/componenets/I18nProvider";

/** The dashboard's grammar page for visitors: level, topics, a lesson path per topic. The first lesson of each topic is open, the rest locked. */
export default function PublicGrammarPage() {
    const router = useRouter();
    const { m } = useMarketing();
    const { language, t } = useI18n();
    const l = m.learnPage;
    const { show, dialog } = useUnlockPrompt();
    const [selected, setSelected] = useState<string | null>(null);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    const { data: overview, isPending: overviewPending, isError: overviewError } = usePublicOverview();
    const counts = overview?.grammar ?? [];
    const effective = selected ?? counts.find((c) => c.total > 0)?.level ?? "A1";
    const levelColor = getLevelMeta(effective).color;

    const { data: view, isPending: viewPending, isError: viewError, refetch } = useQuery({
        queryKey: ["public", "learn", "grammar", effective],
        queryFn: () => getPublicGrammarLevel(effective).then((res) => res.data),
        enabled: Boolean(overview),
    });

    const open = (lesson: PublicGrammarLesson) => (lesson.free ? router.push(`/learn/grammar/lesson?id=${lesson.id}`) : show());
    const title = (x: { title: string; titleFa: string | null }) => (language === "fa" && x.titleFa) || x.title;
    const summary = (x: PublicGrammarLesson) => (language === "fa" && x.summaryFa) || x.summary || "";

    const row = (lesson: PublicGrammarLesson, index: number, total: number) => (
        <GrammarLessonItem
            key={lesson.id}
            number={index + 1}
            title={title(lesson)}
            summary={summary(lesson)}
            dir={language === "fa" && lesson.titleFa ? "rtl" : "ltr"}
            level={lesson.level}
            learned={false}
            bookmarked={false}
            bookmarkPending={false}
            hasQuiz={lesson.quizCount > 0}
            isLast={index === total - 1}
            labels={{ bookmark: "", unbookmark: "", practice: "", review: "" }}
            locked={!lesson.free}
            previewLabel={lesson.free ? l.grammar.lessonCta : l.locked}
            onOpen={() => open(lesson)}
            onPractice={() => open(lesson)}
            onToggleBookmark={() => undefined}
        />
    );

    return (
        <div className="min-h-[60vh] bg-background px-6 py-10" style={levelThemeVars(levelColor)}>
            <div className="mx-auto max-w-4xl">
                <Link href="/learn" className="mb-4 inline-block text-sm font-medium text-foreground/60 transition hover:text-foreground">
                    ← {l.backToHub}
                </Link>
                <LearningPageHero icon={BookOpen} title={l.grammar.heroTitle} subtitle={l.grammar.heroSubtitle} accent={levelColor} bubbles />

                {(overviewPending || (viewPending && overview)) && <Loading />}
                {(overviewError || viewError) && (
                    <div role="alert" className="mt-8 flex flex-col items-center gap-3 text-center">
                        <p className="text-foreground/70">{l.error}</p>
                        <button type="button" onClick={() => refetch()} className="btn-outline rounded-xl px-5 py-2">
                            {l.retry}
                        </button>
                    </div>
                )}

                {overview && counts.every((c) => c.total === 0) && <p className="mt-8 text-center text-foreground/70">{l.noLevels}</p>}
                {overview && <LevelPicker className="mt-6" kind="grammar" counts={counts} selected={effective} onSelect={setSelected} />}

                {view && (
                    <div className="mt-6 space-y-4">
                        {view.categories
                            .filter((c) => c.lessons.length > 0)
                            .map((category) => {
                                const freeCount = category.lessons.filter((x) => x.free).length;
                                return (
                                    <GrammarCategoryCard
                                        key={category.id}
                                        title={title(category)}
                                        level={category.level ?? effective}
                                        itemCount={category.lessons.length}
                                        learnedCount={freeCount}
                                        collapsed={collapsed[category.id] ?? false}
                                        onToggle={() => setCollapsed((prev) => ({ ...prev, [category.id]: !prev[category.id] }))}
                                        topicsLabel={t.grammar.topicsCount(category.lessons.length)}
                                        completedLabel={l.grammar.freeOf(freeCount, category.lessons.length)}
                                        footer={category.lessons.length > freeCount ? <UnlockBanner title={l.grammar.topicBanner(category.lessons.length)} /> : undefined}
                                    >
                                        {category.lessons.map((lesson, i) => row(lesson, i, category.lessons.length))}
                                    </GrammarCategoryCard>
                                );
                            })}

                        {view.uncategorized.length > 0 && (
                            <ol className="rounded-3xl bg-card p-4 shadow-card sm:p-5">{view.uncategorized.map((lesson, i) => row(lesson, i, view.uncategorized.length))}</ol>
                        )}

                        {view.categories.every((c) => c.lessons.length === 0) && view.uncategorized.length === 0 && (
                            <div className="rounded-3xl bg-card py-12 text-center shadow-card">
                                <BookOpen className="mx-auto size-10 text-foreground/25" aria-hidden="true" />
                                <p className="mt-3 text-foreground/55">{l.empty}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {dialog}
        </div>
    );
}
