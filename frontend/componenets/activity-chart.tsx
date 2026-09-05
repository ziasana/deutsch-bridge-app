"use client"

import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/componenets/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/componenets/ui/chart"

const activityData = [
    { day: "Mon", minutes: 45, words: 32 },
    { day: "Tue", minutes: 30, words: 18 },
    { day: "Wed", minutes: 60, words: 45 },
    { day: "Thu", minutes: 25, words: 15 },
    { day: "Fri", minutes: 55, words: 38 },
    { day: "Sat", minutes: 80, words: 62 },
    { day: "Sun", minutes: 40, words: 28 },
]

const chartConfig = {
    minutes: {
        label: "Minutes",
        color: "var(--chart-1)",
    },
    words: {
        label: "Words Learned",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

export function ActivityChart() {
    return (
        <Card className="border-border/50">
            <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <CardDescription>
                    Your learning activity over the past 7 days
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <AreaChart
                        data={activityData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="fillMinutes" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--chart-1)"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--chart-1)"
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                            <linearGradient id="fillWords" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--chart-2)"
                                    stopOpacity={0.4}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--chart-2)"
                                    stopOpacity={0.05}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="var(--border)"
                        />
                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            fontSize={12}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            fontSize={12}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" hideLabel />}
                        />
                        <Area
                            dataKey="words"
                            type="monotone"
                            fill="url(#fillWords)"
                            stroke="var(--chart-2)"
                            strokeWidth={2}
                            stackId="1"
                        />
                        <Area
                            dataKey="minutes"
                            type="monotone"
                            fill="url(#fillMinutes)"
                            stroke="var(--chart-1)"
                            strokeWidth={2}
                            stackId="2"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
