import Link from "next/link";
import { ArrowRight, BookOpen, PenLine } from "lucide-react";
import { WRITING_COLOR } from "./writingMeta";

interface WritingOverviewProps {
    level: string;
}

/** Landing choice: learn the method first, then apply it in exercises. */
export default function WritingOverview({ level }: WritingOverviewProps) {
    const lvl = encodeURIComponent(level);
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <Link
                href={`/dashboard/exam-prep/schreiben/lernen?level=${lvl}`}
                className="group flex flex-col rounded-2xl border-2 bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg sm:row-span-1"
                style={{ borderColor: WRITING_COLOR }}
            >
                <span className="flex size-12 items-center justify-center rounded-full" style={{ backgroundColor: `${WRITING_COLOR}1a` }}>
                    <BookOpen className="size-6" style={{ color: WRITING_COLOR }} />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-foreground">📚 Schreiben lernen</h2>
                <p className="mt-1 flex-1 text-sm text-foreground/60">Lerne Schritt für Schritt, wie du eine Schreibaufgabe löst.</p>
                <span className="mt-5 inline-flex items-center gap-1.5 self-start rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                    Lernen <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </span>
            </Link>

            <Link
                href={`/dashboard/exam-prep?section=SCHRIFTLICHER_AUSDRUCK&level=${lvl}`}
                className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
            >
                <span className="flex size-12 items-center justify-center rounded-full bg-accent">
                    <PenLine className="size-6 text-primary" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-foreground">✍️ Schreibaufgaben</h2>
                <p className="mt-1 flex-1 text-sm text-foreground/60">Wende dein Wissen in realistischen Aufgaben an.</p>
                <span className="mt-5 inline-flex items-center gap-1.5 self-start rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground group-hover:bg-accent">
                    Aufgaben <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </span>
            </Link>
            <Link
                href={`/dashboard/exam-prep/schreiben/fortschritt?level=${lvl}`}
                className="group flex items-center justify-between rounded-2xl border border-border/60 bg-card px-6 py-4 shadow-card transition hover:bg-accent/40 sm:col-span-2"
            >
                <span>
                    <span className="block font-semibold text-foreground">📈 Mein Schreibfortschritt</span>
                    <span className="block text-sm text-foreground/60">Deine Texte und woran du als Nächstes arbeiten solltest.</span>
                </span>
                <ArrowRight className="size-4 text-foreground/40 transition group-hover:translate-x-0.5" />
            </Link>
        </div>
    );
}
