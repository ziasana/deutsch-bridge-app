"use client"

import { useQuery } from "@tanstack/react-query"
import { Award, BookOpen, GraduationCap, Link2, Newspaper, SpellCheck } from "lucide-react"
import { useI18n } from "@/componenets/I18nProvider"
import Loading from "@/componenets/Loading"
import ProgressHero from "@/componenets/progress/ProgressHero"
import { ProgressStatTile } from "@/componenets/progress/ProgressStatTile"
import { MasteryBreakdownCard } from "@/componenets/progress/MasteryBreakdownCard"
import { GrammarMasteryCard } from "@/componenets/progress/GrammarMasteryCard"
import { ReadingProgressCard } from "@/componenets/progress/ReadingProgressCard"
import { ExamPerformanceCard } from "@/componenets/progress/ExamPerformanceCard"
import { MilestoneLadder } from "@/componenets/progress/MilestoneLadder"
import { getOverview, getProgressStats } from "@/services/userProgressService"
import { getDashboard } from "@/services/dashboardService"

// Cached for a minute so switching between Dashboard and Your Progress (or
// revisiting this page) reuses the last fetch instead of re-hitting the API -
// practice results are the only thing that change these numbers, and a short
// staleTime keeps them close to real-time without refetching on every visit.
const PROGRESS_STALE_TIME_MS = 60 * 1000

export default function ProgressPage() {
    const { t } = useI18n()
    const { data: overview, isLoading: overviewLoading } = useQuery({
        queryKey: ["learning-progress", "overview"],
        queryFn: () => getOverview().then((res) => res.data),
        staleTime: PROGRESS_STALE_TIME_MS,
    })

    const { data: dashboard, isLoading: dashboardLoading } = useQuery({
        queryKey: ["dashboard"],
        queryFn: () => getDashboard().then((res) => res.data),
        staleTime: PROGRESS_STALE_TIME_MS,
    })

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["learning-progress", "stats"],
        queryFn: () => getProgressStats().then((res) => res.data),
        staleTime: PROGRESS_STALE_TIME_MS,
    })

    if (overviewLoading || dashboardLoading || statsLoading) return <Loading />

    const s = t.progress.stats
    const tiles = overview
        ? [
              { title: s.wordsMastered, learned: overview.totalLearned, total: overview.totalAvailable, icon: <Award className="size-4" />, tone: { surface: "from-motivation/15 to-motivation/5", icon: "text-motivation", iconBg: "bg-motivation/15", bar: "bg-motivation" } },
              { title: s.dailyWordsLearned, learned: overview.dailyWords.learned, total: overview.dailyWords.total, icon: <SpellCheck className="size-4" />, tone: { surface: "from-learning-vocabulary/15 to-learning-vocabulary/5", icon: "text-learning-vocabulary", iconBg: "bg-learning-vocabulary/15", bar: "bg-learning-vocabulary" } },
              { title: s.lessonsCompleted, learned: overview.grammar.learned, total: overview.grammar.total, icon: <GraduationCap className="size-4" />, tone: { surface: "from-learning-grammar/15 to-learning-grammar/5", icon: "text-learning-grammar", iconBg: "bg-learning-grammar/15", bar: "bg-learning-grammar" } },
              { title: s.activeExpressions, learned: overview.expressions.learned, total: overview.expressions.total, icon: <Link2 className="size-4" />, tone: { surface: "from-learning-expression/15 to-learning-expression/5", icon: "text-learning-expression", iconBg: "bg-learning-expression/15", bar: "bg-learning-expression" } },
              { title: s.readingCompleted, learned: overview.reading.learned, total: overview.reading.total, icon: <Newspaper className="size-4" />, tone: { surface: "from-learning-reading/15 to-learning-reading/5", icon: "text-learning-reading", iconBg: "bg-learning-reading/15", bar: "bg-learning-reading" } },
          ]
        : []

    return (
        <div className="dashboard-atmosphere min-h-full px-4 py-8 sm:px-6 sm:py-10">
            <main className="mx-auto max-w-5xl space-y-8">
                <ProgressHero dashboard={dashboard} overview={overview} />

                {tiles.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {tiles.map((tile) => (
                            <ProgressStatTile key={tile.title} {...tile} subtitle={s.outOfTotal(tile.total)} />
                        ))}
                    </div>
                )}

                {stats && (
                    <>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <MasteryBreakdownCard
                                title={t.progress.vocabularyMastery}
                                icon={BookOpen}
                                total={stats.vocabulary.total}
                                emptyMessage={t.progress.vocabularyEmpty}
                                ctaLabel={t.progress.practiceVocabulary}
                                ctaHref="/dashboard/vocabulary/practice"
                                segments={[
                                    { key: "new", label: t.progress.segments.new, count: stats.vocabulary.newCount, color: "color-mix(in srgb, var(--foreground) 25%, transparent)" },
                                    { key: "learning", label: t.progress.segments.learning, count: stats.vocabulary.learning, color: "var(--chart-1)" },
                                    { key: "familiar", label: t.progress.segments.familiar, count: stats.vocabulary.familiar, color: "var(--chart-4)" },
                                    { key: "mastered", label: t.progress.segments.mastered, count: stats.vocabulary.mastered, color: "var(--chart-3)" },
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
                                    { key: "new", label: t.progress.segments.new, count: stats.expressions.newCount, color: "color-mix(in srgb, var(--foreground) 25%, transparent)" },
                                    { key: "learning", label: t.progress.segments.learning, count: stats.expressions.learning, color: "var(--chart-1)" },
                                    { key: "familiar", label: t.progress.segments.familiar, count: stats.expressions.familiar, color: "var(--chart-4)" },
                                    { key: "active", label: t.progress.segments.active, count: stats.expressions.active, color: "var(--chart-2)" },
                                    { key: "mastered", label: t.progress.segments.mastered, count: stats.expressions.mastered, color: "var(--chart-3)" },
                                ]}
                            />
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <GrammarMasteryCard data={stats.grammar} />
                            <ReadingProgressCard data={stats.reading} />
                            <ExamPerformanceCard data={stats.examPerformance} />
                        </div>

                        <MilestoneLadder data={stats.milestones} />
                    </>
                )}
            </main>
        </div>
    )
}
