"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/componenets/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/componenets/ui/chart";
import type { DailyActivityEntry } from "@/types/adminAnalytics";

const chartConfig: ChartConfig = {
    activeLearners: {
        label: "Active learners",
        color: "var(--chart-2)",
    },
};

function formatDayLabel(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function LearnerActivityChart({ daily }: Readonly<{ daily: DailyActivityEntry[] }>) {
    const hasActivity = daily.some((d) => d.activeLearners > 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Learner Activity</CardTitle>
            </CardHeader>
            <CardContent>
                {hasActivity ? (
                    <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
                        <BarChart data={daily} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={formatDayLabel}
                                minTickGap={20}
                            />
                            <ChartTooltip content={<ChartTooltipContent labelFormatter={(label) => formatDayLabel(String(label))} />} />
                            <Bar dataKey="activeLearners" fill="var(--color-activeLearners)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <div className="flex h-[220px] flex-col items-center justify-center text-center text-sm text-foreground/50">
                        <p className="font-medium text-foreground/70">No learning activity yet</p>
                        <p className="mt-1 max-w-xs">
                            Once learners start using the learning modules, activity data will appear here.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
