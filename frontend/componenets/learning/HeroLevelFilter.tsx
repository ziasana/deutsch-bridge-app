"use client";

import { getLevelMeta } from "@/componenets/learning/levelMeta";
import { cn } from "@/lib/utils";

interface HeroLevelFilterProps {
    levels: { level: string }[];
    selectedLevel: string;
    onLevelChange: (level: string) => void;
    ariaLabel: string;
    /** Progress of the selected level. */
    learned: number;
    total: number;
    progressLabel?: string;
    /** Adds a leading "all" chip whose value is "ALL" (no level filter). */
    allLabel?: string;
    /** Hide the progress bar (the page shows its own, e.g. a segmented one). */
    hideProgress?: boolean;
}

/** Level chips (brand level colours) and a teal progress bar for the selected level, placed inside the navy page header. */
export default function HeroLevelFilter({ levels, selectedLevel, onLevelChange, ariaLabel, learned, total, progressLabel, allLabel, hideProgress = false }: Readonly<HeroLevelFilterProps>) {
    const percent = total > 0 ? Math.min(100, Math.round((learned / total) * 100)) : 0;

    return (
        <>
            <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
                {(allLabel ? [{ level: "ALL" }, ...levels] : levels).map(({ level }) => {
                    const active = level === selectedLevel;
                    const color = level === "ALL" ? "#2b4a68" : getLevelMeta(level).color;
                    const honey = color === "#c98a12";
                    return (
                        <button
                            key={level}
                            type="button"
                            aria-pressed={active}
                            onClick={() => onLevelChange(level)}
                            className={cn(
                                "cursor-pointer rounded-full px-4 py-1 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                                active ? "ring-2 ring-white ring-offset-2 ring-offset-[#16324f]" : "opacity-85 hover:opacity-100",
                            )}
                            style={honey ? { backgroundColor: "#2b4a68", color: "#f2b544" } : { backgroundColor: color, color: "#ffffff" }}
                        >
                            {level === "ALL" ? allLabel : level}
                        </button>
                    );
                })}
            </div>

            {!hideProgress && (
            <div className="mt-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-[#254969]" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={learned} aria-label={progressLabel}>
                    <div className="h-full rounded-full bg-[#4f9d96] transition-all duration-700" style={{ width: `${percent}%` }} />
                </div>
                {progressLabel && <p className="mt-1.5 text-xs text-[#b9c7d6]">{progressLabel}</p>}
            </div>
            )}
        </>
    );
}
