"use client";

import Link from "next/link";
import { Lightbulb } from "lucide-react";
import CtaBand from "@/componenets/marketing/CtaBand";
import MockExamFinder from "@/componenets/marketing/MockExamFinder";
import FaqList from "@/componenets/marketing/FaqList";
import SectionHeading from "@/componenets/marketing/SectionHeading";
import { useMarketing } from "@/componenets/marketing/useMarketing";

const RESULT_TONES = [
    "bg-green-500/15 text-green-700 dark:text-green-400",
    "bg-red-500/15 text-red-700 dark:text-red-400",
    "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    "bg-foreground/10 text-foreground/70",
];

export default function MockTestPage() {
    const { m } = useMarketing();
    const t = m.mockTest;

    return (
        <main className="bg-background">
            <section className="bg-gradient-to-b from-accent/60 to-background py-16 md:py-20">
                <div className="container mx-auto px-6">
                    <SectionHeading badge={t.badge} title={t.title} subtitle={t.subtitle} />
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Link href="/signup" className="btn-primary rounded-xl px-6 py-3 text-base">
                            {m.common.startFree}
                        </Link>
                        <Link href="/exams" className="btn-outline rounded-xl bg-card px-6 py-3 text-base">
                            {t.browseExams}
                        </Link>
                    </div>
                </div>
            </section>

            <MockExamFinder />

            <section className="bg-muted/50 py-16">
                <div className="container mx-auto px-6">
                    <SectionHeading title={t.stepsTitle} />
                    <ol className="mx-auto mt-10 flex max-w-3xl flex-col gap-4">
                        {t.steps.map((step, index) => (
                            <li key={step.title} className="flex gap-5 rounded-2xl border border-border bg-card p-5">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                                    {index + 1}
                                </span>
                                <div>
                                    <h3 className="font-bold text-foreground">{step.title}</h3>
                                    <p className="mt-1 text-foreground/70">{step.description}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="py-16">
                <div className="container mx-auto px-6">
                    <SectionHeading title={t.featuresTitle} />
                    <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {t.features.map((feature) => (
                            <div key={feature.title} className="rounded-2xl border border-border bg-card p-6">
                                <h3 className="font-bold text-foreground">{feature.title}</h3>
                                <p className="mt-2 text-sm text-foreground/70">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="container mx-auto grid grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-2">
                <div>
                    <SectionHeading align="start" title={t.resultsTitle} />
                    <ul className="mt-6 flex flex-col gap-3">
                        {t.results.map((result, index) => (
                            <li key={result.label} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-4">
                                <span lang="de" className={`w-fit shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${RESULT_TONES[index]}`}>
                                    {result.label}
                                </span>
                                <span className="text-sm text-foreground/70">{result.meaning}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <SectionHeading align="start" title={t.tipsTitle} />
                    <ul className="mt-6 flex flex-col gap-3">
                        {t.tips.map((tip) => (
                            <li key={tip} className="flex items-start gap-3 text-foreground/80">
                                <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="container mx-auto px-6 pb-16">
                <SectionHeading title={t.faqTitle} />
                <div className="mx-auto mt-8 max-w-3xl">
                    <FaqList items={t.faqs} />
                </div>
            </section>

            <CtaBand title={t.ctaTitle} text={t.ctaText} />
            <p className="container mx-auto px-6 pb-10 text-center text-xs text-foreground/50">{m.common.disclaimer}</p>
        </main>
    );
}
