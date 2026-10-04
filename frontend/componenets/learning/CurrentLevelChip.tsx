"use client";

import { BarChart3 } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import useAuthStore from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

interface CurrentLevelChipProps {
    /** When given the chip is a button (e.g. jumps the page's level selector to the user's level). */
    onSelect?: (level: string) => void;
    /** Tooltip; defaults to the translated "Current level". */
    title?: string;
    className?: string;
}

/** The user's profile level as a small chip for hero titles. Renders nothing while the level is unset. */
export default function CurrentLevelChip({ onSelect, title, className }: Readonly<CurrentLevelChipProps>) {
    const { t } = useI18n();
    const learningLevel = useAuthStore((s) => s.userProfile?.learningLevel);

    // The backend can send the literal string "null" for an unset profile level.
    if (!learningLevel || learningLevel === "null") return null;

    const tooltip = title ?? t.grammar.currentLevel;
    const base = "inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary";
    const content = (
        <>
            <BarChart3 className="size-3" aria-hidden="true" />
            {learningLevel}
        </>
    );

    if (!onSelect) {
        return (
            <span title={tooltip} className={cn(base, className)}>
                {content}
            </span>
        );
    }
    return (
        <button
            type="button"
            onClick={() => onSelect(learningLevel)}
            title={tooltip}
            className={cn(
                base,
                "cursor-pointer transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                className,
            )}
        >
            {content}
        </button>
    );
}
