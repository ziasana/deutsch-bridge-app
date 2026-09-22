"use client"

import { useQuery } from "@tanstack/react-query"
import { Award, BookOpen, Flame, GraduationCap, Link2, Newspaper, Target } from "lucide-react"
import { StatsCard } from "@/componenets/stats-card"
import { useI18n } from "@/componenets/I18nProvider"
import WeeklyLearningSummary from "@/componenets/dashboard/WeeklyLearningSummary"
import { MasteryBreakdownCard } from "@/componenets/progress/MasteryBreakdownCard"
import { GrammarMasteryCard } from "@/componenets/progress/GrammarMasteryCard"
import { ReadingProgressCard } from "@/componenets/progress/ReadingProgressCard"
import { ExamPerformanceCard } from "@/componenets/progress/ExamPerformanceCard"
import { MilestoneLadder } from "@/componenets/progress/MilestoneLadder"
import { getLevelMeta } from "@/componenets/learning/levelMeta"
import { getOverview, getProgressStats } from "@/services/userProgressService"
import { getDashboard } from "@/services/dashboardService"

// Cached for a minute so switching between Dashboard and Your Progress (or
// revisiting this page) reuses the last fetch instead of re-hitting the API -
// practice results are the only thing that change these numbers, and a short
// staleTime keeps them close to real-time without refetching on every visit.
const PROGRESS_STALE_TIME_MS = 60 * 1000

export default function ProgressPage() {
    const { t } = useI18n()
    const { data: overview } = useQuery({
        queryKey: ["learning-progress", "overview"],
        queryFn: () => getOverview().then((res) => res.data),
        staleTime: PROGRESS_STALE_TIME_MS,
    })

    const { data: dashboard } = useQuery({
        queryKey: ["dashboard"],
        queryFn: () => getDashboard().then((res) => res.data),
        staleTime: PROGRESS_STALE_TIME_MS,
    })

    const { data: stats } = useQuery({
        queryKey: ["learning-progress", "stats"],
        queryFn: () => getProgressStats().then((res) => res.data),
        staleTime: PROGRESS_STALE_TIME_MS,
    })

    const dailyGoalPercent =
        overview?.dailyGoalWords && overview.dailyGoalWords > 0
            ? Math.min(100, Math.round((overview.itemsLearnedToday / overview.dailyGoalWords) * 100))
            : null

    const levelMeta = dashboard ? getLevelMeta(dashboard.user.learningLevel) : null
    const LevelIcon = levelMeta?.icon

    return (
        <div className="p-6 flex flex-col items-center">
            <main className="mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">{t.progress.title}</h1>
                    <p className="mt-1 text-muted-foreground">
                        {t.progress.subtitle}
                    </p>

                    {dashboard && (
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            {dashboard.currentStreak > 0 && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
                                    <Flame className="h-4 w-4 text-orange-500" />
                                    {t.progress.dayStreak(dashboard.currentStreak)}
                                </span>
                            )}
                            {levelMeta && LevelIcon && (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
                                    style={{ backgroundColor: `${levelMeta.color}1a`, color: levelMeta.color }}
                                >
                                    <LevelIcon className="h-4 w-4" />
                                    {dashboard.user.learningLevel}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <StatsCard
                        title={t.progress.stats.wordsMastered}
                        value={overview?.totalLearned ?? "-"}
                        subtitle={overview ? t.progress.stats.outOfTotal(overview.totalAvailable) : undefined}
                        icon={<Award className="h-4 w-4" />}
                    />
                    <StatsCard
                        title={t.progress.stats.dailyWordsLearned}
                        value={overview?.dailyWords.learned ?? "-"}
                        subtitle={overview ? t.progress.stats.outOfTotal(overview.dailyWords.total) : undefined}
                        icon={<BookOpen className="h-4 w-4" />}
                    />
                    <StatsCard
                        title={t.progress.stats.lessonsCompleted}
                        value={overview?.grammar.learned ?? "-"}
                        subtitle={overview ? t.progress.stats.outOfTotal(overview.grammar.total) : undefined}
                        icon={<GraduationCap className="h-4 w-4" />}
                    />
                    <StatsCard
                        title={t.progress.stats.activeExpressions}
                        value={overview?.expressions.learned ?? "-"}
                        subtitle={overview ? t.progress.stats.outOfTotal(overview.expressions.total) : undefined}
                        icon={<Link2 className="h-4 w-4" />}
                    />
                    <StatsCard
                        title={t.progress.stats.readingCompleted}
                        value={overview?.reading.learned ?? "-"}
                        subtitle={overview ? t.progress.stats.outOfTotal(overview.reading.total) : undefined}
                        icon={<Newspaper className="h-4 w-4" />}
                    />
                    <StatsCard
                        title={t.progress.stats.dailyGoal}
                        value={dailyGoalPercent !== null ? `${dailyGoalPercent}%` : t.progress.stats.dailyGoalNotSet}
                        subtitle={
                            overview?.dailyGoalWords
                                ? t.progress.stats.dailyGoalSubtitle(overview.itemsLearnedToday, overview.dailyGoalWords)
                                : undefined
                        }
                        icon={<Target className="h-4 w-4" />}
                    />
                </div>

                {(dashboard || stats) && (
                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        {dashboard && <WeeklyLearningSummary data={dashboard.week} />}
                        {stats && <ExamPerformanceCard data={stats.examPerformance} />}
                    </div>
                )}

                {stats && (
                    <>
                        <div className="mt-6 grid gap-6 lg:grid-cols-2">
                            <MasteryBreakdownCard
                                title={t.progress.vocabularyMastery}
                                icon={BookOpen}
                                total={stats.vocabulary.total}
                                emptyMessage={t.progress.vocabularyEmpty}
                                ctaLabel={t.progress.practiceVocabulary}
                                ctaHref="/dashboard/vocabulary/practice"
                                segments={[
                                    { key: "new", label: t.progress.segments.new, count: stats.vocabulary.newCount, colorClass: "bg-foreground/20" },
                                    { key: "learning", label: t.progress.segments.learning, count: stats.vocabulary.learning, colorClass: "bg-chart-1" },
                                    { key: "familiar", label: t.progress.segments.familiar, count: stats.vocabulary.familiar, colorClass: "bg-chart-4" },
                                    { key: "mastered", label: t.progress.segments.mastered, count: stats.vocabulary.mastered, colorClass: "bg-chart-3" },
                                ]}
                            />
                            <MasteryBreakdownCard
                                title={t.progress.expressionMastery}
                                icon={Link2}
                                total={stats.expressions.total}
                                emptyMessage={t.progress.expressionsEmpty}
                                ctaLabel={t.progress.practiceExpressions}
                                ctaHref="/dashboard/expressions/practice"
                                segments={[
                                    { key: "new", label: t.progress.segments.new, count: stats.expressions.newCount, colorClass: "bg-foreground/20" },
                                    { key: "learning", label: t.progress.segments.learning, count: stats.expressions.learning, colorClass: "bg-chart-1" },
                                    { key: "familiar", label: t.progress.segments.familiar, count: stats.expressions.familiar, colorClass: "bg-chart-4" },
                                    { key: "active", label: t.progress.segments.active, count: stats.expressions.active, colorClass: "bg-chart-2" },
                                    { key: "mastered", label: t.progress.segments.mastered, count: stats.expressions.mastered, colorClass: "bg-chart-3" },
                                ]}
                            />
                        </div>

                        <div className="mt-6 grid gap-6 lg:grid-cols-2">
                            <GrammarMasteryCard data={stats.grammar} />
                            <ReadingProgressCard data={stats.reading} />
                        </div>

                        <div className="mt-6">
                            <MilestoneLadder data={stats.milestones} />
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}
