"use client";

import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { GrammarIcon } from "@/componenets/brand/icons";
import LearningPageHero from "@/componenets/learning/LearningPageHero";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import HeroLevelFilter from "@/componenets/learning/HeroLevelFilter";

interface GrammarHeaderProps {
    title: string;
    subtitle: string;
    levels: { level: string }[];
    selectedLevel: string;
    onLevelChange: (level: string) => void;
    levelsLabel: string;
    /** Progress of the selected level. */
    learned: number;
    total: number;
    progressLabel?: string;
    continueLabel?: string;
    onContinue?: () => void;
    /** "Saved for later" block, shown under the level filter. */
    saved?: ReactNode;
    dir?: "ltr" | "rtl";
}

/** Grammar header: the shared learning header plus level chips in the brand level colours and a teal progress bar. */
export default function GrammarHeader({
    title,
    subtitle,
    levels,
    selectedLevel,
    onLevelChange,
    levelsLabel,
    learned,
    total,
    progressLabel,
    continueLabel,
    onContinue,
    saved,
    dir,
}: Readonly<GrammarHeaderProps>) {
    return (
        <LearningPageHero
            icon={GrammarIcon}
            title={title}
            subtitle={subtitle}
            dir={dir}
            accent={getLevelMeta(selectedLevel).color}
            actions={
                <>
                    {onContinue && continueLabel && (
                        <button
                            type="button"
                            onClick={onContinue}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#f2b544] px-5 py-2 text-sm font-semibold text-[#16324f] shadow-sm transition hover:bg-[#f5c26b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            {continueLabel}
                            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                        </button>
                    )}
                </>
            }
        >
            <HeroLevelFilter
                levels={levels}
                selectedLevel={selectedLevel}
                onLevelChange={onLevelChange}
                ariaLabel={levelsLabel}
                learned={learned}
                total={total}
                progressLabel={progressLabel}
            />
            {saved && <div className="mt-4">{saved}</div>}
        </LearningPageHero>
    );
}
