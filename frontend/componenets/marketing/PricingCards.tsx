"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useMarketing } from "./useMarketing";

export default function PricingCards() {
    const { m } = useMarketing();
    const { free, premium } = m.pricing;

    return (
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            <article className="flex flex-col rounded-3xl border border-border bg-card p-8 shadow-card">
                <h3 className="text-xl font-bold text-foreground">{free.name}</h3>
                <p className="mt-3 text-4xl font-bold text-foreground">{free.price}</p>
                <p className="mt-1 text-sm text-foreground/60">{free.note}</p>
                <ul className="mt-6 flex flex-col gap-3">
                    {free.points.map((point) => (
                        <li key={point} className="flex items-start gap-3 text-foreground/80">
                            <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                            {point}
                        </li>
                    ))}
                </ul>
                <Link href="/signup" className="btn-primary mt-8 rounded-xl py-3 text-center text-base">
                    {free.cta}
                </Link>
            </article>

            <article className="relative flex flex-col rounded-3xl border-2 border-primary bg-card p-8 shadow-card">
                <span className="absolute -top-3 start-8 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    {premium.badge}
                </span>
                <h3 className="text-xl font-bold text-foreground">{premium.name}</h3>
                <p className="mt-3 text-4xl font-bold text-primary">{premium.price}</p>
                <p className="mt-1 text-sm text-foreground/60">{premium.note}</p>
                <ul className="mt-6 flex flex-col gap-3">
                    {premium.points.map((point) => (
                        <li key={point} className="flex items-start gap-3 text-foreground/80">
                            <Check className="mt-0.5 size-5 shrink-0 text-primary" />
                            {point}
                        </li>
                    ))}
                </ul>
                <Link href="/signup" className="btn-outline mt-8 rounded-xl py-3 text-center text-base">
                    {premium.cta}
                </Link>
            </article>
        </div>
    );
}
