import Link from "next/link";
import SectionHeading from "@/componenets/marketing/SectionHeading";
import { LANDING_PAGES } from "@/lib/landingPages";

const COPY = {
  en: { title: "Learn German online – from A1 to C1", subtitle: "Guides and practice for every goal: vocabulary, grammar, expressions and exam preparation for TELC B1 and DTZ. The guides are written in German." },
  de: { title: "Deutsch lernen online – von A1 bis C1", subtitle: "Ratgeber und Übungen für jedes Ziel: Wortschatz, Grammatik, Redemittel und Prüfungsvorbereitung für telc B1 und DTZ." },
  fa: { title: "یادگیری آنلاین زبان آلمانی – از A1 تا C1", subtitle: "راهنما و تمرین برای هر هدف: واژگان، دستور زبان، عبارت‌ها و آمادگی آزمون TELC B1 و DTZ. راهنماها به زبان آلمانی هستند." },
} as const;

export default function TopicLinks({ language }: Readonly<{ language: "en" | "de" | "fa" }>) {
  const c = COPY[language];
  return (
    <section className="container mx-auto px-6 py-20">
      <SectionHeading title={c.title} subtitle={c.subtitle} />
      <ul className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LANDING_PAGES.map((p) => (
          <li key={p.slug}>
            <Link href={`/${p.slug}`} lang="de" className="block h-full rounded-2xl border border-border bg-card p-5 transition hover:border-primary">
              <span className="font-bold text-foreground">{p.h1}</span>
              <span className="mt-2 block text-sm text-foreground/65">{p.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
