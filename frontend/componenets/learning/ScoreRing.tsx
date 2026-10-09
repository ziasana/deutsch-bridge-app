import { cn } from "@/lib/utils";

/** A score as a ring with "3/5" in the middle. `strokeClass` sets the ring colour (a Tailwind `stroke-*` class). */
export default function ScoreRing({
    correct,
    total,
    size = 124,
    strokeClass = "stroke-primary",
}: Readonly<{ correct: number; total: number; size?: number; strokeClass?: string }>) {
    const radius = size / 2 - 8;
    const circumference = 2 * Math.PI * radius;
    const value = total > 0 ? correct / total : 0;
    return (
        <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`${correct}/${total}`}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={9} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    className={cn("transition-all duration-1000", strokeClass)}
                    strokeWidth={9}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - value * circumference}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold tabular-nums text-foreground">
                {correct}/{total}
            </span>
        </div>
    );
}
