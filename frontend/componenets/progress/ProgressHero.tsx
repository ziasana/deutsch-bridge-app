"use client"

import { Check, Flame } from "lucide-react"
import { useI18n } from "@/componenets/I18nProvider"
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
        <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,hsl(228_78%_44%),hsl(216_100%_62%))] p-6 text-white shadow-card sm:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-white/5" />

            <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                    <h1 className="text-2xl font-bold sm:text-3xl">{t.progress.title}</h1>
                    <p className="mt-1 text-white/75">{t.progress.subtitle}</p>

                    {dashboard && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {dashboard.currentStreak > 0 && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
                                    <Flame className="h-4 w-4 text-amber-300" aria-hidden="true" />
                                    {t.progress.dayStreak(dashboard.currentStreak)}
                                </span>
                            )}
                            {levelMeta && LevelIcon && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
                                    <LevelIcon className="h-4 w-4" aria-hidden="true" />
                                    {dashboard.user.learningLevel}
                                </span>
                            )}
                        </div>
                    )}

                    {dashboard && (
                        <div className="mt-6" role="img" aria-label={t.dashboard.week.learningDaysOf(dashboard.week.learningDays, dashboard.week.totalDays)}>
                            <div className="flex max-w-sm justify-between gap-1">
                                {dashboard.week.days.map((learned, index) => {
                                    const date = new Date(today)
                                    date.setDate(today.getDate() - (dashboard.week.days.length - 1 - index))
                                    const isToday = index === dashboard.week.days.length - 1
                                    return (
                                        <div key={date.toDateString()} className="flex flex-col items-center gap-1.5">
                                            <span className="text-xs text-white/65">{weekdayFormatter.format(date)}</span>
                                            <span
                                                className={cn(
                                                    "flex size-8 items-center justify-center rounded-full",
                                                    learned ? "bg-white text-primary" : "bg-white/15",
                                                    isToday && !learned && "ring-2 ring-white/70",
                                                )}
                                            >
                                                {learned && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                            <p className="mt-3 text-sm text-white/75">
                                {t.dashboard.week.learningDaysOf(dashboard.week.learningDays, dashboard.week.totalDays)}
                            </p>
                        </div>
                    )}
                </div>

                {overview && (
                    <div className="flex flex-col items-center gap-2 rounded-2xl bg-white/12 px-8 py-5 ring-1 ring-white/20 backdrop-blur-sm">
                        <div className="relative size-32">
                            <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
                                <circle cx="60" cy="60" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
                                <circle
                                    cx="60"
                                    cy="60"
                                    r={RING_RADIUS}
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={RING_CIRCUMFERENCE}
                                    strokeDashoffset={RING_CIRCUMFERENCE * (1 - (percent ?? 0) / 100)}
                                    className="transition-all duration-700"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                                {percent !== null ? `${percent}%` : "–"}
                            </span>
                        </div>
                        <p className="text-sm font-semibold">{s.dailyGoal}</p>
                        <p className="text-xs text-white/75">
                            {goal ? s.dailyGoalSubtitle(overview.itemsLearnedToday, goal) : s.dailyGoalNotSet}
                        </p>
                    </div>
                )}
            </div>
        </section>
    )
}
