"use client";

import { ArrowRight, MessagesSquare } from "lucide-react";
import { RedemittelHub } from "@/types/redemittel";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import HeroLevelFilter from "@/componenets/learning/HeroLevelFilter";
import MasteryBar from "@/componenets/learning/MasteryBar";
import CurrentLevelChip from "@/componenets/learning/CurrentLevelChip";
import { REDEMITTEL_LEVELS } from "./redemittelMeta";

interface Props {
    hub: RedemittelHub | undefined;
    onNavigate: (href: string) => void;
    onDiscover: () => void;
    /** Colour of the leading stripe: the Redemittel colour, or the level colour while a level is filtered. */
    accent?: string;
    /** Selected level filter ("ALL" = none). */
    level: string;
    onLevel: (level: string) => void;
}

/** The Redemittel header: the shared navy learning header with the level filter, one calm next step and the mastery bar. */
export default function RedemittelHeader({ hub, onNavigate, onDiscover, accent, level, onLevel }: Readonly<Props>) {
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
        <LearningPageHero
            icon={MessagesSquare}
            title="Redemittel"
            subtitle="Ausdrücke für Schreiben, Sprechen und Alltag."
            meta={<CurrentLevelChip title="Dein aktuelles Niveau" />}
            accent={accent}
            actions={
                <button
                    type="button"
                    onClick={next.run}
                    disabled={loading}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#f2b544] px-5 py-2 text-sm font-semibold text-[#16324f] shadow-sm transition hover:bg-[#f5c26b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {next.label}
                    <ArrowRight className="size-4" aria-hidden="true" />
                </button>
            }
        >
            <HeroLevelFilter
                levels={REDEMITTEL_LEVELS.map((l) => ({ level: l }))}
                selectedLevel={level}
                onLevelChange={onLevel}
                ariaLabel="Niveau"
                allLabel="Alle"
                learned={0}
                total={0}
                hideProgress
            />
            {!loading && (
                <MasteryBar
                    slim
                    className="mt-4"
                    segments={[
                        { key: "MASTERED", label: "Sicher", count: summary.mastered, color: "var(--learning-reading)" },
                        { key: "REVIEW", label: "Wiederholen", count: summary.review, color: "var(--learning-review)" },
                        { key: "LEARNING", label: "Lernen", count: summary.learning, color: "var(--learning-grammar)" },
                        { key: "NEW", label: "Neu", count: summary.fresh, color: "var(--learning-vocabulary)" },
                    ]}
                />
            )}
        </LearningPageHero>
    );
}
