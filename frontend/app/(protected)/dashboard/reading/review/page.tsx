"use client";

import { useEffect, useState } from "react";
import { Brain, Check, X } from "lucide-react";
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
    const [wrongCount, setWrongCount] = useState(0);
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
                else setWrongCount((c) => c + 1);
                advance();
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to save your review."));
    };

    const startOver = () => {
        setIndex(0);
        setCorrectCount(0);
        setWrongCount(0);
        setFinished(false);
        setShowAnswer(false);
        setLoading(true);
        loadQueue();
    };

    // Space flips the card; once flipped, ← / 1 = "don't know" and → / 2 = "know".
    useEffect(() => {
        if (!current) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName)) return;
            if (e.key === " ") {
                e.preventDefault();
                setShowAnswer((v) => !v);
            } else if (showAnswer && (e.key === "ArrowLeft" || e.key === "1")) submitReview(false);
            else if (showAnswer && (e.key === "ArrowRight" || e.key === "2")) submitReview(true);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, showAnswer]);

    if (loading) return <Loading />;

    if (queue.length === 0) {
        return (
            <PracticeShell>
                <div className="anim-fade-up relative overflow-hidden rounded-3xl bg-card p-10 text-center shadow-card ring-1 ring-primary/15">
                    <span aria-hidden="true" className="absolute -end-10 -top-12 size-44 rounded-full bg-primary/[0.07]" />
                    <span className="relative mx-auto flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-card">
                        <Brain className="size-10" aria-hidden="true" />
                    </span>
                    <h1 className="relative mt-5 text-2xl font-bold text-foreground">{t.readingReview.nothingDue} 🎉</h1>
                    <p className="relative mt-2 text-foreground/65">{t.readingReview.nothingDueSubtitle}</p>
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

            <div className="mt-5 flex items-center justify-center gap-2" aria-live="polite">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold tabular-nums text-green-700 dark:text-green-400">
                    <Check className="size-3.5" aria-hidden="true" /> {correctCount}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold tabular-nums text-red-700 dark:text-red-400">
                    <X className="size-3.5" aria-hidden="true" /> {wrongCount}
                </span>
            </div>

            <div className="relative mt-5">
                <div className="relative">
                {/* The rest of the queue, peeking out behind the card. */}
                {index + 1 < queue.length && <span aria-hidden="true" className="absolute inset-x-4 -bottom-2 top-4 rounded-3xl bg-card/70 ring-1 ring-border/50" />}
                {index + 2 < queue.length && <span aria-hidden="true" className="absolute inset-x-8 -bottom-4 top-8 rounded-3xl bg-card/40 ring-1 ring-border/40" />}
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
                </div>
                <PracticeGradeButtons
                    visible={showAnswer}
                    knowLabel={t.common.iKnow}
                    dontKnowLabel={t.common.iDontKnow}
                    onKnow={() => submitReview(true)}
                    onDontKnow={() => submitReview(false)}
                />
                <p className="mt-5 hidden items-center justify-center gap-2 text-xs text-foreground/45 sm:flex" aria-hidden="true">
                    <kbd className="rounded-md bg-card px-2 py-0.5 font-sans ring-1 ring-border/60">Space</kbd>
                    <kbd className="rounded-md bg-card px-2 py-0.5 font-sans ring-1 ring-border/60">←</kbd>
                    <kbd className="rounded-md bg-card px-2 py-0.5 font-sans ring-1 ring-border/60">→</kbd>
                </p>
            </div>
        </PracticeShell>
    );
}
