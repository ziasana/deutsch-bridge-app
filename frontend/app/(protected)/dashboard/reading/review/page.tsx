"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { getReviewQueue, reviewWord } from "@/services/lexiconService";
import PracticeShell from "@/componenets/practice/PracticeShell";
import PracticeHeader from "@/componenets/practice/PracticeHeader";
import PracticeChip from "@/componenets/practice/PracticeChip";
import PracticeFlipCard from "@/componenets/practice/PracticeFlipCard";
import PracticeGradeButtons from "@/componenets/practice/PracticeGradeButtons";
import PracticeSummary, { practicePrimaryButton, practiceSecondaryButton } from "@/componenets/practice/PracticeSummary";
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

    if (loading) return <Loading />;

    if (queue.length === 0) {
        return (
            <PracticeShell>
                <div className="anim-fade-up rounded-[10px] bg-card p-10 text-center shadow-card">
                    <h1 className="text-2xl font-bold text-foreground">{t.readingReview.nothingDue} 🎉</h1>
                    <p className="mt-2 text-foreground/65">{t.readingReview.nothingDueSubtitle}</p>
                    <Link href="/dashboard/reading" className={`${practicePrimaryButton} mt-7`}>
                        {t.readingReview.goToReading}
                    </Link>
                </div>
            </PracticeShell>
        );
    }

    if (finished || !current) {
        const successRate = Math.round((correctCount * 100) / queue.length);
        return (
            <PracticeShell>
                <PracticeSummary
                    title={t.readingReview.sessionFinished}
                    subtitle={t.readingReview.resultsSummary(correctCount, queue.length, successRate)}
                    rings={[{ value: successRate, label: t.common.iKnow }]}
                    actions={
                        <>
                            <button type="button" onClick={startOver} className={practicePrimaryButton}>
                                {t.readingReview.checkAgain}
                            </button>
                            <Link href="/dashboard/reading" className={practiceSecondaryButton}>
                                {t.readingReview.backToReading}
                            </Link>
                        </>
                    }
                />
            </PracticeShell>
        );
    }

    return (
        <PracticeShell>
            <PracticeHeader
                exitHref="/dashboard/reading"
                exitLabel={t.readingReview.backToReading}
                counter={t.readingReview.cardOf(index + 1, queue.length)}
                percent={((index + (showAnswer ? 0.5 : 0)) / queue.length) * 100}
                meta={<PracticeChip className="text-primary">{TYPE_LABELS[current.type]}</PracticeChip>}
            />

            <div className="mt-6">
                <PracticeFlipCard
                    flipped={showAnswer}
                    onToggle={() => setShowAnswer((v) => !v)}
                    ariaLabel={`${current.lemma} – ${t.readingReview.showMeaning}`}
                    frontHint={t.readingReview.showMeaning}
                    front={<h2 className="break-words text-4xl font-bold leading-tight text-foreground">{current.lemma}</h2>}
                    back={
                        <>
                            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">{current.lemma}</span>
                            {current.translation && <p className="text-2xl font-bold leading-snug">{current.translation}</p>}
                            {current.firstSeenSentence && (
                                <p className="line-clamp-4 text-sm italic text-white/85">&quot;{current.firstSeenSentence}&quot;</p>
                            )}
                        </>
                    }
                />
                <PracticeGradeButtons
                    visible={showAnswer}
                    knowLabel={t.common.iKnow}
                    dontKnowLabel={t.common.iDontKnow}
                    onKnow={() => submitReview(true)}
                    onDontKnow={() => submitReview(false)}
                />
            </div>
        </PracticeShell>
    );
}
