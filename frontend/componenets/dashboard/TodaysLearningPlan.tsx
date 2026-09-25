"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import { Card } from "@/componenets/ui/card";
import { Button } from "@/componenets/ui/button";
import ActivityIcon from "@/componenets/learning/ActivityIcon";
import { cn } from "@/lib/utils";
import { PlanActivityDto, TodaysPlanDto } from "@/types/dashboard";

interface TodaysLearningPlanProps {
    data: TodaysPlanDto;
}

export default function TodaysLearningPlan({ data }: TodaysLearningPlanProps) {
    const { t } = useI18n();
    const p = t.dashboard.todaysPlan;

    const labelByType: Record<PlanActivityDto["type"], string> = {
        DAILY_WORDS: p.dailyWords,
        VOCAB_REVIEW: p.vocabReview,
        GRAMMAR: p.grammar,
        READING: p.reading,
    };

    const nextActivity = data.activities.find((a) => !a.completed);

    return (
        <Card className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{p.title}</h2>
                <span className="text-sm text-foreground/60">{p.completedOf(data.completed, data.total)}</span>
            </div>

            <ul className="mt-4 space-y-2 flex-1">
                {data.activities.map((activity) => {
                    const isNext = activity === nextActivity;
                    return (
                        <li key={activity.type}>
                            <Link
                                href={activity.route}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors",
                                    isNext ? "bg-accent/40" : "hover:bg-accent/50"
                                )}
                            >
                                {activity.completed ? (
                                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                                ) : isNext ? (
                                    <ActivityIcon type={activity.type} size="sm" />
                                ) : (
                                    <Circle className="h-5 w-5 shrink-0 text-foreground/30" />
                                )}
                                <span className="min-w-0 flex-1">
                                    <span
                                        className={cn(
                                            "block text-sm font-medium",
                                            activity.completed ? "text-foreground/50 line-through" : "text-foreground"
                                        )}
                                    >
                                        {labelByType[activity.type]}
                                    </span>
                                    {isNext && (
                                        <span className="block text-xs text-primary">{p.recommendedNext}</span>
                                    )}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>

            {nextActivity && (
                <Button asChild variant="outline" className="mt-4 w-full">
                    <Link href={nextActivity.route}>{t.dashboard.continueLearning.cta}</Link>
                </Button>
            )}
        </Card>
    );
}
