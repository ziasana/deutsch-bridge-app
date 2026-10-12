"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPoints } from "@/lib/examSimulation";
import type { ProgressPoint } from "@/types/examSimulation";

/** Written score per finished attempt with the pass threshold as a reference line. Only fully assessed attempts are plotted. */
export default function SimProgressChart({ points, max, threshold }: Readonly<{ points: ProgressPoint[]; max: number; threshold: number }>) {
    const data = points
        .filter((p) => p.writtenComplete && p.writtenScore != null)
        .map((p, i) => ({ name: `${i + 1}. Versuch`, date: new Date(p.endedAtMs).toLocaleDateString("de-DE"), score: p.writtenScore as number }));
    if (data.length === 0) {
        return <p className="text-sm text-foreground/60">Sobald eine Prüfung vollständig bewertet ist, erscheint hier dein Verlauf.</p>;
    }
    return (
        <div className="h-60 w-full" role="img" aria-label="Verlauf der schriftlichen Punktzahl">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.12} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, max]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`${formatPoints(Number(value))} / ${formatPoints(max)}`, "Schriftlich"]} labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""} />
                    <ReferenceLine y={threshold} stroke="#16a34a" strokeDasharray="5 4" label={{ value: `Bestehensgrenze ${formatPoints(threshold)}`, fontSize: 11, fill: "#16a34a", position: "insideTopLeft" }} />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
