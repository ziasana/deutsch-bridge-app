"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getExpressionImageSrc } from "@/lib/expressionImages";
import { getIllustrationFor } from "@/componenets/expressions/illustrations";
import { COLLECTION_ACCENT } from "@/componenets/expressions/expressionMeta";
import { getPublicExpression } from "@/services/publicLearnService";
import type { ExpressionType } from "@/types/expression";
import { useMarketing } from "../useMarketing";
import DetailModal from "./DetailModal";

const sectionTitle = "text-xs font-semibold uppercase tracking-wide text-primary";

/** The full content of a free expression, laid out like the dashboard's expression detail. */
export default function PublicExpressionDialog({ id, title, onClose }: Readonly<{ id: string; title: string; onClose: () => void }>) {
    const { m } = useMarketing();
    const l = m.learnPage;
    const { data, isPending, isError } = useQuery({
        queryKey: ["public", "learn", "expression", id],
        queryFn: () => getPublicExpression(id).then((res) => res.data),
        retry: false,
    });

    const color = data ? (COLLECTION_ACCENT[data.type as ExpressionType] ?? "#3b82f6") : "#3b82f6";
    const image = data ? getExpressionImageSrc(data.imageUrl) : null;
    const illustration = data && data.type === "REDEWENDUNG" && !image ? getIllustrationFor(data.expression) : null;
    const illustrationNode = illustration ? illustration({ className: "h-full w-full object-cover" }) : null;

    return (
        <DetailModal label={title} onClose={onClose}>
            {isPending && <p className="p-10 pt-14 text-center text-sm text-foreground/60">{l.loading}</p>}
            {isError && <p className="p-10 pt-14 text-center text-sm text-foreground/60">{l.error}</p>}
            {data && (
                <article>
                    {(image || illustrationNode) && (
                        <div className="aspect-[2.6/1] w-full overflow-hidden">
                            {image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={image} alt="" className="size-full object-cover" />
                            ) : (
                                illustrationNode
                            )}
                        </div>
                    )}
                    <header className="px-5 pb-4 pt-6 sm:px-8" style={{ backgroundImage: `linear-gradient(180deg, ${color}1f, transparent)` }}>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                            <span className="rounded-full px-2.5 py-0.5 text-white" style={{ backgroundColor: color }}>
                                {data.level}
                            </span>
                            <span className="rounded-full bg-foreground/[0.06] px-2.5 py-0.5 text-foreground/70">{l.expressions.collections[data.type as ExpressionType] ?? data.type}</span>
                        </div>
                        <h2 lang="de" className="mt-3 break-words text-2xl font-bold leading-snug text-foreground sm:text-3xl">
                            {data.expression}
                        </h2>
                    </header>

                    <div className="space-y-5 px-5 pb-6 sm:px-8">
                        <section className="rounded-[10px] border-s-4 bg-accent/50 px-4 py-3" style={{ borderColor: color }}>
                            <h3 className={sectionTitle}>Bedeutung</h3>
                            {data.meaningDe && <p lang="de" className="mt-1.5 text-base font-medium text-foreground">{data.meaningDe}</p>}
                            {data.meaningEn && <p className="text-sm text-foreground/75">{data.meaningEn}</p>}
                            {data.meaningFa && (
                                <p dir="rtl" className="text-sm text-foreground/75">
                                    {data.meaningFa}
                                </p>
                            )}
                        </section>

                        {(data.literalMeaning || data.figurativeMeaning) && (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {data.literalMeaning && (
                                    <div className="rounded-[10px] bg-foreground/[0.04] p-3">
                                        <h3 className={sectionTitle}>Wörtlich</h3>
                                        <p lang="de" className="mt-1 text-sm text-foreground/85">{data.literalMeaning}</p>
                                    </div>
                                )}
                                {data.figurativeMeaning && (
                                    <div className="rounded-[10px] p-3" style={{ backgroundColor: `${color}1f` }}>
                                        <h3 className={sectionTitle}>Im übertragenen Sinn</h3>
                                        <p lang="de" className="mt-1 text-sm text-foreground/85">{data.figurativeMeaning}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {data.examples.length > 0 && (
                            <section>
                                <h3 className={sectionTitle}>Beispiele</h3>
                                <ul className="mt-2 space-y-3">
                                    {data.examples.map((e) => (
                                        <li key={e.sentence} className="border-s-4 ps-3" style={{ borderColor: `${color}80` }}>
                                            <p lang="de" className="italic text-foreground/90">„{e.sentence}“</p>
                                            {e.translationEn && <p className="text-sm text-foreground/60">{e.translationEn}</p>}
                                            {e.translationFa && <p dir="rtl" className="text-sm text-foreground/60">{e.translationFa}</p>}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {data.patterns.length > 0 && (
                            <section>
                                <h3 className={sectionTitle}>Struktur</h3>
                                <ul className="mt-2 space-y-2">
                                    {data.patterns.map((p) => (
                                        <li key={p.pattern} className="rounded-[10px] bg-primary/[0.08] px-4 py-2.5">
                                            <p lang="de" className="font-semibold text-foreground">{p.pattern}</p>
                                            {p.example && <p lang="de" className="text-sm italic text-foreground/70">{p.example}</p>}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {(data.usageNote || data.grammarNote) && (
                            <section className="rounded-[10px] border-s-4 border-learning-vocabulary bg-learning-vocabulary/10 px-4 py-3 text-sm text-foreground/85">
                                {data.usageNote && <p lang="de">{data.usageNote}</p>}
                                {data.grammarNote && <p lang="de">{data.grammarNote}</p>}
                            </section>
                        )}
                    </div>

                    <footer className="flex flex-wrap items-center gap-3 border-t border-border/60 bg-foreground/[0.02] px-5 py-4 sm:px-8">
                        <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90">
                            {l.unlock.cta}
                        </Link>
                    </footer>
                </article>
            )}
        </DetailModal>
    );
}
