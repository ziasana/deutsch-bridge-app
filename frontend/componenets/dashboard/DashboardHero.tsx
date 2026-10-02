"use client";

import Link from "next/link";
import { ArrowRight, Check, Flame } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import ActivityIcon from "@/componenets/learning/ActivityIcon";
import { ActivityType } from "@/componenets/learning/activityConfig";
import { cn } from "@/lib/utils";
import { ContinueLearningDto, WeekSummaryDto } from "@/types/dashboard";

interface DashboardHeroProps {
    displayName: string;
    level: string;
    streak: number;
    week: WeekSummaryDto;
    next: ContinueLearningDto;
}

/**
 * The first thing a learner sees: a greeting, the week as a row of dots, and one big "continue" action.
 * It is a single colored surface rather than several cards, so the page opens with a clear focal point.
 */
export default function DashboardHero({ displayName, level, streak, week, next }: Readonly<DashboardHeroProps>) {
    const { t } = useI18n();
    const g = t.dashboard.greeting;
    const c = t.dashboard.continueLearning;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? g.morning(displayName) : hour < 18 ? g.afternoon(displayName) : g.evening(displayName);

    const levelMeta = getLevelMeta(level);
    const LevelIcon = levelMeta.icon;

    const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "narrow" });
    const today = new Date();

    const titleByType: Record<string, string> = {
        DAILY_WORDS: c.dailyWordsTitle,
        VOCAB_REVIEW: c.vocabReviewTitle,
        GRAMMAR: next.title ?? c.grammarTitle,
        READING: next.title ?? c.readingTitle,
        EXPRESSIONS: c.expressionsTitle,
        EXAM: next.title ?? c.examTitle,
    };
    const descriptionByType: Record<string, string> = {
        DAILY_WORDS: c.dailyWordsDescription,
        VOCAB_REVIEW: c.vocabReviewDescription(next.total),
        GRAMMAR: c.grammarDescription,
        READING: c.readingDescription,
        EXPRESSIONS: c.expressionsDescription,
        EXAM: c.examDescription,
    };

    const isStart = next.type === "START";
    const progress = next.progressPercent;

    return (
        <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,hsl(228_78%_44%),hsl(216_100%_62%))] p-6 text-white shadow-card sm:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-white/5" />

            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
                <div>
                    <h1 className="text-2xl font-bold sm:text-3xl">{greeting}</h1>
                    <p className="mt-1 text-white/75">{g.subtitle}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {streak > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
                                <Flame className="h-4 w-4 text-amber-300" aria-hidden="true" />
                                {g.streakDays(streak)}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
                            <LevelIcon className="h-4 w-4" aria-hidden="true" />
                            {level}
                        </span>
                    </div>

                    <div className="mt-6" role="img" aria-label={t.dashboard.week.learningDaysOf(week.learningDays, week.totalDays)}>
                        <div className="flex max-w-sm justify-between gap-1">
                            {week.days.map((learned, index) => {
                                const date = new Date(today);
                                date.setDate(today.getDate() - (week.days.length - 1 - index));
                                const isToday = index === week.days.length - 1;
                                return (
                                    <div key={date.toDateString()} className="flex flex-col items-center gap-1.5">
                                        <span className="text-xs text-white/65">{weekdayFormatter.format(date)}</span>
                                        <span
                                            className={cn(
                                                "flex size-8 items-center justify-center rounded-full transition",
                                                learned ? "bg-white text-primary" : "bg-white/15",
                                                isToday && !learned && "ring-2 ring-white/70",
                                            )}
                                        >
                                            {learned && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-3 text-sm text-white/75">{t.dashboard.week.learningDaysOf(week.learningDays, week.totalDays)}</p>
                    </div>
                </div>

                <Link
                    href={next.route}
                    className="group block rounded-2xl bg-white/12 p-5 ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/18 hover:ring-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{isStart ? c.startTitle : c.label}</p>
                    <div className="mt-3 flex items-start gap-4">
                        {!isStart && <ActivityIcon type={next.type as ActivityType} size="lg" className="bg-white" />}
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-semibold sm:text-xl">{isStart ? c.startDescription : titleByType[next.type]}</h2>
                            {!isStart && <p className="mt-1 text-sm text-white/75">{descriptionByType[next.type]}</p>}
                        </div>
                    </div>

                    {progress !== null && (
                        <div className="mt-4">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                                <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
                            </div>
                            <p className="mt-2 text-xs text-white/75">{c.progressOf(next.completed, next.total)}</p>
                        </div>
                    )}

                    <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-sm transition group-hover:gap-3">
                        {isStart ? c.startCta : c.cta}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                </Link>
            </div>
        </section>
    );
}
