"use client"

import { useEffect, useState } from "react"
import { BookOpen, GraduationCap, Link2, Target } from "lucide-react"
import { StatsCard } from "@/componenets/stats-card"
import { ActivityChart } from "@/componenets/activity-chart"
import { LessonProgress } from "@/componenets/lesson-progress"
import { StreakCalendar } from "@/componenets/streak-calendar"
import { RecentWords } from "@/componenets/recent-words"
import { getOverview, getStreak } from "@/services/userProgressService"
import { OverviewResponse, StreakResponse } from "@/types/userProgress"

export default function ProgressPage() {
    const [overview, setOverview] = useState<OverviewResponse | null>(null)
    const [streak, setStreak] = useState<StreakResponse | null>(null)

    useEffect(() => {
        getOverview()
            .then((res) => setOverview(res.data))
            .catch((err) => console.error(err))

        getStreak()
            .then((res) => setStreak(res.data))
            .catch((err) => console.error(err))
    }, [])

    const dailyGoalPercent =
        overview?.dailyGoalWords && overview.dailyGoalWords > 0
            ? Math.min(100, Math.round((overview.itemsLearnedToday / overview.dailyGoalWords) * 100))
            : null

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 flex flex-col items-center">

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Your Progress</h1>
                    <p className="mt-1 text-muted-foreground">
                        Track your German learning journey
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Daily Words Learned"
                        value={overview?.dailyWords.learned ?? "-"}
                        subtitle={overview ? `Out of ${overview.dailyWords.total} total` : undefined}
                        icon={<BookOpen className="h-4 w-4" />}
                    />
                    <StatsCard
                        title="Lessons Completed"
                        value={overview?.grammar.learned ?? "-"}
                        subtitle={overview ? `Out of ${overview.grammar.total} total` : undefined}
                        icon={<GraduationCap className="h-4 w-4" />}
                    />
                    <StatsCard
                        title="Nomen-Verb Learned"
                        value={overview?.nomenVerb.learned ?? "-"}
                        subtitle={overview ? `Out of ${overview.nomenVerb.total} total` : undefined}
                        icon={<Link2 className="h-4 w-4" />}
                    />
                    <StatsCard
                        title="Daily Goal"
                        value={dailyGoalPercent !== null ? `${dailyGoalPercent}%` : "Not set"}
                        subtitle={
                            overview?.dailyGoalWords
                                ? `${overview.itemsLearnedToday}/${overview.dailyGoalWords} words today`
                                : undefined
                        }
                        icon={<Target className="h-4 w-4" />}
                    />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <ActivityChart />
                    <StreakCalendar currentStreak={streak?.currentStreak} />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <LessonProgress />
                    <RecentWords />
                </div>
            </main>
        </div>
    )
}
