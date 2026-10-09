import Link from "next/link";
import { ArrowRight, BookOpen, LineChart, PenLine } from "lucide-react";

interface WritingOverviewProps {
    level: string;
}

/** Landing choice: learn the method first, then apply it in exercises; the progress view sits below. Colours follow the surrounding theme. */
export default function WritingOverview({ level }: WritingOverviewProps) {
    const lvl = encodeURIComponent(level);
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <Link
                href={`/dashboard/exam-prep/schreiben/lernen?level=${lvl}`}
                className="group relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-(--lesson-from)/15 via-card to-(--lesson-to)/15 p-6 shadow-card ring-2 ring-primary/40 transition hover:-translate-y-1 hover:shadow-lg hover:ring-primary focus-visible:outline-none focus-visible:ring-primary"
            >
                <span aria-hidden="true" className="pointer-events-none absolute -bottom-4 -end-2 text-8xl opacity-10 transition group-hover:rotate-6 group-hover:opacity-20">📚</span>
                <span className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) text-white shadow-md transition group-hover:scale-105">
                    <BookOpen className="size-7" aria-hidden="true" />
                </span>
                <span className="relative mt-4 inline-flex self-start rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">Schritt 1</span>
                <h2 className="relative mt-2 text-xl font-bold text-foreground">Schreiben lernen</h2>
                <p className="relative mt-1 flex-1 text-sm text-foreground/65">Lerne Schritt für Schritt, wie du eine Schreibaufgabe löst – mit kleinen Lektionen und Mini-Spielen.</p>
                <span className="relative mt-5 inline-flex items-center gap-1.5 self-start rounded-full bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
                    Lernen <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
            </Link>

            <Link
                href={`/dashboard/exam-prep?section=SCHRIFTLICHER_AUSDRUCK&level=${lvl}`}
                className="group relative flex flex-col overflow-hidden rounded-3xl bg-card p-6 shadow-card ring-1 ring-border/60 transition hover:-translate-y-1 hover:shadow-lg hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <span aria-hidden="true" className="pointer-events-none absolute -bottom-4 -end-2 text-8xl opacity-10 transition group-hover:-rotate-6 group-hover:opacity-20">✍️</span>
                <span className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:scale-105">
                    <PenLine className="size-7" aria-hidden="true" />
                </span>
                <span className="relative mt-4 inline-flex self-start rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-foreground/60">Schritt 2</span>
                <h2 className="relative mt-2 text-xl font-bold text-foreground">Schreibaufgaben</h2>
                <p className="relative mt-1 flex-1 text-sm text-foreground/65">Wende dein Wissen in realistischen Prüfungsaufgaben an – mit Plan, Hilfe und Feedback.</p>
                <span className="relative mt-5 inline-flex items-center gap-1.5 self-start rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition group-hover:border-primary/50 group-hover:bg-primary/5">
                    Aufgaben <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
            </Link>

            <Link
                href={`/dashboard/exam-prep/schreiben/fortschritt?level=${lvl}`}
                className="group flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card ring-1 ring-border/60 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:col-span-2 sm:p-5"
            >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                    <LineChart className="size-6" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block font-bold text-foreground">Mein Schreibfortschritt</span>
                    <span className="block text-sm text-foreground/65">Deine Texte und woran du als Nächstes arbeiten solltest.</span>
                </span>
                <ArrowRight className="size-5 shrink-0 text-foreground/40 transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
            </Link>
        </div>
    );
}
