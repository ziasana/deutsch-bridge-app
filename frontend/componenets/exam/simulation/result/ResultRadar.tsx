"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { SECTION_LABEL } from "@/lib/examSimulation";
import type { ExamSection } from "@/types/exam";
import type { PartResult } from "@/types/examSimulation";

/** Share of the points reached per exam section (only sections that are already scored), as a radar: the shape shows strengths and gaps at a glance. */
export function sectionShares(parts: PartResult[]): { section: ExamSection; label: string; percent: number }[] {
    const bySection = new Map<ExamSection, { score: number; max: number }>();
    for (const p of parts) {
        if (p.module !== "WRITTEN" || p.status !== "SCORED" || p.score == null || p.maxPoints <= 0) continue;
        const cur = bySection.get(p.section) ?? { score: 0, max: 0 };
        bySection.set(p.section, { score: cur.score + p.score, max: cur.max + p.maxPoints });
    }
    return [...bySection].map(([section, v]) => ({ section, label: SECTION_LABEL[section], percent: Math.round((v.score / v.max) * 100) }));
}

export default function ResultRadar({ shares }: Readonly<{ shares: { label: string; percent: number }[] }>) {
    return (
        <div className="h-64 w-full" role="img" aria-label={`Ergebnis nach Bereichen: ${shares.map((s) => `${s.label} ${s.percent} Prozent`).join(", ")}`}>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={shares} outerRadius="72%">
                    <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
                    <PolarAngleAxis dataKey="label" tick={{ fontSize: 11, fill: "currentColor" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip formatter={(value) => [`${value} %`, "erreicht"]} />
                    <Radar dataKey="percent" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} isAnimationActive={false} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
