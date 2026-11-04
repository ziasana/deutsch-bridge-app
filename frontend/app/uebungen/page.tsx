import Link from "next/link";
import { SAMPLE_EXERCISES } from "@/lib/sampleExercises";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Kostenlose Deutsch-Übungen mit Lösungen",
  description: "Kostenlose Deutsch-Übungen ohne Anmeldung: telc B1 Lesen, Sprachbausteine, DTZ Lesen, Grammatik und Wortschatz – mit Lösungen und Erklärungen.",
  path: "/uebungen",
});

export default function ExercisesIndex() {
  return (
    <main lang="de" className="container mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground md:text-4xl">Kostenlose Deutsch-Übungen mit Lösungen</h1>
      <p className="mt-4 text-foreground/75">Probiere Beispielübungen ohne Anmeldung aus. Nach dem Lösen siehst du die richtigen Antworten mit kurzer Erklärung. Alle Übungen sind eigene Texte und keine offiziellen Prüfungsaufgaben.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {SAMPLE_EXERCISES.map((e) => (
          <li key={e.slug}>
            <Link href={`/uebungen/${e.slug}`} className="block h-full rounded-2xl border border-border bg-card p-5 transition hover:border-primary">
              <span className="font-bold text-foreground">{e.h1}</span>
              <span className="mt-2 block text-sm text-foreground/65">{e.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
