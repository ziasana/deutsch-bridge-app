"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { Layers, MessageSquare, Sparkles } from "lucide-react";
import Loading from "@/componenets/Loading";
import ExpressionCard from "@/componenets/expressions/ExpressionCard";
import ExpressionCollectionSelector from "@/componenets/expressions/ExpressionCollectionSelector";
import { COLLECTION_ACCENT } from "@/componenets/expressions/expressionMeta";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import { levelThemeVars } from "@/componenets/learning/levelMeta";
import LevelPicker from "@/componenets/marketing/learn/LevelPicker";
import PublicExpressionDialog from "@/componenets/marketing/learn/PublicExpressionDialog";
import SampleNotice from "@/componenets/marketing/learn/SampleNotice";
import PublicPager from "@/componenets/marketing/learn/PublicPager";
import UnlockBanner from "@/componenets/marketing/learn/UnlockBanner";
import { useUnlockPrompt } from "@/componenets/marketing/learn/UnlockPrompt";
import { usePublicOverview } from "@/componenets/marketing/learn/usePublicOverview";
import { useMarketing } from "@/componenets/marketing/useMarketing";
import { getPublicExpressions } from "@/services/publicLearnService";
import type { ExpressionListItem, ExpressionRegister, ExpressionType } from "@/types/expression";
import type { PublicExpressionItem } from "@/types/publicLearn";

const PAGE_SIZE = 12;
const TYPES: ExpressionType[] = ["NOMEN_VERB_VERBINDUNG", "REDEWENDUNG"];

/** Dashboard card shape with neutral progress; locked ones keep only the expression, level and picture. */
const asListItem = (e: PublicExpressionItem): ExpressionListItem => ({
    id: e.id,
    expression: e.expression,
    level: e.level,
    meaningDe: e.meaningDe ?? "",
    meaningEn: e.meaningEn ?? "",
    register: e.register as ExpressionRegister | null,
    imageUrl: e.imageUrl,
    exampleSentence: e.exampleSentence,
    masteryLevel: "NEW",
    overallScore: 0,
    productionScore: 0,
    bookmarked: false,
});

export default function PublicExpressionsPage() {
    const { m } = useMarketing();
    const l = m.learnPage;
    const x = l.expressions;
    const { show, dialog } = useUnlockPrompt();
    const [collection, setCollection] = useState<ExpressionType>("NOMEN_VERB_VERBINDUNG");
    const [selected, setSelected] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [openId, setOpenId] = useState<{ id: string; title: string } | null>(null);

    const { data: overview, isPending: overviewPending } = usePublicOverview();
    const counts = overview?.expressions ?? [];
    const level = selected ?? counts.find((c) => c.total > 0)?.level ?? "B1";

    // Both collections are asked for, so each card can show how many it holds at this level; only the chosen one is listed.
    const queries = useQueries({
        queries: TYPES.map((type) => ({
            queryKey: ["public", "learn", "expressions", type, level, type === collection ? page : 0],
            queryFn: () => getPublicExpressions({ type, level, page: type === collection ? page : 0, size: PAGE_SIZE }).then((res) => res.data),
            enabled: Boolean(overview),
            placeholderData: keepPreviousData,
        })),
    });
    const current = queries[TYPES.indexOf(collection)];
    const data = current.data;
    const accent = COLLECTION_ACCENT[collection];

    const options = TYPES.map((type, i) => ({
        type,
        label: x.collections[type],
        count: queries[i].data?.totalElements ?? 0,
        icon: type === "REDEWENDUNG" ? MessageSquare : Layers,
    }));

    return (
        <div className="min-h-[60vh] bg-background px-6 py-10" style={levelThemeVars(accent)}>
            <div className="mx-auto max-w-5xl">
                <Link href="/learn" className="mb-4 inline-block text-sm font-medium text-foreground/60 transition hover:text-foreground">
                    ← {l.backToHub}
                </Link>
                <LearningPageHero icon={Sparkles} title={x.heroTitle} subtitle={x.heroSubtitle} accent={accent} bubbles />

                <ExpressionCollectionSelector
                    className="mt-6"
                    options={options}
                    selected={collection}
                    unitLabel={l.unitLabels.expressions}
                    onSelect={(type) => {
                        setCollection(type);
                        setPage(0);
                    }}
                />

                {overview && (
                    <LevelPicker
                        className="mt-4"
                        kind="expressions"
                        counts={counts}
                        selected={level}
                        onSelect={(next) => {
                            setSelected(next);
                            setPage(0);
                        }}
                    />
                )}

                {(overviewPending || current.isPending) && <Loading />}
                {current.isError && (
                    <div role="alert" className="mt-8 flex flex-col items-center gap-3 text-center">
                        <p className="text-foreground/70">{l.error}</p>
                        <button type="button" onClick={() => current.refetch()} className="btn-outline rounded-xl px-5 py-2">
                            {l.retry}
                        </button>
                    </div>
                )}

                {data && data.items.length === 0 && <p className="mt-8 text-center text-foreground/60">{l.empty}</p>}
                {data && data.items.length > 0 && (
                    <>
                        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {data.items.map((e) => (
                                <ExpressionCard
                                    key={e.id}
                                    expression={asListItem(e)}
                                    collectionType={collection}
                                    locked={!e.free}
                                    previewLabel={e.free ? x.openCta : l.locked}
                                    onOpen={() => (e.free ? setOpenId({ id: e.id, title: e.expression }) : show())}
                                    onPractice={() => undefined}
                                    onToggleBookmark={() => undefined}
                                />
                            ))}
                        </div>
                        <PublicPager page={page} totalPages={data.totalPages} onPage={setPage} />
                        <SampleNotice shown={data.totalElements} total={data.total} />
                        {data.items.some((e) => !e.free) && <UnlockBanner title={l.unlock.title} />}
                    </>
                )}
            </div>

            {openId && <PublicExpressionDialog id={openId.id} title={openId.title} onClose={() => setOpenId(null)} />}
            {dialog}
        </div>
    );
}

