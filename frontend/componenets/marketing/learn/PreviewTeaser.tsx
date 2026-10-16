"use client";

import Link from "next/link";
import { ArrowRight, Unlock } from "lucide-react";
import SectionHeading from "../SectionHeading";
import { useMarketing } from "../useMarketing";
import CountUp from "./CountUp";
import { freeOf, LEARN_KINDS, LEARN_META, totalOf } from "./learnMeta";
import { usePublicOverview } from "./usePublicOverview";

/** The home page's door into the free preview: one tile per content type with the real number of items behind it. */
export default function PreviewTeaser() {
    const { m } = useMarketing();
    const t = m.learnPage;
    const { data } = usePublicOverview();

    // Only worth showing once there is real content behind it.
    if (!data || LEARN_KINDS.every((kind) => totalOf(data, kind) === 0)) return null;

    return (
        <section id="try" className="container mx-auto scroll-mt-24 px-6 py-20">
            <SectionHeading badge={t.teaser.badge} title={t.teaser.title} subtitle={t.teaser.subtitle} />
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {LEARN_KINDS.filter((kind) => totalOf(data, kind) > 0).map((kind) => {
                    const { icon: Icon, color, href } = LEARN_META[kind];
                    return (
                        <Link
                            key={kind}
                            href={href}
                            className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none"
                        >
                            <span className="flex items-center justify-between p-5 text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>
                                <Icon className="size-7" />
                                <span className="text-end">
                                    <span className="block text-2xl font-extrabold leading-none">
                                        <CountUp value={totalOf(data, kind)} />
                                    </span>
                                    <span className="text-xs opacity-90">{t.libraryLabels[kind]}</span>
                                </span>
                            </span>
                            <span className="flex flex-1 flex-col gap-2 p-5">
                                <span className="text-lg font-bold text-foreground">{t.kinds[kind].title}</span>
                                <span className="line-clamp-3 text-sm text-foreground/70">{t.kinds[kind].text}</span>
                                <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                    <Unlock className="size-3" />
                                    {t.freeCount(freeOf(data, kind))}
                                </span>
                                <span className="mt-auto flex items-center gap-1.5 pt-3 text-sm font-semibold text-primary">
                                    {t.teaser.open}
                                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                                </span>
                            </span>
                        </Link>
                    );
                })}
            </div>
            <div className="mt-10 flex justify-center">
                <Link href="/learn" className="btn-primary rounded-xl px-6 py-3 text-base">
                    {t.teaser.cta}
                </Link>
            </div>
        </section>
    );
}
