"use client";

import { formatPoints } from "@/lib/examSimulation";
import { cn } from "@/lib/utils";

/** Score as a ring; the tick on the ring is the pass threshold. */
export function ScoreRing({ score, max, threshold, complete }: Readonly<{ score: number | null; max: number | null; threshold: number; complete: boolean }>) {
    const size = 84;
    const r = 34;
    const c = 2 * Math.PI * r;
    const pct = score != null && max ? Math.min(1, score / max) : 0;
    const passed = complete && score != null && score >= threshold;
    const tickAngle = max ? (threshold / max) * 360 - 90 : -90;
    const tx = size / 2 + Math.cos((tickAngle * Math.PI) / 180) * r;
    const ty = size / 2 + Math.sin((tickAngle * Math.PI) / 180) * r;
    return (
        <div className="relative size-[84px] shrink-0">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="8" className="stroke-foreground/10" />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c * (1 - pct)}
                    className={cn("transition-[stroke-dashoffset] duration-700", !complete ? "stroke-amber-500" : passed ? "stroke-green-500" : "stroke-red-500")}
                />
            </svg>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden>
                <circle cx={tx} cy={ty} r="3" className="fill-foreground" />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center text-lg font-extrabold tabular-nums leading-none text-foreground">
                {complete ? formatPoints(score) : "–"}
                <span className="mt-0.5 text-[10px] font-semibold text-foreground/50">/ {formatPoints(max)}</span>
            </span>
        </div>
    );
}
