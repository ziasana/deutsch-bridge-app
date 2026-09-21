"use client";

import Link from "next/link";
import { PartyPopper, RefreshCw } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import { Card } from "@/componenets/ui/card";
import { Button } from "@/componenets/ui/button";
import { ReviewNeededDto } from "@/types/dashboard";

interface ReviewNeededCardProps {
    data: ReviewNeededDto;
}

export default function ReviewNeededCard({ data }: ReviewNeededCardProps) {
    const { t } = useI18n();
    const r = t.dashboard.review;
    const hasReview = data.wordsDue > 0 || data.expressionsDue > 0;

    if (!hasReview) {
        return (
            <Card className="p-6 h-full flex flex-col items-center justify-center text-center gap-2">
                <PartyPopper className="h-6 w-6 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">{r.allCaughtUpTitle}</h2>
                <p className="text-foreground/60 text-sm">{r.allCaughtUpSubtitle}</p>
            </Card>
        );
    }

    return (
        <Card className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">{r.title}</h2>
            </div>

            <div className="mt-3 space-y-1 flex-1">
                {data.wordsDue > 0 && <p className="text-sm text-foreground/80">{r.wordsReady(data.wordsDue)}</p>}
                {data.expressionsDue > 0 && (
                    <p className="text-sm text-foreground/80">{r.expressionsReady(data.expressionsDue)}</p>
                )}
            </div>

            <Button asChild className="mt-4 w-full">
                <Link href={data.wordsDue > 0 ? "/dashboard/vocabulary/practice" : "/dashboard/expressions"}>
                    {r.cta}
                </Link>
            </Button>
        </Card>
    );
}
