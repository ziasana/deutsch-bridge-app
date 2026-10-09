"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getExpressionById, getExpressionNavigation, markExpressionViewed } from "@/services/expressionService";
import { Expression, ExpressionNeighbor } from "@/types/expression";
import Loading from "@/componenets/Loading";
import { ArrowLeft, ChevronLeft, ChevronRight, Lightbulb, Play, TriangleAlert } from "lucide-react";
import { getExpressionImageSrc } from "@/lib/expressionImages";
import { getIllustrationFor } from "@/componenets/expressions/illustrations";
import { COLLECTION_ACCENT } from "@/componenets/expressions/expressionMeta";
import { ACCENT_TITLE_COLOR, levelThemeVars } from "@/componenets/learning/levelMeta";

const pillPrimary =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

const CONTEXT_LABEL: Record<string, string> = {
    EVERYDAY: "Alltag",
    WORK: "Beruf",
    UNIVERSITY: "Uni",
    SOCIETY: "Gesellschaft",
    EXAM: "Prüfung",
};

/**
 * Previous/Next within the collection and level, in the list's default order. Never gated on
 * progress or practice - a learner is always free to move on.
 */
function ExpressionNavRow({
    previous,
    next,
    onNavigate,
}: Readonly<{
    previous: ExpressionNeighbor | null | undefined;
    next: ExpressionNeighbor | null | undefined;
    onNavigate: (id: string) => void;
}>) {
    if (!previous && !next) return null;

    const card =
        "group flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-start shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

    return (
        <nav aria-label="Vorheriger / nächster Ausdruck" className="flex items-stretch justify-between gap-3">
            {previous ? (
                <button type="button" onClick={() => onNavigate(previous.id)} title={previous.expression} className={card}>
                    <ChevronLeft className="size-5 shrink-0 text-primary transition group-hover:-translate-x-0.5" aria-hidden="true" />
                    <span className="min-w-0">
                        <span className="block text-xs font-semibold uppercase tracking-wide text-foreground/45">Vorheriger Ausdruck</span>
                        <span className="block truncate text-sm font-semibold text-foreground">{previous.expression}</span>
                    </span>
                </button>
            ) : (
                <span className="flex-1" />
            )}
            {next ? (
                <button type="button" onClick={() => onNavigate(next.id)} title={next.expression} className={`${card} justify-end text-end`}>
                    <span className="min-w-0">
                        <span className="block text-xs font-semibold uppercase tracking-wide text-foreground/45">Nächster Ausdruck</span>
                        <span className="block truncate text-sm font-semibold text-foreground">{next.expression}</span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-primary transition group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
            ) : (
                <span className="flex-1" />
            )}
        </nav>
    );
}

function ExpressionDetailContent({ id }: Readonly<{ id: string | null }>) {
    const router = useRouter();

    const [expression, setExpression] = useState<Expression | null>(null);
    const [loading, setLoading] = useState(true);
    const viewedFor = useRef<string | null>(null);

    // Previous/Next in the collection's list order - lightweight, so it's fine to always fetch.
    const { data: navigation } = useQuery({
        queryKey: ["expressions", "navigation", id],
        queryFn: () => getExpressionNavigation(id!).then((res) => res.data),
        enabled: !!id,
    });
    // Previous/Next replace the entry, so "Back" always returns to the list instead of stepping through every expression seen.
    const goToExpression = (expressionId: string) => router.replace(`/dashboard/expressions/detail?id=${expressionId}`);

    useEffect(() => {
        if (!id) return;
        getExpressionById(id)
            .then((res) => setExpression(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    // Fire-and-forget: records the first view for the recognition score without blocking the page. The ref
    // keeps React's dev-mode double effect from sending one open twice (two simultaneous first views).
    useEffect(() => {
        if (!id || viewedFor.current === id) return;
        viewedFor.current = id;
        markExpressionViewed(id).catch(() => {
            // Cosmetic score bump - never surface a failure (or the dev error overlay) for it.
        });
    }, [id]);

    if (loading) return <Loading />;

    if (!expression) {
        return (
            <div className="dashboard-atmosphere flex min-h-screen items-center justify-center p-4 sm:p-6" dir="ltr">
                <div className="max-w-md rounded-[10px] bg-card p-10 text-center shadow-card">
                    <h2 className="mb-4 text-2xl font-bold text-foreground">Nicht gefunden</h2>
                    <button type="button" className={pillPrimary} onClick={() => router.push("/dashboard/expressions")}>
                        Zurück zur Übersicht
                    </button>
                </div>
            </div>
        );
    }

    const overall = Math.round(expression.progress?.overallScore ?? 0);

    const uploadedImageSrc = expression.type === "REDEWENDUNG" ? getExpressionImageSrc(expression.imageUrl) : null;
    const illustration = expression.type === "REDEWENDUNG" && !uploadedImageSrc ? getIllustrationFor(expression.expression) : null;
    const illustrationNode = illustration ? illustration({ className: "h-full w-full rounded-t-2xl object-cover" }) : null;
    const hasVisual = Boolean(uploadedImageSrc || illustrationNode);

    const chip = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
    const heading = "mb-2 text-xs font-bold uppercase tracking-wide text-primary";

    const accent = COLLECTION_ACCENT[expression.type];
    // Back to the list the learner came from (same collection, filters and page); a fresh tab falls back to this collection's list.
    const goBack = () => {
        if (window.history.length > 1) router.back();
        else router.push(expression.type === "REDEWENDUNG" ? "/dashboard/expressions?collection=REDEWENDUNG" : "/dashboard/expressions");
    };
    const typeLabel = expression.type === "NOMEN_VERB_VERBINDUNG" ? "Nomen-Verb-Verbindung" : "Redewendung";

    return (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10" dir="ltr" style={levelThemeVars(accent)}>
            <div className="mx-auto max-w-4xl">
                <button type="button" onClick={goBack} className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-foreground/60 transition hover:text-foreground">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Zurück zur Übersicht
                </button>

                <div className="mt-4">
                    <ExpressionNavRow previous={navigation?.previous} next={navigation?.next} onNavigate={goToExpression} />
                </div>

                <article className="mt-4 overflow-hidden rounded-3xl bg-card shadow-card">
                    {hasVisual ? (
                        // Like the Reading article: a tall picture with a dark gradient and the title laid over it.
                        <div className="relative">
                            <div className="h-72 w-full overflow-hidden sm:h-96">
                                {uploadedImageSrc ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={uploadedImageSrc} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    illustrationNode
                                )}
                            </div>
                            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                            <header className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`${chip} text-white shadow-sm`} style={{ backgroundColor: accent }}>{expression.level}</span>
                                    <span className={`${chip} bg-white/20 text-white backdrop-blur-sm`}>{typeLabel}</span>
                                    {expression.register && <span className={`${chip} bg-white/20 text-white backdrop-blur-sm`}>{expression.register}</span>}
                                </div>
                                <h1 className="mt-3 text-3xl font-extrabold leading-tight drop-shadow sm:text-4xl">{expression.expression}</h1>
                                <div className="mt-3 max-w-sm">
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30" role="progressbar" aria-valuenow={overall} aria-valuemin={0} aria-valuemax={100}>
                                        <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${overall}%` }} />
                                    </div>
                                    <p className="mt-1.5 text-xs text-white/85">
                                        Active knowledge: {overall}% · {expression.progress?.masteryLevel ?? "NEW"}
                                    </p>
                                </div>
                            </header>
                        </div>
                    ) : null}
                    <div className="space-y-7 p-6 sm:p-10">
                        {!hasVisual && (
                            <header className="-mx-6 -mt-6 rounded-t-3xl px-6 pb-6 pt-6 sm:-mx-10 sm:-mt-10 sm:px-10 sm:pt-10" style={{ backgroundImage: `linear-gradient(135deg, ${accent}2e, ${accent}0d 70%, transparent)` }}>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`${chip} bg-primary/10 text-primary`}>{expression.level}</span>
                                    <span className={`${chip} bg-foreground/[0.06] text-foreground/65`}>{typeLabel}</span>
                                    {expression.register && <span className={`${chip} bg-foreground/[0.06] text-foreground/65`}>{expression.register}</span>}
                                </div>

                                <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl" style={{ color: ACCENT_TITLE_COLOR }}>{expression.expression}</h1>

                                <div className="mt-4 max-w-sm">
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-valuenow={overall} aria-valuemin={0} aria-valuemax={100}>
                                        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${overall}%` }} />
                                    </div>
                                    <p className="mt-1.5 text-xs text-foreground/55">
                                        Active knowledge: {overall}% · {expression.progress?.masteryLevel ?? "NEW"}
                                    </p>
                                </div>
                            </header>
                        )}

                        <section className="rounded-3xl border-s-4 border-primary bg-primary/[0.07] p-5 sm:p-6">
                            <h2 className={heading}>Bedeutung</h2>
                            <p className="mb-1 text-lg font-semibold text-foreground">{expression.meaningDe}</p>
                            {expression.meaningEn && <p className="text-sm text-foreground/65">🇬🇧 {expression.meaningEn}</p>}
                            {expression.meaningFa && (
                                <p className="text-sm text-foreground/65" dir="rtl">
                                    🇮🇷 {expression.meaningFa}
                                </p>
                            )}
                        </section>

                        {expression.type === "REDEWENDUNG" && (expression.literalMeaning || expression.figurativeMeaning) && (
                            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {expression.literalMeaning && (
                                    <div className="rounded-3xl bg-foreground/[0.04] p-5">
                                        <h2 className={heading}>Wörtliche Bedeutung</h2>
                                        <p className="text-sm text-foreground/80">{expression.literalMeaning}</p>
                                    </div>
                                )}
                                {expression.figurativeMeaning && (
                                    <div className="rounded-3xl bg-foreground/[0.04] p-5">
                                        <h2 className={heading}>Übertragene Bedeutung</h2>
                                        <p className="text-sm text-foreground/80">{expression.figurativeMeaning}</p>
                                    </div>
                                )}
                            </section>
                        )}

                        {expression.grammarNote && (
                            <section>
                                <h2 className={heading}>Grammatik</h2>
                                <p className="text-sm text-foreground/80">{expression.grammarNote}</p>
                            </section>
                        )}

                        {expression.examples.length > 0 && (
                            <section>
                                <h2 className={heading}>Beispiele</h2>
                                <div className="space-y-3">
                                    {expression.examples.map((ex) => (
                                        <div key={ex.id} className="rounded-2xl border-s-4 border-primary/40 bg-primary/[0.05] p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="italic text-foreground">&quot;{ex.sentence}&quot;</p>
                                                {ex.context && (
                                                    <span className={`${chip} shrink-0 bg-card text-foreground/65`}>{CONTEXT_LABEL[ex.context] ?? ex.context}</span>
                                                )}
                                            </div>
                                            {ex.translationEn && <p className="mt-1 text-sm text-foreground/65">🇬🇧 {ex.translationEn}</p>}
                                            {ex.translationFa && (
                                                <p className="text-sm text-foreground/65" dir="rtl">
                                                    🇮🇷 {ex.translationFa}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {expression.patterns.length > 0 && (
                            <section>
                                <h2 className={heading}>Patterns</h2>
                                <div className="space-y-2">
                                    {expression.patterns.map((p) => (
                                        <div key={p.id} className="rounded-2xl bg-foreground/[0.04] p-4">
                                            <p className="text-sm font-semibold text-foreground">{p.pattern}</p>
                                            {p.example && <p className="mt-1 text-sm text-foreground/65">{p.example}</p>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {expression.usageNote && (
                            <section className="rounded-2xl border-s-4 border-learning-vocabulary bg-learning-vocabulary/10 p-5">
                                <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-learning-vocabulary">
                                    <Lightbulb className="size-4" aria-hidden="true" />
                                    Usage
                                </h2>
                                <p className="text-sm text-foreground/80">{expression.usageNote}</p>
                            </section>
                        )}

                        {expression.commonMistakes && (
                            <section className="rounded-2xl border-s-4 border-orange-500 bg-orange-500/10 p-5">
                                <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400">
                                    <TriangleAlert className="size-4" aria-hidden="true" />
                                    Common mistakes
                                </h2>
                                <p className="text-sm text-foreground/80">{expression.commonMistakes}</p>
                            </section>
                        )}

                        <button
                            type="button"
                            className={`${pillPrimary} w-full py-3.5 text-base`}
                            onClick={() => router.push(`/dashboard/expressions/practice?expressionId=${expression.id}&skipIntro=1`)}
                        >
                            <Play className="size-4 fill-current" aria-hidden="true" />
                            Practice this expression
                        </button>
                    </div>
                </article>

                <div className="mt-4">
                    <ExpressionNavRow previous={navigation?.previous} next={navigation?.next} onNavigate={goToExpression} />
                </div>
            </div>
        </div>
    );
}

/**
 * Reads the id from the URL and keys the content by it, so Previous/Next - which push a new id onto
 * this same route - fully remount the page instead of briefly showing the old expression.
 */
function ExpressionDetailRouter() {
    const id = useSearchParams().get("id");
    return <ExpressionDetailContent key={id ?? ""} id={id} />;
}

export default function ExpressionDetailPage() {
    return (
        <Suspense fallback={<Loading />}>
            <ExpressionDetailRouter />
        </Suspense>
    );
}
