"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const weekData = [
    { day: "Mon", date: 20, active: true, minutes: 45 },
    { day: "Tue", date: 21, active: true, minutes: 30 },
    { day: "Wed", date: 22, active: true, minutes: 60 },
    { day: "Thu", date: 23, active: false, minutes: 0 },
    { day: "Fri", date: 24, active: true, minutes: 55 },
    { day: "Sat", date: 25, active: true, minutes: 80 },
    { day: "Sun", date: 26, active: true, minutes: 40 },
]

interface StreakCalendarProps {
    currentStreak?: number
}

export function StreakCalendar({ currentStreak }: StreakCalendarProps) {
    const activeDays = weekData.filter((d) => d.active).length

    return (
        <Card className="border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>This Week</span>
                    <span className="flex items-center gap-1 text-sm font-normal text-accent">
            <FlameIcon className="h-4 w-4" />
                        {currentStreak ?? "-"} day streak
          </span>
                </CardTitle>
                <CardDescription>{activeDays} of 7 days active</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2">
                    {weekData.map((day) => (
                        <div key={day.day} className="flex flex-col items-center gap-1">
                            <span className="text-xs text-muted-foreground">{day.day}</span>
                            <div
                                className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                                    day.active
                                        ? "bg-primary/20 text-primary"
                                        : "bg-secondary text-muted-foreground"
                                )}
                            >
                                {day.date}
                            </div>
                            {day.active && (
                                <span className="text-xs text-chart-2">{day.minutes}m</span>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function FlameIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
        >
            <path
                fillRule="evenodd"
                d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.546 3.75 3.75 0 0 1 3.255 3.718Z"
                clipRule="evenodd"
            />
        </svg>
    )
}
