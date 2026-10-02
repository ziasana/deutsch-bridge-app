"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import { ACTIVITY_CONFIG } from "@/componenets/learning/activityConfig";
import { cn } from "@/lib/utils";
import { PlanActivityDto, TodaysPlanDto } from "@/types/dashboard";

interface TodaysLearningPlanProps {
    data: TodaysPlanDto;
}

/** Today's plan as a path of steps: finished ones are ticked, the recommended next one glows. */
export default function TodaysLearningPlan({ data }: Readonly<TodaysLearningPlanProps>) {
    const { t } = useI18n();
    const p = t.dashboard.todaysPlan;

    const labelByType: Record<PlanActivityDto["type"], string> = {
        DAILY_WORDS: p.dailyWords,
        VOCAB_REVIEW: p.vocabReview,
        GRAMMAR: p.grammar,
        READING: p.reading,
    };

    const nextActivity = data.activities.find((a) => !a.completed);
    const percent = data.total > 0 ? (data.completed / data.total) * 100 : 0;

    return (
        <section aria-label={p.title}>
            <div className="flex items-end justify-between gap-4">
                <h2 className="text-xl font-semibold text-foreground">{p.title}</h2>
                <span className="text-sm font-medium text-foreground/60">{p.completedOf(data.completed, data.total)}</span>
            </div>

            <div
                role="progressbar"
                aria-valuenow={Math.round(percent)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
            >
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>

            <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                {data.activities.map((activity) => {
                    const isNext = activity === nextActivity;
                    const { icon: Icon, iconClass, bgClass } = ACTIVITY_CONFIG[activity.type];
                    return (
                        <li key={activity.type}>
                            <Link
                                href={activity.route}
                                className={cn(
                                    "group flex h-full flex-col items-center gap-3 rounded-2xl px-3 py-5 text-center transition duration-200",
                                    "hover:-translate-y-1 hover:bg-card hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    isNext ? "bg-card shadow-card ring-2 ring-primary/40" : "bg-foreground/[0.03]",
                                )}
                            >
                                <span
                                    className={cn(
                                        "relative flex size-14 items-center justify-center rounded-full transition-transform group-hover:scale-110",
                                        activity.completed ? "bg-primary" : bgClass,
                                    )}
                                >
                                    {activity.completed ? (
                                        <Check className="size-6 text-primary-foreground" strokeWidth={3} aria-hidden="true" />
                                    ) : (
                                        <Icon className={cn("size-6", iconClass)} aria-hidden="true" />
                                    )}
                                </span>
                                <span className="min-w-0">
                                    <span
                                        className={cn(
                                            "block text-sm font-semibold",
                                            activity.completed ? "text-foreground/45 line-through" : "text-foreground",
                                        )}
                                    >
                                        {labelByType[activity.type]}
                                    </span>
                                    {isNext && <span className="mt-0.5 block text-xs font-medium text-primary">{p.recommendedNext}</span>}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
