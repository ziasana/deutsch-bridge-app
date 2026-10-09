export interface MasteryBarSegment {
    key: string;
    label: string;
    count: number;
    /** Any CSS color, e.g. "var(--chart-1)". */
    color: string;
}

/** One segmented bar showing how well the shown items are known, with a legend of counts underneath. */
export default function MasteryBar({ segments, className = "mt-5", slim = false }: Readonly<{ segments: MasteryBarSegment[]; className?: string; /** A thin bar with a smaller legend. */ slim?: boolean }>) {
    const total = segments.reduce((sum, s) => sum + s.count, 0);
    if (total === 0) return null;

    return (
        <div className={`relative ${className}`}>
            <div className={`flex w-full gap-0.5 overflow-hidden rounded-full ${slim ? "h-1" : "h-2.5"}`} role="img" aria-label={segments.map((s) => `${s.label}: ${s.count}`).join(", ")}>
                {segments
                    .filter((s) => s.count > 0)
                    .map((s) => (
                        <span key={s.key} className="h-full transition-all duration-500" style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }} />
                    ))}
            </div>
            <ul className={`flex flex-wrap gap-y-1 text-foreground/65 ${slim ? "mt-1.5 gap-x-4 text-[11px]" : "mt-2.5 gap-x-5 text-xs"}`}>
                {segments.map((s) => (
                    <li key={s.key} className="flex items-center gap-1.5">
                        <span className={slim ? "size-1.5 rounded-full" : "size-2 rounded-full"} style={{ backgroundColor: s.color }} aria-hidden="true" />
                        {s.label}
                        <span className="font-semibold text-foreground/80">{s.count}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
