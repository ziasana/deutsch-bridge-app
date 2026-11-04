import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import CtaBand from "@/componenets/marketing/CtaBand";
import FaqList from "@/componenets/marketing/FaqList";
import SectionHeading from "@/componenets/marketing/SectionHeading";
import JsonLd from "@/componenets/seo/JsonLd";
import { LANDING_PAGES, type LandingPage } from "@/lib/landingPages";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

/** Server-rendered public landing page: all copy is in the initial HTML, links are plain anchors. */
export default function LandingPageView({ page }: Readonly<{ page: LandingPage }>) {
  const related = page.related.map((slug) => LANDING_PAGES.find((p) => p.slug === slug)).filter((p): p is LandingPage => !!p);

  return (
    <main lang="de" className="bg-background">
      <JsonLd data={breadcrumbJsonLd([{ name: "DeutschCertify", path: "/" }, { name: page.h1, path: `/${page.slug}` }])} />
      <JsonLd data={faqJsonLd(page.faq)} />

      <section className="bg-gradient-to-b from-accent/60 to-background">
        <div className="container mx-auto max-w-4xl px-6 py-14 md:py-20">
          <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl">{page.h1}</h1>
          <p className="mt-5 text-lg text-foreground/70">{page.intro}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/signup" className="btn-primary rounded-xl px-6 py-3 text-base">Kostenlos starten</Link>
            {page.practice.map((p) => (
              <Link key={p.href} href={p.href} className="btn-outline rounded-xl bg-card px-6 py-3 text-base">{p.label}</Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-4xl space-y-12 px-6 py-14">
        {page.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">{s.heading}</h2>
            {s.body.map((para) => (
              <p key={para} className="mt-3 text-foreground/75">{para}</p>
            ))}
            {s.bullets && (
              <ul className="mt-4 space-y-2">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-foreground/80">
                    <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><Check className="size-3" /></span>
                    {b}
                  </li>
                ))}
              </ul>
            )}
            {s.link && (
              <Link href={s.link.href} className="mt-4 inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                {s.link.label} <ArrowRight className="size-4" />
              </Link>
            )}
          </section>
        ))}

        <section>
          <SectionHeading align="start" title="Häufige Fragen" />
          <div className="mt-6"><FaqList items={page.faq} /></div>
        </section>

        {related.length > 0 && (
          <nav aria-label="Weiterführende Themen">
            <h2 className="text-2xl font-bold text-foreground">Weiterführende Themen</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/${r.slug}`} className="block rounded-xl border border-border bg-card p-4 transition hover:border-primary">
                    <span className="font-semibold text-foreground">{r.h1}</span>
                    <span className="mt-1 block text-sm text-foreground/60">{r.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <CtaBand title="Bereit zum Üben?" text="Erstelle ein kostenloses Konto und speichere deinen Fortschritt." />
    </main>
  );
}
