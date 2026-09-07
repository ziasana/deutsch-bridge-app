"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import { getReviewQueue, reviewWord } from "@/services/lexiconService";
import ActionButtons from "@/componenets/ActionButtons";
import Loading from "@/componenets/Loading";
import { Badge } from "@/componenets/ui/badge";
import { UserWordProgress } from "@/types/reading";

const TYPE_LABELS: Record<UserWordProgress["type"], string> = {
    WORD: "Word",
    NOMEN_VERB_VERBINDUNG: "Nomen-Verb-Verbindung",
    REDEWENDUNG: "Redewendung",
};

export default function ReadingReviewPage() {
    const [queue, setQueue] = useState<UserWordProgress[]>([]);
    const [index, setIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [correctCount, setCorrectCount] = useState(0);
    const [finished, setFinished] = useState(false);

    const loadQueue = () => {
        setLoading(true);
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
        loadQueue();
    };

    if (loading) return <Loading />;

    if (queue.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
                <div className="flex flex-col items-center rounded-2xl bg-white dark:bg-gray-800 px-10 py-8 shadow-lg text-center max-w-sm">
                    <span className="text-5xl">🎉</span>
                    <h1 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
                        Nothing due for review
                    </h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        Words you save while reading show up here once they&apos;re due for review.
                    </p>
                    <Link
                        href="/dashboard/reading"
                        className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 active:scale-95"
                    >
                        Go to Reading
                    </Link>
                </div>
                <ToastContainer />
            </div>
        );
    }

    if (finished || !current) {
        const successRate = Math.round((correctCount * 100) / queue.length);
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
                <div className="flex flex-col items-center rounded-2xl bg-white dark:bg-gray-800 px-10 py-8 shadow-lg text-center">
                    <span className="text-5xl">✅</span>
                    <h1 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
                        Review session finished
                    </h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                        {correctCount} of {queue.length} correct ({successRate}%)
                    </p>
                    <div className="mt-6 flex gap-3">
                        <Link
                            href="/dashboard/reading"
                            className="rounded-xl border border-gray-300 dark:border-gray-600 px-6 py-2.5 font-semibold text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Back to Reading
                        </Link>
                        <button
                            onClick={startOver}
                            className="rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 active:scale-95"
                        >
                            Check again
                        </button>
                    </div>
                </div>
                <ToastContainer />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Card {index + 1} of {queue.length}
            </p>

            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary">{TYPE_LABELS[current.type]}</Badge>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        Status: {current.status}
                    </span>
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                    {current.lemma}
                </h2>

                {showAnswer ? (
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                        {current.translation && (
                            <p className="text-gray-800 dark:text-gray-100">
                                <strong>Meaning:</strong> {current.translation}
                            </p>
                        )}
                        {current.firstSeenSentence && (
                            <p className="italic text-gray-600 dark:text-gray-300">
                                &quot;{current.firstSeenSentence}&quot;
                            </p>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAnswer(true)}
                        className="mt-6 w-full rounded-xl bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
                    >
                        Show meaning
                    </button>
                )}
            </div>

            {showAnswer && (
                <div className="w-full max-w-md">
                    <ActionButtons onKnow={() => submitReview(true)} onDontKnow={() => submitReview(false)} />
                </div>
            )}
            <ToastContainer />
        </div>
    );
}
