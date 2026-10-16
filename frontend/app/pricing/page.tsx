"use client";

import Link from "next/link";
import CtaBand from "@/componenets/marketing/CtaBand";
import FaqList from "@/componenets/marketing/FaqList";
import PricingCards from "@/componenets/marketing/PricingCards";
import SectionHeading from "@/componenets/marketing/SectionHeading";
import { useMarketing } from "@/componenets/marketing/useMarketing";

export default function PricingPage() {
    const { m } = useMarketing();
    const p = m.pricing;

    return (
        <main className="bg-background">
            <section className="bg-gradient-to-b from-accent/60 to-background py-16 md:py-20">
                <div className="container mx-auto px-6">
                    <SectionHeading badge={p.badge} title={p.title} subtitle={p.subtitle} />
                    <div className="mt-12">
                        <PricingCards />
                    </div>
                </div>
            </section>

            <section className="container mx-auto px-6 py-16">
                <SectionHeading title={p.limitsTitle} />
                <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-2xl border border-border bg-card">
                    <table className="w-full text-start">
                        <thead className="bg-muted/60 text-sm text-foreground/70">
                            <tr>
                                <th scope="col" className="px-5 py-3 text-start font-semibold">{p.limitsHeader.feature}</th>
                                <th scope="col" className="px-5 py-3 text-start font-semibold">{p.limitsHeader.free}</th>
                                <th scope="col" className="px-5 py-3 text-start font-semibold text-primary">{p.limitsHeader.premium}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {p.limits.map((row) => (
                                <tr key={row.feature} className="border-t border-border">
                                    <th scope="row" className="px-5 py-4 text-start font-medium text-foreground">{row.feature}</th>
                                    <td className="px-5 py-4 text-foreground/70">{row.free}</td>
                                    <td className="px-5 py-4 font-semibold text-primary">{row.premium}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="mx-auto mt-5 max-w-3xl text-center text-sm text-foreground/60">
                    {p.paymentNote}{" "}
                    <Link href="/contact" className="font-semibold text-primary hover:underline">
                        {p.contact}
                    </Link>
                </p>
            </section>

            <section className="container mx-auto px-6 pb-16">
                <SectionHeading title={p.faqTitle} />
                <div className="mx-auto mt-8 max-w-3xl">
                    <FaqList items={p.faqs} />
                </div>
            </section>

            <CtaBand title={m.home.finalCta.title} text={m.home.finalCta.text} />
        </main>
    );
}
