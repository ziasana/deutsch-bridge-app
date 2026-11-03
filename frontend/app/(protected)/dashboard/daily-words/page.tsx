"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { getDailyWords } from "@/services/dailyWordService";
import { setLearningProgress } from "@/services/grammarService";
import { createVocabulary, getSavedVocabularyWords } from "@/services/vocabularyService";
import { DailyWord } from "@/types/dailyWord";
import DailyWordsSkeleton from "@/componenets/daily-words/DailyWordsSkeleton";
import { useI18n } from "@/componenets/I18nProvider";
import { DAILY_WORDS_ACCENT } from "@/componenets/daily-words/dailyWordsAccent";
import { levelThemeVars } from "@/componenets/learning/levelMeta";
import {
    DailyWordsHeader,
    DailyWordLearningCard,
    DailyWordsOverview,
    DailyWordsQuickPractice,
    DailyWordsCompletion,
} from "@/componenets/daily-words";

const normalize = (word: string) => word.trim().toLowerCase();

const DAILY_WORDS_KEY = ["daily-words"];

type Stage = "learning" | "practice" | "complete";

export default function DailyWordsPage() {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [localSaved, setLocalSaved] = useState<Set<string>>(new Set());
    const [savingId, setSavingId] = useState<string | null>(null);
    const [stageOverride, setStageOverride] = useState<Stage | null>(null);

    // Today's words are what the page waits for. They are kept for a short while, so coming back to the page shows them at once.
    const wordsQuery = useQuery({
        queryKey: DAILY_WORDS_KEY,
        queryFn: () => getDailyWords().then((res) => res.data),
        staleTime: 30 * 1000,
    });
    const words = useMemo(() => wordsQuery.data ?? [], [wordsQuery.data]);

    // Which words are already in the learner's vocabulary only marks the save buttons, so it loads in the background and never blocks the page.
    const vocabularyQuery = useQuery({
        queryKey: ["vocabulary", "saved-words"],
        queryFn: () => getSavedVocabularyWords().then((res) => res.data.map(normalize)),
        staleTime: 60 * 1000,
    });
    const savedWords = useMemo(() => new Set([...(vocabularyQuery.data ?? []), ...localSaved]), [vocabularyQuery.data, localSaved]);

    // Without a choice yet, the page opens on the practice once every word is learned, otherwise on the learning card.
    const allLearned = words.length > 0 && words.every((w) => w.learned);
    const stage: Stage = stageOverride ?? (allLearned ? "practice" : "learning");
    const setStage = setStageOverride;

    const loading = wordsQuery.isLoading;
    const error = wordsQuery.isError && !wordsQuery.data;

    const retry = () => {
        void wordsQuery.refetch();
    };

    const frame = (children: React.ReactNode) => (
        <div className="dashboard-atmosphere min-h-screen px-4 py-8 sm:px-6 sm:py-10" style={levelThemeVars(DAILY_WORDS_ACCENT)}>
            <div className="mx-auto max-w-3xl">{children}</div>
        </div>
    );

    if (loading) return frame(<DailyWordsSkeleton label={t.common.loading} />);

    if (error) {
        return frame(
            <div className="rounded-3xl bg-card p-10 text-center shadow-card">
                <p className="font-semibold text-foreground">{t.dailyWords.loadError}</p>
                <p className="mt-1 text-sm text-foreground/60">{t.dailyWords.loadErrorSubtitle}</p>
                <button
                    type="button"
                    onClick={retry}
                    className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                    {t.dailyWords.retry}
                </button>
            </div>,
        );
    }

    if (words.length === 0) {
        return frame(
            <div className="rounded-3xl bg-card p-10 text-center shadow-card">
                <h1 className="text-2xl font-bold text-foreground">{t.dailyWords.title}</h1>
                <p className="mt-2 text-foreground/65">{t.dailyWords.emptyTitle}</p>
                <p className="mt-1 text-sm text-foreground/50">{t.dailyWords.emptySubtitle}</p>
            </div>,
        );
    }

    const currentWord = words[currentIndex];

    const markLearned = (word: DailyWord) => {
        if (word.learned || markingId) return;
        setMarkingId(word.id);
        setLearningProgress({ dailyWordId: word.id, learned: true })
            .then(() => {
                const updated = words.map((w) => (w.id === word.id ? { ...w, learned: true } : w));
                queryClient.setQueryData(DAILY_WORDS_KEY, updated);

                const allLearned = updated.every((w) => w.learned);
                if (allLearned) {
                    setStage("practice");
                } else {
                    const nextUnlearned = updated.findIndex((w, i) => i > currentIndex && !w.learned);
                    if (nextUnlearned !== -1) setCurrentIndex(nextUnlearned);
                    else if (currentIndex < updated.length - 1) setCurrentIndex(currentIndex + 1);
                }
            })
            .catch((err) => toast.error(err?.response?.data?.message ?? t.dailyWords.progressFailedToast))
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
                setLocalSaved((prev) => new Set(prev).add(normalize(word.word)));
                toast.success(t.dailyWords.savedToast(word.word));
            })
            .catch((err) => {
                const message: string | undefined = err?.response?.data?.message;
                if (message?.toLowerCase().includes("already exists")) {
                    setLocalSaved((prev) => new Set(prev).add(normalize(word.word)));
                } else {
                    toast.error(message ?? t.dailyWords.saveFailedToast);
                }
            })
            .finally(() => setSavingId(null));
    };

    return frame(
        <div className="space-y-6">
            <DailyWordsHeader
                words={words}
                currentIndex={stage === "learning" ? currentIndex : -1}
                onSelect={
                    stage === "learning"
                        ? setCurrentIndex
                        : (i) => {
                              setCurrentIndex(i);
                              setStage("learning");
                          }
                }
            />

            {stage === "learning" && (
                <>
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
                    <DailyWordsOverview words={words} currentIndex={currentIndex} onSelect={setCurrentIndex} />
                </>
            )}

            {stage === "practice" && <DailyWordsQuickPractice words={words} onComplete={() => setStage("complete")} />}

            {stage === "complete" && (
                <DailyWordsCompletion
                    total={words.length}
                    onReview={() => {
                        setCurrentIndex(0);
                        setStage("learning");
                    }}
                />
            )}
        </div>,
    );
}
