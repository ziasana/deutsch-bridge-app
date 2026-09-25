"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import { Card } from "@/componenets/ui/card";
import { Button } from "@/componenets/ui/button";
import LearningProgressBar from "@/componenets/learning/LearningProgressBar";
import ActivityIcon from "@/componenets/learning/ActivityIcon";
import { ActivityType } from "@/componenets/learning/activityConfig";
import { ContinueLearningDto } from "@/types/dashboard";

interface ContinueLearningCardProps {
    data: ContinueLearningDto;
}

export default function ContinueLearningCard({ data }: ContinueLearningCardProps) {
    const { t } = useI18n();
    const c = t.dashboard.continueLearning;

    if (data.type === "START") {
        return (
            <Card className="p-6 sm:p-8">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="rounded-full bg-accent p-4">
                        <GraduationCap className="h-8 w-8 text-accent-foreground" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">{c.startTitle}</h2>
                        <p className="text-foreground/60 mt-1">{c.startDescription}</p>
                    </div>
                    <Button asChild size="lg">
                        <Link href={data.route}>{c.startCta}</Link>
                    </Button>
                </div>
            </Card>
        );
    }

    const titleByType: Record<string, string> = {
        DAILY_WORDS: c.dailyWordsTitle,
        VOCAB_REVIEW: c.vocabReviewTitle,
        GRAMMAR: data.title ?? c.grammarTitle,
        READING: data.title ?? c.readingTitle,
        EXPRESSIONS: c.expressionsTitle,
        EXAM: data.title ?? c.examTitle,
    };

    const descriptionByType: Record<string, string> = {
        DAILY_WORDS: c.dailyWordsDescription,
        VOCAB_REVIEW: c.vocabReviewDescription(data.total),
        GRAMMAR: c.grammarDescription,
        READING: c.readingDescription,
        EXPRESSIONS: c.expressionsDescription,
        EXAM: c.examDescription,
    };

    const showProgress = data.progressPercent !== null;

    return (
        <Card className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{c.label}</p>

            <div className="mt-3 flex items-start gap-4">
                <ActivityIcon type={data.type as ActivityType} size="lg" />
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-foreground sm:text-xl">{titleByType[data.type]}</h2>
                    <p className="text-foreground/60 mt-1 text-sm sm:text-base">{descriptionByType[data.type]}</p>
                </div>
            </div>

            {showProgress && (
                <div className="mt-5">
                    <LearningProgressBar value={data.progressPercent ?? 0} />
                    <p className="mt-2 text-sm text-foreground/60">{c.progressOf(data.completed, data.total)}</p>
                </div>
            )}

            <Button asChild className="mt-5 w-full sm:w-auto">
                <Link href={data.route}>
                    {c.cta}
                    <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
            </Button>
        </Card>
    );
}
