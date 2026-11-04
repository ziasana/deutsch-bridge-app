import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ExerciseQuiz from "@/componenets/seo/ExerciseQuiz";
import JsonLd from "@/componenets/seo/JsonLd";
import { getLandingPage } from "@/lib/landingPages";
import { SAMPLE_EXERCISES, getSampleExercise } from "@/lib/sampleExercises";
import { breadcrumbJsonLd, publicPageMetadata } from "@/lib/seo";

export const dynamicParams = false;
export const generateStaticParams = () => SAMPLE_EXERCISES.map((e) => ({ slug: e.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const ex = getSampleExercise((await params).slug);
  return ex ? publicPageMetadata({ title: ex.title, description: ex.description, path: `/uebungen/${ex.slug}` }) : {};
}

export default async function ExercisePage({ params }: { params: Promise<{ slug: string }> }) {
  const ex = getSampleExercise((await params).slug);
  if (!ex) notFound();
  const landing = getLandingPage(ex.landing);
  const others = SAMPLE_EXERCISES.filter((e) => e.slug !== ex.slug);

  return (
    <main lang="de" className="container mx-auto max-w-3xl px-6 py-12">
      <JsonLd data={breadcrumbJsonLd([{ name: "DeutschCertify", path: "/" }, { name: "Übungen", path: "/uebungen" }, { name: ex.h1, path: `/uebungen/${ex.slug}` }])} />
      <nav aria-label="Brotkrumen" className="text-sm text-foreground/60">
        <Link href="/uebungen" className="hover:underline">Übungen</Link>
      </nav>
      <h1 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">{ex.h1}</h1>
      <p className="mt-4 text-foreground/75">{ex.intro}</p>
      <p className="mt-2 text-xs text-foreground/55">Eigene Übung im Stil der Prüfung – kein offizielles Prüfungsmaterial.</p>

      <h2 className="mt-8 text-lg font-semibold text-foreground">{ex.instructions}</h2>
      {ex.passage && (
        <blockquote className="mt-4 rounded-2xl bg-muted p-5 leading-relaxed text-foreground/90">
          {ex.passage.heading && <p className="mb-2 font-semibold">{ex.passage.heading}</p>}
          {ex.passage.lines.map((l) => <p key={l} className="mt-2 first:mt-0">{l}</p>)}
        </blockquote>
      )}
      <div className="mt-6"><ExerciseQuiz questions={ex.questions} more={ex.more} /></div>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-foreground">Mehr zum Thema</h2>
        <ul className="mt-3 space-y-2">
          {landing && <li><Link href={`/${landing.slug}`} className="font-semibold text-primary hover:underline">{landing.h1}</Link></li>}
          {others.map((o) => <li key={o.slug}><Link href={`/uebungen/${o.slug}`} className="text-primary hover:underline">{o.h1}</Link></li>)}
        </ul>
      </section>
    </main>
  );
}
