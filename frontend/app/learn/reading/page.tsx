"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Newspaper } from "lucide-react";
import Loading from "@/componenets/Loading";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import { getLevelMeta, levelThemeVars } from "@/componenets/learning/levelMeta";
import ArticleCard from "@/componenets/reading/ArticleCard";
import LevelPicker from "@/componenets/marketing/learn/LevelPicker";
import SampleNotice from "@/componenets/marketing/learn/SampleNotice";
import PublicPager from "@/componenets/marketing/learn/PublicPager";
import UnlockBanner from "@/componenets/marketing/learn/UnlockBanner";
import { useUnlockPrompt } from "@/componenets/marketing/learn/UnlockPrompt";
import { usePublicOverview } from "@/componenets/marketing/learn/usePublicOverview";
import { useMarketing } from "@/componenets/marketing/useMarketing";
import { getPublicReading } from "@/services/publicLearnService";
import type { PublicArticleItem } from "@/types/publicLearn";
import type { ReadingArticleSummary } from "@/types/reading";

const PAGE_SIZE = 8;

const asSummary = (a: PublicArticleItem): ReadingArticleSummary => ({
    id: a.id,
    title: a.title,
    categoryId: a.categoryId,
    categoryTitle: a.categoryTitle,
    level: a.level,
    imageUrl: a.imageUrl,
    thumbnailUrl: a.thumbnailUrl,
    viewCount: 0,
    createdAt: "",
    newWordCount: 0,
    learned: false,
    bookmarked: false,
});

export default function PublicReadingPage() {
    const router = useRouter();
    const { m } = useMarketing();
    const l = m.learnPage;
    const r = l.reading;
    const { show, dialog } = useUnlockPrompt();
    const [selected, setSelected] = useState<string | null>(null);
    const [category, setCategory] = useState("");
    const [page, setPage] = useState(0);

    const { data: overview, isPending: overviewPending, isError: overviewError } = usePublicOverview();
    const counts = overview?.reading ?? [];
    const level = selected ?? counts.find((c) => c.total > 0)?.level ?? "A1";
    const color = getLevelMeta(level).color;

    const { data, isPending, isError, isPlaceholderData, refetch } = useQuery({
        queryKey: ["public", "learn", "reading", level, category, page],
        queryFn: () => getPublicReading({ level, category: category || undefined, page, size: PAGE_SIZE }).then((res) => res.data),
        enabled: Boolean(overview),
        placeholderData: keepPreviousData,
    });

    const labels = {
        quizLabel: "",
        reviewLabel: "",
        newWordsLabel: () => "",
        viewsLabel: () => "",
        dateLabel: "",
    };

    return (
        <div className="min-h-[60vh] bg-background px-6 py-10" style={levelThemeVars(color)}>
            <div className="mx-auto max-w-4xl">
                <Link href="/learn" className="mb-4 inline-block text-sm font-medium text-foreground/60 transition hover:text-foreground">
                    ← {l.backToHub}
                </Link>
                <LearningPageHero icon={Newspaper} title={r.heroTitle} subtitle={r.heroSubtitle} accent={color} bubbles />

                {overview && (
                    <LevelPicker
                        className="mt-6"
                        kind="reading"
                        counts={counts}
                        selected={level}
                        onSelect={(next) => {
                            setSelected(next);
                            setCategory("");
                            setPage(0);
                        }}
                    />
                )}

                {data && data.categories.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label={r.topic}>
                        <span className="text-sm font-semibold text-foreground/60">{r.topic}</span>
                        {[{ key: "", label: r.allTopics }, ...data.categories].map((c) => (
                            <button
                                key={c.key || "all"}
                                type="button"
                                aria-pressed={category === c.key}
                                onClick={() => {
                                    setCategory(c.key);
                                    setPage(0);
                                }}
                                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${category === c.key ? "border-transparent bg-primary text-primary-foreground shadow-sm" : "border-border/60 bg-card text-foreground hover:border-primary/40"}`}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                )}

                {(overviewPending || isPending) && <Loading />}
                {(overviewError || isError) && (
                    <div role="alert" className="mt-8 flex flex-col items-center gap-3 text-center">
                        <p className="text-foreground/70">{l.error}</p>
                        <button type="button" onClick={() => refetch()} className="btn-outline rounded-xl px-5 py-2">
                            {l.retry}
                        </button>
                    </div>
                )}

                {data && data.items.length === 0 && <p className="mt-8 text-center text-foreground/60">{l.empty}</p>}
                {data && data.items.length > 0 && (
                    <>
                        <div className={`mt-6 grid gap-5 sm:grid-cols-2 ${isPlaceholderData ? "opacity-60" : ""}`}>
                            {data.items.map((a) => (
                                <ArticleCard
                                    key={a.id}
                                    article={asSummary(a)}
                                    {...labels}
                                    locked={!a.free}
                                    previewLabel={a.free ? r.openCta : l.locked}
                                    onOpen={() => (a.free ? router.push(`/learn/reading/article?id=${a.id}`) : show())}
                                />
                            ))}
                        </div>
                        <PublicPager page={page} totalPages={data.totalPages} onPage={setPage} />
                        <SampleNotice shown={data.totalElements} total={data.total} />
                        {data.items.some((a) => !a.free) && <UnlockBanner title={l.unlock.title} />}
                    </>
                )}
            </div>
            {dialog}
        </div>
    );
}

