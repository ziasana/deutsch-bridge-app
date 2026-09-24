"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/componenets/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/componenets/ui/chart";
import { moduleLabel } from "@/componenets/admin/dashboard/moduleLabels";
import type { FeatureUsageEntry } from "@/types/adminAnalytics";

const chartConfig: ChartConfig = {
    uniqueLearners: {
        label: "Learners",
        color: "var(--chart-1)",
    },
};

export default function FeatureUsageChart({ data }: Readonly<{ data: FeatureUsageEntry[] }>) {
    const hasUsage = data.some((d) => d.uniqueLearners > 0);
    const chartData = data.map((d) => ({ module: moduleLabel(d.module), uniqueLearners: d.uniqueLearners }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Feature Usage</CardTitle>
            </CardHeader>
            <CardContent>
                {hasUsage ? (
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-auto w-full"
                        style={{ height: Math.max(200, chartData.length * 34) }}
                    >
                        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                            <CartesianGrid horizontal={false} />
                            <XAxis type="number" tickLine={false} axisLine={false} />
                            <YAxis dataKey="module" type="category" tickLine={false} axisLine={false} width={140} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="uniqueLearners" fill="var(--color-uniqueLearners)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <div className="flex h-[160px] items-center justify-center text-sm text-foreground/50">
                        No usage data available yet.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
