"use client"

import { Check } from "lucide-react"
import { ProgressIcon, StreakIcon } from "@/componenets/brand/icons"
import { useI18n } from "@/componenets/I18nProvider"
import LearningPageHero from "@/componenets/learning/LearningPageHero"
import { getLevelMeta } from "@/componenets/learning/levelMeta"
import { cn } from "@/lib/utils"
import { DashboardResponse } from "@/types/dashboard"
import { OverviewResponse } from "@/types/userProgress"

interface ProgressHeroProps {
    dashboard?: DashboardResponse
    overview?: OverviewResponse
}

const RING_RADIUS = 52
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/** Top of the progress page: title, streak/level, the week as dots, and today's goal as one big ring. */
export default function ProgressHero({ dashboard, overview }: Readonly<ProgressHeroProps>) {
    const { t } = useI18n()
    const s = t.progress.stats

    const goal = overview?.dailyGoalWords ?? null
    const percent = goal && goal > 0 && overview ? Math.min(100, Math.round((overview.itemsLearnedToday / goal) * 100)) : null
    const levelMeta = dashboard ? getLevelMeta(dashboard.user.learningLevel) : null
    const LevelIcon = levelMeta?.icon

    const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "narrow" })
    const today = new Date()

    return (
        <LearningPageHero
            icon={ProgressIcon}
            title={t.progress.title}
            subtitle={t.progress.subtitle}
            meta={
                dashboard && (
                    <>
                        {dashboard.currentStreak > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold">
                                <StreakIcon className="h-3.5 w-3.5 text-[#f2b544]" aria-hidden="true" />
                                {t.progress.dayStreak(dashboard.currentStreak)}
                            </span>
                        )}
                        {levelMeta && LevelIcon && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2b544] px-2.5 py-0.5 text-xs font-bold text-[#16324f]">
                                <LevelIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                {dashboard.user.learningLevel}
                            </span>
                        )}
                    </>
                )
            }
        >
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                {dashboard && (
                    <div role="img" aria-label={t.dashboard.week.learningDaysOf(dashboard.week.learningDays, dashboard.week.totalDays)}>
                        <div className="flex max-w-sm justify-between gap-1">
                            {dashboard.week.days.map((learned, index) => {
                                const date = new Date(today)
                                date.setDate(today.getDate() - (dashboard.week.days.length - 1 - index))
                                const isToday = index === dashboard.week.days.length - 1
                                return (
                                    <div key={date.toDateString()} className="flex flex-col items-center gap-1.5">
                                        <span className="text-xs text-[#b9c7d6]">{weekdayFormatter.format(date)}</span>
                                        <span
                                            className={cn(
                                                "flex size-8 items-center justify-center rounded-full",
                                                learned ? "bg-brand-slate text-white" : "bg-white/10",
                                                isToday && !learned && "ring-2 ring-[#f2b544]",
                                            )}
                                        >
                                            {learned && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                        <p className="mt-3 text-sm text-[#b9c7d6]">
                            {t.dashboard.week.learningDaysOf(dashboard.week.learningDays, dashboard.week.totalDays)}
                        </p>
                    </div>
                )}

                {overview && (
                    <div className="flex items-center gap-4 rounded-xl bg-white/[0.07] px-5 py-4 ring-1 ring-white/10">
                        <div className="relative size-24 shrink-0">
                            <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
                                <circle cx="60" cy="60" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                                <circle
                                    cx="60"
                                    cy="60"
                                    r={RING_RADIUS}
                                    fill="none"
                                    stroke="#f2b544"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={RING_CIRCUMFERENCE}
                                    strokeDashoffset={RING_CIRCUMFERENCE * (1 - (percent ?? 0) / 100)}
                                    className="transition-all duration-700"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                                {percent !== null ? `${percent}%` : "–"}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold">{s.dailyGoal}</p>
                            <p className="mt-0.5 text-xs text-[#b9c7d6]">
                                {goal ? s.dailyGoalSubtitle(overview.itemsLearnedToday, goal) : s.dailyGoalNotSet}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </LearningPageHero>
    )
}
