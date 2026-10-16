"use client";

import Link from "next/link";
import { ArrowRight, Loader2, Lock, Unlock } from "lucide-react";
import CtaBand from "@/componenets/marketing/CtaBand";
import CountUp from "@/componenets/marketing/learn/CountUp";
import { freeOf, LEARN_KINDS, LEARN_META, totalOf } from "@/componenets/marketing/learn/learnMeta";
import { usePublicOverview } from "@/componenets/marketing/learn/usePublicOverview";
import SectionHeading from "@/componenets/marketing/SectionHeading";
import { useMarketing } from "@/componenets/marketing/useMarketing";

/** The landing page of the free preview: the four content types, each with how much exists and how much is open. */
export default function LearnPage() {
    const { m } = useMarketing();
    const l = m.learnPage;
    const { data, isPending, isError, refetch } = usePublicOverview();

    return (
        <main className="bg-background">
            <section className="relative overflow-hidden bg-gradient-to-b from-accent/60 to-background py-14 md:py-20">
                <div className="container relative mx-auto px-6">
                    <SectionHeading badge={l.badge} title={l.title} subtitle={l.subtitle} />
                </div>
            </section>

            <section className="container mx-auto px-6 pb-16">
                {isPending && (
                    <p role="status" className="flex items-center justify-center gap-2 py-16 text-foreground/60">
                        <Loader2 className="size-5 animate-spin" />
                        {l.loading}
                    </p>
                )}
                {isError && (
                    <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
                        <p className="text-foreground/70">{l.error}</p>
                        <button type="button" onClick={() => refetch()} className="btn-outline rounded-xl px-5 py-2">
                            {l.retry}
                        </button>
                    </div>
                )}

                {data && (
                    <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
                        {LEARN_KINDS.filter((kind) => totalOf(data, kind) > 0).map((kind) => {
                            const { icon: Icon, color, href } = LEARN_META[kind];
                            const total = totalOf(data, kind);
                            const free = freeOf(data, kind);
                            const levels = data[kind].filter((c) => c.total > 0);
                            return (
                                <Link
                                    key={kind}
                                    href={href}
                                    className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none"
                                >
                                    <span className="relative flex items-center justify-between overflow-hidden p-6 text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>
                                        <span aria-hidden className="absolute -end-8 -top-10 size-36 rounded-full bg-white/10" />
                                        <Icon className="relative size-9" />
                                        <span className="relative text-end">
                                            <span className="block text-4xl font-extrabold leading-none">
                                                <CountUp value={total} />
                                            </span>
                                            <span className="text-sm opacity-90">{l.libraryLabels[kind]}</span>
                                        </span>
                                    </span>
                                    <span className="flex flex-1 flex-col gap-3 p-6">
                                        <span className="text-xl font-bold text-foreground">{l.kinds[kind].title}</span>
                                        <span className="text-foreground/70">{l.kinds[kind].text}</span>
                                        <span className="flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                                <Unlock className="size-3.5" />
                                                {l.freeCount(free)}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.06] px-3 py-1 text-sm text-foreground/60">
                                                <Lock className="size-3.5" />
                                                {total - free}
                                            </span>
                                            {levels.map((c) => (
                                                <span key={c.level} className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: `${color}1f`, color }}>
                                                    {c.level}
                                                </span>
                                            ))}
                                        </span>
                                        <span className="mt-auto flex items-center gap-1.5 pt-2 text-sm font-semibold text-primary">
                                            {l.teaser.open}
                                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                                        </span>
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                )}
                {data && LEARN_KINDS.every((kind) => totalOf(data, kind) === 0) && <p className="py-10 text-center text-foreground/70">{l.noLevels}</p>}
            </section>

            <CtaBand title={m.home.finalCta.title} text={m.home.finalCta.text} />
            <p className="container mx-auto px-6 pb-10 text-center text-xs text-foreground/50">{m.common.disclaimer}</p>
        </main>
    );
}
