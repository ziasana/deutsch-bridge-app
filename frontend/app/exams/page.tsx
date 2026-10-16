"use client";

import Link from "next/link";
import { Fragment } from "react";
import CtaBand from "@/componenets/marketing/CtaBand";
import ExamCard from "@/componenets/marketing/ExamCard";
import SectionHeading from "@/componenets/marketing/SectionHeading";
import { useMarketing } from "@/componenets/marketing/useMarketing";

export default function ExamsPage() {
    const { m } = useMarketing();
    const e = m.exams;

    return (
        <main className="bg-background">
            <section className="bg-gradient-to-b from-accent/60 to-background py-16 md:py-20">
                <div className="container mx-auto px-6">
                    <SectionHeading badge={e.badge} title={e.title} subtitle={e.subtitle} />
                    <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
                        <ExamCard slug="telc" />
                        <ExamCard slug="dtz" />
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-6 py-16">
                <SectionHeading title={e.compareTitle} />
                <div className="mx-auto mt-10 max-w-5xl overflow-x-auto rounded-2xl border border-border bg-card">
                    <div className="grid min-w-[40rem] grid-cols-[10rem_1fr_1fr]">
                        <div className="border-b border-border p-4" />
                        <div className="border-b border-border p-4 font-bold text-foreground">{e.compareLabels.telc}</div>
                        <div className="border-b border-border p-4 font-bold text-foreground">{e.compareLabels.dtz}</div>
                        {e.compareRows.map((row) => (
                            <Fragment key={row.label}>
                                <div className="border-b border-border bg-muted/50 p-4 text-sm font-semibold text-foreground/70 last:border-b-0">{row.label}</div>
                                <div className="border-b border-border p-4 text-foreground/80">{row.telc}</div>
                                <div className="border-b border-border p-4 text-foreground/80">{row.dtz}</div>
                            </Fragment>
                        ))}
                    </div>
                </div>
                <p className="mx-auto mt-5 max-w-5xl text-sm text-foreground/60">{e.officialNote}</p>
                <div className="mt-8 flex justify-center">
                    <Link href="/features" className="font-semibold text-primary hover:underline">
                        {m.common.seeAllFeatures}
                    </Link>
                </div>
            </section>

            <CtaBand title={e.ctaTitle} text={e.ctaText} />
            <p className="container mx-auto px-6 pb-10 text-center text-xs text-foreground/50">{m.common.disclaimer}</p>
        </main>
    );
}
