"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/componenets/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/componenets/ui/chart";
import type { UserActivity } from "@/types/adminDashboard";

const chartConfig: ChartConfig = {
    activeUsers: {
        label: "Active users",
        color: "var(--chart-1)",
    },
};

function formatDayLabel(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
}

export default function UserActivityChart({ data }: Readonly<{ data: UserActivity }>) {
    const hasActivity = data.series.some((p) => p.activeUsers > 0);

    const chartData = data.series.map((p) => ({
        day: formatDayLabel(p.date),
        activeUsers: p.activeUsers,
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="size-4 text-foreground/60" />
                    User Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                {hasActivity ? (
                    <ChartContainer config={chartConfig} className="aspect-auto h-[140px] w-full">
                        <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                            <defs>
                                <linearGradient id="activeUsersFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-activeUsers)" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="var(--color-activeUsers)" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area
                                dataKey="activeUsers"
                                type="monotone"
                                fill="url(#activeUsersFill)"
                                stroke="var(--color-activeUsers)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ChartContainer>
                ) : (
                    <div className="flex h-[140px] items-center justify-center text-sm text-foreground/50">
                        No activity data available yet.
                    </div>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 py-2">
                        <p className="text-lg font-semibold text-foreground">{data.today}</p>
                        <p className="text-xs text-foreground/60">Today</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 py-2">
                        <p className="text-lg font-semibold text-foreground">{data.thisWeek}</p>
                        <p className="text-xs text-foreground/60">This week</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 py-2">
                        <p className="text-lg font-semibold text-foreground">{data.thisMonth}</p>
                        <p className="text-xs text-foreground/60">This month</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
