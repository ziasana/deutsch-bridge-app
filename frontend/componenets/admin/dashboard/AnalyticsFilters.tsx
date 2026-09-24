import type { AnalyticsLevel, AnalyticsRange } from "@/types/adminAnalytics";

const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
];

const LEVEL_OPTIONS: { value: AnalyticsLevel; label: string }[] = [
    { value: "ALL", label: "All Levels" },
    { value: "A1", label: "A1" },
    { value: "A2", label: "A2" },
    { value: "B1", label: "B1" },
    { value: "B2", label: "B2" },
    { value: "C1", label: "C1" },
    { value: "C2", label: "C2" },
];

interface AnalyticsFiltersProps {
    range: AnalyticsRange;
    onRangeChange: (range: AnalyticsRange) => void;
    level?: AnalyticsLevel;
    onLevelChange?: (level: AnalyticsLevel) => void;
}

const SELECT_CLASSES =
    "rounded-lg border border-border bg-muted text-foreground px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none";

export default function AnalyticsFilters({ range, onRangeChange, level, onLevelChange }: Readonly<AnalyticsFiltersProps>) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <select
                value={range}
                onChange={(e) => onRangeChange(e.target.value as AnalyticsRange)}
                className={SELECT_CLASSES}
                aria-label="Analytics period"
            >
                {RANGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>

            {onLevelChange && (
                <select
                    value={level}
                    onChange={(e) => onLevelChange(e.target.value as AnalyticsLevel)}
                    className={SELECT_CLASSES}
                    aria-label="Learner level"
                >
                    {LEVEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
}
