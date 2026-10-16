"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import CtaBand from "@/componenets/marketing/CtaBand";
import { FEATURE_ICONS } from "@/componenets/marketing/FeatureIcons";
import SectionHeading from "@/componenets/marketing/SectionHeading";
import { useMarketing } from "@/componenets/marketing/useMarketing";

export default function FeaturesPage() {
    const { m } = useMarketing();
    const f = m.features;

    return (
        <main className="bg-background">
            <section className="bg-gradient-to-b from-accent/60 to-background py-16 md:py-20">
                <div className="container mx-auto px-6">
                    <SectionHeading badge={f.badge} title={f.title} subtitle={f.subtitle} />
                </div>
            </section>

            <section className="container mx-auto grid grid-cols-1 gap-6 px-6 py-16 md:grid-cols-2">
                {f.items.map((item) => {
                    const Icon = FEATURE_ICONS[item.id];
                    return (
                        <article key={item.id} id={item.id} className="scroll-mt-28 rounded-2xl border border-border bg-card p-7 shadow-card">
                            <span className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                                <Icon className="size-6" />
                            </span>
                            <h2 className="mt-4 text-xl font-bold text-foreground">{item.title}</h2>
                            <p className="mt-2 text-foreground/70">{item.description}</p>
                            <ul className="mt-4 flex flex-col gap-2">
                                {item.points.map((point) => (
                                    <li key={point} className="flex items-start gap-3 text-sm text-foreground/80">
                                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                            {item.id === "mock-exam" && (
                                <Link href="/mock-test" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">
                                    {m.common.learnMore} →
                                </Link>
                            )}
                        </article>
                    );
                })}
            </section>

            <CtaBand title={f.ctaTitle} text={f.ctaText} />
            <p className="container mx-auto px-6 pb-10 text-center text-xs text-foreground/50">{m.common.disclaimer}</p>
        </main>
    );
}
