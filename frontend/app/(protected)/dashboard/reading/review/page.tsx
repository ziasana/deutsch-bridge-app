"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { getReviewQueue, reviewWord } from "@/services/lexiconService";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/componenets/ui/badge";
import Loading from "@/componenets/Loading";
import { UserWordProgress } from "@/types/reading";
import { useI18n } from "@/componenets/I18nProvider";

export default function ReadingReviewPage() {
    const { t } = useI18n();
    const TYPE_LABELS: Record<UserWordProgress["type"], string> = t.readingReview.typeLabels;
    const [queue, setQueue] = useState<UserWordProgress[]>([]);
    const [index, setIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [correctCount, setCorrectCount] = useState(0);
    const [finished, setFinished] = useState(false);

    const loadQueue = () => {
        getReviewQueue()
            .then((res) => setQueue(res.data))
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to load your review queue."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadQueue();
    }, []);

    const current = !finished && index < queue.length ? queue[index] : null;

    const advance = () => {
        setShowAnswer(false);
        if (index + 1 < queue.length) {
            setIndex(index + 1);
        } else {
            setFinished(true);
        }
    };

    const submitReview = (correct: boolean) => {
        if (!current) return;
        reviewWord({ lemma: current.lemma, correct })
            .then(() => {
                if (correct) setCorrectCount((c) => c + 1);
                advance();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save your review."));
    };

    const startOver = () => {
        setIndex(0);
        setCorrectCount(0);
        setFinished(false);
        setShowAnswer(false);
        setLoading(true);
        loadQueue();
    };

    const page = (children: React.ReactNode) => (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">{children}</div>
    );

    if (loading) return <Loading />;

    if (queue.length === 0) {
        return page(
            <div className="rounded-2xl border border-border/60 bg-card p-10 text-center shadow-card max-w-md">
                <h1 className="text-2xl font-bold text-foreground mb-2">{t.readingReview.nothingDue} 🎉</h1>
                <p className="text-foreground/60 mb-6">{t.readingReview.nothingDueSubtitle}</p>
                <Link
                    href="/dashboard/reading"
                    className="inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                    {t.readingReview.goToReading}
                </Link>
            </div>,
        );
    }

    if (finished || !current) {
        const successRate = Math.round((correctCount * 100) / queue.length);
        return page(
            <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-card max-w-lg w-full">
                <h1 className="text-2xl font-bold text-foreground mb-1">{t.readingReview.sessionFinished} 🎉</h1>
                <p className="text-foreground/60 mb-6">
                    {t.readingReview.resultsSummary(correctCount, queue.length, successRate)}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="rounded-xl bg-green-500/10 p-4 text-center">
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">{correctCount}</p>
                        <p className="text-xs text-foreground/55">{t.common.iKnow}</p>
                    </div>
                    <div className="rounded-xl bg-accent/50 p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{successRate}%</p>
                        <p className="text-xs text-foreground/55">{queue.length}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={startOver}
                        className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                        {t.readingReview.checkAgain}
                    </button>
                    <Link
                        href="/dashboard/reading"
                        className="flex-1 rounded-lg border border-border/60 bg-card px-4 py-2.5 text-center text-sm font-semibold text-foreground transition hover:bg-accent"
                    >
                        {t.readingReview.backToReading}
                    </Link>
                </div>
            </div>,
        );
    }

    return page(
        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-card max-w-xl w-full">
            <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-foreground/55">{t.readingReview.cardOf(index + 1, queue.length)}</span>
                <Badge variant="secondary">{TYPE_LABELS[current.type]}</Badge>
            </div>

            <div className="mb-6 flex gap-1.5" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={queue.length}>
                {queue.map((word, i) => (
                    <div
                        key={word.id}
                        className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= index ? "bg-primary" : "bg-foreground/10")}
                    />
                ))}
            </div>

            <button
                type="button"
                onClick={() => setShowAnswer((v) => !v)}
                aria-expanded={showAnswer}
                className="w-full rounded-xl border border-border/60 bg-accent/40 p-8 text-center cursor-pointer transition hover:bg-accent/60 min-h-[220px] flex flex-col items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
                <h2 className="text-3xl font-bold text-foreground break-words">{current.lemma}</h2>
                {showAnswer ? (
                    <div className="space-y-2">
                        {current.translation && <p className="text-lg font-medium text-foreground">{current.translation}</p>}
                        {current.firstSeenSentence && (
                            <p className="text-sm italic text-foreground/65">&quot;{current.firstSeenSentence}&quot;</p>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-foreground/55">{t.readingReview.showMeaning}</p>
                )}
            </button>

            {showAnswer && (
                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={() => submitReview(true)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-700 dark:text-green-400 transition hover:bg-green-500/20"
                    >
                        <Check className="size-4" aria-hidden="true" />
                        {t.common.iKnow}
                    </button>
                    <button
                        type="button"
                        onClick={() => submitReview(false)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-700 dark:text-red-400 transition hover:bg-red-500/20"
                    >
                        <X className="size-4" aria-hidden="true" />
                        {t.common.iDontKnow}
                    </button>
                </div>
            )}
        </div>,
    );
}
