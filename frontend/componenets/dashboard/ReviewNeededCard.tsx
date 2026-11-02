"use client";

import { PartyPopper, RefreshCw } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import { ReviewNeededDto } from "@/types/dashboard";
import DashboardTile from "./DashboardTile";

interface ReviewNeededCardProps {
    data: ReviewNeededDto;
}

export default function ReviewNeededCard({ data }: Readonly<ReviewNeededCardProps>) {
    const { t } = useI18n();
    const r = t.dashboard.review;
    const total = data.wordsDue + data.expressionsDue;

    if (total === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl bg-brand-slate/10 p-5 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-brand-slate/15">
                    <PartyPopper className="size-6 text-brand-slate" aria-hidden="true" />
                </span>
                <h2 className="text-base font-semibold text-foreground">{r.allCaughtUpTitle}</h2>
                <p className="text-sm text-foreground/60">{r.allCaughtUpSubtitle}</p>
            </div>
        );
    }

    return (
        <DashboardTile
            href={data.wordsDue > 0 ? "/dashboard/vocabulary/practice" : "/dashboard/expressions"}
            icon={RefreshCw}
            title={r.title}
            cta={r.cta}
            tone={{
                surface: "",
                icon: "text-learning-review",
                iconBg: "bg-learning-review/15",
            }}
        >
            <p className="text-5xl font-bold leading-none text-foreground">{total}</p>
            <div className="mt-3 space-y-0.5 text-sm text-foreground/70">
                {data.wordsDue > 0 && <p>{r.wordsReady(data.wordsDue)}</p>}
                {data.expressionsDue > 0 && <p>{r.expressionsReady(data.expressionsDue)}</p>}
            </div>
        </DashboardTile>
    );
}
