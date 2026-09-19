"use client";

import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { getDailyWords } from "@/services/dailyWordService";
import { setLearningProgress } from "@/services/grammarService";
import { createVocabulary, getVocabulary } from "@/services/vocabularyService";
import { DailyWord } from "@/types/dailyWord";
import Button from "@/componenets/Button";
import {
    DailyWordsHeader,
    DailyWordLearningCard,
    DailyWordsOverview,
    DailyWordsQuickPractice,
    DailyWordsCompletion,
    DailyWordsSkeleton,
} from "@/componenets/daily-words";

const normalize = (word: string) => word.trim().toLowerCase();

type Stage = "learning" | "practice" | "complete";

export default function DailyWordsPage() {
    const [words, setWords] = useState<DailyWord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
    const [savingId, setSavingId] = useState<string | null>(null);
    const [stage, setStage] = useState<Stage>("learning");
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        Promise.all([getDailyWords(), getVocabulary()])
            .then(([wordsRes, vocabRes]) => {
                setWords(wordsRes.data);
                setSavedWords(new Set(vocabRes.data.map((v) => normalize(v.word))));
                const allLearned = wordsRes.data.length > 0 && wordsRes.data.every((w) => w.learned);
                setStage(allLearned ? "practice" : "learning");
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [reloadKey]);

    const retry = () => {
        setLoading(true);
        setError(false);
        setReloadKey((key) => key + 1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background px-6 py-10">
                <DailyWordsSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background px-6 py-10 flex items-center justify-center">
                <div className="text-center max-w-sm">
                    <p className="text-foreground/70">We couldn&apos;t load today&apos;s words.</p>
                    <p className="text-sm text-foreground/50 mt-1">Please try again.</p>
                    <Button variant="secondary" className="mt-4 text-sm" onClick={retry}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    if (words.length === 0) {
        return (
            <div className="min-h-screen bg-background px-6 py-10 flex items-center justify-center">
                <div className="text-center max-w-sm">
                    <h1 className="text-2xl font-bold text-foreground">Daily Words</h1>
                    <p className="text-foreground/60 mt-2">No new words for today.</p>
                    <p className="text-sm text-foreground/45 mt-1">Check back tomorrow for your next 5 words.</p>
                </div>
            </div>
        );
    }

    const learnedCount = words.filter((w) => w.learned).length;
    const currentWord = words[currentIndex];

    const markLearned = (word: DailyWord) => {
        if (word.learned || markingId) return;
        setMarkingId(word.id);
        setLearningProgress({ dailyWordId: word.id, learned: true })
            .then(() => {
                const updated = words.map((w) => (w.id === word.id ? { ...w, learned: true } : w));
                setWords(updated);

                const allLearned = updated.every((w) => w.learned);
                if (allLearned) {
                    setStage("practice");
                } else {
                    const nextUnlearned = updated.findIndex((w, i) => i > currentIndex && !w.learned);
                    if (nextUnlearned !== -1) setCurrentIndex(nextUnlearned);
                    else if (currentIndex < updated.length - 1) setCurrentIndex(currentIndex + 1);
                }
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? "Failed to update progress."))
            .finally(() => setMarkingId(null));
    };

    const saveToVocabulary = (word: DailyWord) => {
        if (savingId || savedWords.has(normalize(word.word))) return;
        setSavingId(word.id);
        createVocabulary({
            word: word.word,
            article: null,
            example: word.example,
            meaning: word.meaning,
            language: "EN",
            level: null,
        })
            .then(() => {
                setSavedWords((prev) => new Set(prev).add(normalize(word.word)));
                toast.success(`"${word.word}" added to your Vocabulary!`);
            })
            .catch((err) => {
                const message: string | undefined = err?.response?.data?.message;
                if (message?.toLowerCase().includes("already exists")) {
                    setSavedWords((prev) => new Set(prev).add(normalize(word.word)));
                } else {
                    toast.error(message ?? "Failed to save word to your Vocabulary.");
                }
            })
            .finally(() => setSavingId(null));
    };

    return (
        <div className="min-h-screen bg-background px-6 py-10 text-left">
            <div className="max-w-2xl mx-auto">
                <DailyWordsHeader learnedCount={learnedCount} total={words.length} />

                {stage === "learning" && (
                    <>
                        <div className="mt-8">
                            <DailyWordLearningCard
                                word={currentWord}
                                index={currentIndex}
                                total={words.length}
                                isSaved={savedWords.has(normalize(currentWord.word))}
                                isSaving={savingId === currentWord.id}
                                isMarking={markingId === currentWord.id}
                                canGoPrevious={currentIndex > 0}
                                canGoNext={currentIndex < words.length - 1}
                                onSave={() => saveToVocabulary(currentWord)}
                                onMarkLearned={() => markLearned(currentWord)}
                                onPrevious={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                                onNext={() => setCurrentIndex((i) => Math.min(words.length - 1, i + 1))}
                            />
                        </div>
                        <DailyWordsOverview words={words} currentIndex={currentIndex} onSelect={setCurrentIndex} />
                    </>
                )}

                {stage === "practice" && (
                    <div className="mt-8">
                        <DailyWordsQuickPractice words={words} onComplete={() => setStage("complete")} />
                    </div>
                )}

                {stage === "complete" && (
                    <div className="mt-8">
                        <DailyWordsCompletion
                            total={words.length}
                            onReview={() => {
                                setCurrentIndex(0);
                                setStage("learning");
                            }}
                        />
                    </div>
                )}
            </div>
            <ToastContainer />
        </div>
    );
}
