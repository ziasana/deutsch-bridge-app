"use client";

import Link from "next/link";
import { useI18n } from "@/componenets/I18nProvider";
import { Card } from "@/componenets/ui/card";
import { cn } from "@/lib/utils";
import { WeekSummaryDto } from "@/types/dashboard";

interface WeeklyLearningSummaryProps {
    data: WeekSummaryDto;
}

const DAY_LABELS = ["dayMinus6", "dayMinus5", "dayMinus4", "dayMinus3", "dayMinus2", "dayMinus1", "today"];

export default function WeeklyLearningSummary({ data }: WeeklyLearningSummaryProps) {
    const { t } = useI18n();
    const w = t.dashboard.week;

    const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "narrow" });
    const today = new Date();

    return (
        <Card className="p-6 h-full flex flex-col">
            <h2 className="text-lg font-semibold text-foreground">{w.title}</h2>

            {data.learningDays === 0 ? (
                <div className="mt-3 flex-1">
                    <p className="font-medium text-foreground">{w.emptyTitle}</p>
                    <p className="text-sm text-foreground/60 mt-1">{w.emptySubtitle}</p>
                </div>
            ) : (
                <div className="mt-4 flex-1">
                    <div className="flex justify-between gap-1">
                        {data.days.map((learned, index) => {
                            const date = new Date(today);
                            date.setDate(today.getDate() - (data.days.length - 1 - index));
                            return (
                                <div key={DAY_LABELS[index] ?? index} className="flex flex-col items-center gap-1.5">
                                    <span className="text-xs text-foreground/50">{weekdayFormatter.format(date)}</span>
                                    <span
                                        className={cn(
                                            "h-3 w-3 rounded-full",
                                            learned ? "bg-primary" : "bg-foreground/15"
                                        )}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <p className="mt-4 text-sm text-foreground/70">
                        {w.learningDaysOf(data.learningDays, data.totalDays)}
                    </p>
                </div>
            )}

            <Link href="/user-progress" className="mt-4 text-sm font-medium text-primary hover:underline">
                {w.viewProgress}
            </Link>
        </Card>
    );
}
