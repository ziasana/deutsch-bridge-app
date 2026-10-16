"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Compass, MessagesSquare } from "lucide-react";
import Loading from "@/componenets/Loading";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import { getLevelMeta, levelThemeVars, ACCENT_TITLE_COLOR } from "@/componenets/learning/levelMeta";
import RedemittelCategoryPicker from "@/componenets/redemittel/RedemittelCategoryPicker";
import RedemittelDetailCard from "@/componenets/redemittel/RedemittelDetailCard";
import RedemittelLevelPills from "@/componenets/redemittel/RedemittelLevelPills";
import RedemittelRow from "@/componenets/redemittel/RedemittelRow";
import { REDEMITTEL_ACCENT } from "@/componenets/redemittel/redemittelMeta";
import DetailModal from "@/componenets/marketing/learn/DetailModal";
import SampleNotice from "@/componenets/marketing/learn/SampleNotice";
import PublicPager from "@/componenets/marketing/learn/PublicPager";
import PublicRedemittelPractice from "@/componenets/marketing/learn/PublicRedemittelPractice";
import UnlockBanner from "@/componenets/marketing/learn/UnlockBanner";
import { useUnlockPrompt } from "@/componenets/marketing/learn/UnlockPrompt";
import { useMarketing } from "@/componenets/marketing/useMarketing";
import { getPublicRedemittel } from "@/services/publicLearnService";
import type { Redemittel, RedemittelContext } from "@/types/redemittel";
import type { PublicPhrase } from "@/types/publicLearn";
import type { WritingPhraseCategory } from "@/types/writing";

const PAGE_SIZE = 12;

/** The public phrase has the dashboard's shape minus progress; locked ones carry nothing but the phrase itself. */
const asRedemittel = (p: PublicPhrase): Redemittel => ({
    id: p.id,
    level: p.level,
    category: p.category as WritingPhraseCategory,
    categoryLabel: p.categoryLabel,
    phrase: p.phrase,
    meaning: p.meaning,
    explanation: p.explanation,
    example: p.example,
    formality: p.formality,
    usageNote: p.usageNote,
    grammarPattern: p.grammarPattern,
    commonMistake: p.commonMistake,
    similarExpressions: p.similarExpressions ?? [],
    contexts: (p.contexts ?? []) as RedemittelContext[],
    status: "NEW",
    nextReviewAt: null,
    saved: false,
});

export default function PublicRedemittelPage() {
    const { m } = useMarketing();
    const l = m.learnPage;
    const r = l.redemittel;
    const { show, dialog } = useUnlockPrompt();
    const [level, setLevel] = useState("ALL");
    const [category, setCategory] = useState("ALL");
    const [page, setPage] = useState(0);
    const [openId, setOpenId] = useState<string | null>(null);

    const { data, isPending, isError, isPlaceholderData, refetch } = useQuery({
        queryKey: ["public", "learn", "redemittel", level, category, page],
        queryFn: () =>
            getPublicRedemittel({ level: level === "ALL" ? undefined : level, category: category === "ALL" ? undefined : category, page, size: PAGE_SIZE }).then((res) => res.data),
        placeholderData: keepPreviousData,
    });

    const accent = level === "ALL" ? REDEMITTEL_ACCENT : getLevelMeta(level).color;
    const items = data?.items ?? [];
    const opened = openId ? items.find((i) => i.id === openId) : undefined;
    const lockedOnPage = items.filter((i) => !i.free).length;

    return (
        <div className="min-h-[60vh] bg-background px-4 py-8 sm:px-6 sm:py-10" dir="ltr" style={levelThemeVars(accent)}>
            <div className="mx-auto max-w-4xl space-y-6">
                <Link href="/learn" className="inline-block text-sm font-medium text-foreground/60 transition hover:text-foreground">
                    ← {l.backToHub}
                </Link>
                <LearningPageHero icon={MessagesSquare} title={r.heroTitle} subtitle={r.heroSubtitle} accent={accent} bubbles />

                <section className="rounded-3xl bg-card shadow-card ring-1 ring-border/60" aria-label={r.heroTitle}>
                    <div className="space-y-3 rounded-t-3xl border-b border-border/60 bg-primary/[0.05] p-4 sm:px-6">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <Compass className="size-4.5" aria-hidden="true" />
                            </div>
                            <h2 className="text-lg font-bold" style={{ color: ACCENT_TITLE_COLOR }}>
                                {r.heroTitle}
                            </h2>
                        </div>
                        <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2">
                            <RedemittelLevelPills
                                value={level}
                                onChange={(next) => {
                                    setLevel(next);
                                    setPage(0);
                                }}
                            />
                            <span aria-hidden="true" className="hidden h-5 w-px bg-border sm:block" />
                            <RedemittelCategoryPicker
                                categories={data?.categories ?? []}
                                value={category}
                                onChange={(next) => {
                                    setCategory(next);
                                    setPage(0);
                                }}
                            />
                        </div>
                    </div>

                    {isPending && <Loading />}
                    {isError && (
                        <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                            <p className="text-foreground/70">{l.error}</p>
                            <button type="button" onClick={() => refetch()} className="btn-outline rounded-xl px-5 py-2">
                                {l.retry}
                            </button>
                        </div>
                    )}
                    {data && items.length === 0 && <p className="px-6 py-12 text-center text-foreground/60">{l.empty}</p>}
                    {items.length > 0 && (
                        <ul className={`divide-y divide-border/60 transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}>
                            {items.map((p, i) => (
                                <RedemittelRow
                                    key={p.id}
                                    index={i}
                                    redemittel={asRedemittel(p)}
                                    locked={!p.free}
                                    preview
                                    onOpen={() => (p.free ? setOpenId(p.id) : show())}
                                    onToggleSave={() => undefined}
                                />
                            ))}
                        </ul>
                    )}
                    {data && data.totalPages > 1 && (
                        <div className="rounded-b-3xl border-t border-border/60 px-4 pb-4 sm:px-6">
                            <PublicPager page={page} totalPages={data.totalPages} onPage={setPage} />
                        </div>
                    )}
                </section>

                {data && <SampleNotice shown={data.totalElements} total={data.total} />}
                {lockedOnPage > 0 && <UnlockBanner title={m.learnPage.unlock.title} />}
            </div>

            {opened && (
                <DetailModal label={opened.phrase} onClose={() => setOpenId(null)}>
                    <RedemittelDetailCard embedded redemittel={asRedemittel(opened)}>
                        <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
                            {l.unlock.cta}
                        </Link>
                    </RedemittelDetailCard>
                    <PublicRedemittelPractice id={opened.id} />
                </DetailModal>
            )}
            {dialog}
        </div>
    );
}

