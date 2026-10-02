"use client";

import { ArrowRight, MessagesSquare } from "lucide-react";
import { RedemittelHub } from "@/types/redemittel";
import RisingBubbles from "@/componenets/learning/RisingBubbles";
import RisingWords from "@/componenets/learning/RisingWords";
import MasteryBar from "@/componenets/learning/MasteryBar";

// Sample phrases floating up the hero: a taste of what Redemittel are.
const SAMPLE_PHRASES = ["Meiner Meinung nach …", "Da stimme ich dir zu!", "Wie wäre es mit …?", "Ich möchte mich entschuldigen", "Darf ich Sie kurz stören?", "Vielen Dank im Voraus"];

interface Props {
    hub: RedemittelHub | undefined;
    onNavigate: (href: string) => void;
    onDiscover: () => void;
}

/** The Redemittel hero, built like the vocabulary and expressions heroes: title, one calm next step and a progress bar. No filters here. */
export default function RedemittelHeader({ hub, onNavigate, onDiscover }: Readonly<Props>) {
    const loading = !hub;
    const dueCount = hub?.dueCount ?? 0;
    const newToday = hub?.newToday ?? 0;
    const summary = hub?.summary ?? { learned: 0, mastered: 0, review: 0, learning: 0, fresh: 0 };
    const canPractice = summary.learned + (hub?.savedCount ?? 0) > 0;

    // One recommended next step: reviews first, then new Redemittel, then free practice.
    const next =
        dueCount > 0
            ? { label: "Wiederholen", run: () => onNavigate("/dashboard/redemittel/review") }
            : newToday > 0
              ? { label: "Neue lernen", run: () => onNavigate("/dashboard/redemittel/learn") }
              : canPractice
                ? { label: "Üben", run: () => onNavigate("/dashboard/redemittel/practice") }
                : { label: "Entdecken", run: onDiscover };

    return (
        <header className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.03] via-card to-card p-5 sm:p-6">
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-primary/[0.06]" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-1/4 size-36 rounded-full bg-primary/[0.04]" />
            <RisingBubbles count={10} />
            <RisingWords words={SAMPLE_PHRASES} />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div className="flex w-full min-w-0 items-center gap-3.5">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                        <MessagesSquare className="size-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Redemittel</h1>
                        <p className="text-sm text-foreground/60">Ausdrücke für Schreiben, Sprechen und Alltag.</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={next.run}
                    disabled={loading}
                    className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {next.label}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                </button>
            </div>

            {!loading && (
                <MasteryBar
                    segments={[
                        { key: "MASTERED", label: "Sicher", count: summary.mastered, color: "var(--learning-reading)" },
                        { key: "REVIEW", label: "Wiederholen", count: summary.review, color: "var(--learning-review)" },
                        { key: "LEARNING", label: "Lernen", count: summary.learning, color: "var(--learning-grammar)" },
                        { key: "NEW", label: "Neu", count: summary.fresh, color: "var(--learning-vocabulary)" },
                    ]}
                />
            )}
        </header>
    );
}
