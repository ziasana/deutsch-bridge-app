export interface MasteryBarSegment {
    key: string;
    label: string;
    count: number;
    /** Any CSS color, e.g. "var(--chart-1)". */
    color: string;
}

/** One segmented bar showing how well the shown items are known, with a legend of counts underneath. */
export default function MasteryBar({ segments, className = "mt-5" }: Readonly<{ segments: MasteryBarSegment[]; className?: string }>) {
    const total = segments.reduce((sum, s) => sum + s.count, 0);
    if (total === 0) return null;

    return (
        <div className={`relative ${className}`}>
            <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={segments.map((s) => `${s.label}: ${s.count}`).join(", ")}>
                {segments
                    .filter((s) => s.count > 0)
                    .map((s) => (
                        <span key={s.key} className="h-full transition-all duration-500" style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }} />
                    ))}
            </div>
            <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-foreground/65">
                {segments.map((s) => (
                    <li key={s.key} className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
                        {s.label}
                        <span className="font-semibold text-foreground/80">{s.count}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
