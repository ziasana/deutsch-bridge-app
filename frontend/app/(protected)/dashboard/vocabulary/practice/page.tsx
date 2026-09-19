"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Volume2, Check, X as XIcon } from "lucide-react";
import { getPracticeSession, submitPracticeRound } from "@/services/vocabularyPracticeService";
import { PracticeVocabularySession, PracticeVocabularyItem, VocabularyRoundResponse } from "@/types/vocabulary";
import Loading from "@/componenets/Loading";
import Button from "@/componenets/Button";
import { Badge } from "@/componenets/ui/badge";
import { playVocabularyAudio } from "@/lib/vocabularyAudio";
import { useI18n } from "@/componenets/I18nProvider";
import { cn } from "@/lib/utils";

type Step = "flashcard" | "context";

interface ItemResult {
    flashcardCorrect: boolean;
    contextCorrect: boolean | null;
}

function VocabularyPracticeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const vocabularyItemId = searchParams.get("vocabularyItemId");
    const { t } = useI18n();

    const [session, setSession] = useState<PracticeVocabularySession | null>(null);
    const [loading, setLoading] = useState(true);
    const [index, setIndex] = useState(0);
    const [step, setStep] = useState<Step>("flashcard");
    const [flipped, setFlipped] = useState(false);
    const [flashcardKnewIt, setFlashcardKnewIt] = useState<boolean | null>(null);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [roundResult, setRoundResult] = useState<VocabularyRoundResponse | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState<ItemResult[]>([]);
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        getPracticeSession(vocabularyItemId ?? undefined)
            .then((res) => setSession(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const exitTarget = vocabularyItemId
        ? `/dashboard/vocabulary/detail?id=${vocabularyItemId}`
        : "/dashboard/vocabulary";

    if (loading) return <Loading />;

    if (!session || session.items.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="rounded-2xl border border-border/60 bg-card p-10 text-center shadow-card max-w-md">
                    <h2 className="text-2xl font-bold text-foreground mb-2">{t.vocabulary.practice.noWords}</h2>
                    <p className="text-foreground/60 mb-6">{t.vocabulary.practice.noWordsSubtitle}</p>
                    <Button variant="primary" onClick={() => router.push(exitTarget)}>
                        {t.vocabulary.practice.goToVocabulary}
                    </Button>
                </div>
            </div>
        );
    }

    if (finished) {
        const total = results.length;
        const recallCorrect = results.filter((r) => r.flashcardCorrect).length;
        const contextAnswered = results.filter((r) => r.contextCorrect !== null);
        const contextCorrect = contextAnswered.filter((r) => r.contextCorrect).length;
        const recallAccuracy = total > 0 ? Math.round((recallCorrect / total) * 100) : 0;
        const contextAccuracy = contextAnswered.length > 0 ? Math.round((contextCorrect / contextAnswered.length) * 100) : 0;

        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-card max-w-lg w-full">
                    <h2 className="text-2xl font-bold text-foreground mb-1">{t.vocabulary.practice.sessionComplete} 🎉</h2>
                    <p className="text-foreground/60 mb-6">
                        {t.vocabulary.practice.wordsPracticed}: {total}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="rounded-xl bg-accent/50 p-4 text-center">
                            <p className="text-2xl font-bold text-foreground">{recallAccuracy}%</p>
                            <p className="text-xs text-foreground/55">{t.vocabulary.practice.recallAccuracy}</p>
                        </div>
                        <div className="rounded-xl bg-accent/50 p-4 text-center">
                            <p className="text-2xl font-bold text-foreground">{contextAccuracy}%</p>
                            <p className="text-xs text-foreground/55">{t.vocabulary.practice.contextAccuracy}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setFinished(false);
                                setResults([]);
                                setIndex(0);
                                setStep("flashcard");
                                setLoading(true);
                                getPracticeSession(vocabularyItemId ?? undefined)
                                    .then((res) => setSession(res.data))
                                    .catch((err) => console.error(err))
                                    .finally(() => setLoading(false));
                            }}
                            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                            {t.vocabulary.practice.practiceAgain}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push(exitTarget)}
                            className="flex-1 rounded-lg border border-border/60 bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
                        >
                            {t.vocabulary.practice.backToVocabulary}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const item: PracticeVocabularyItem = session.items[index];
    const totalSteps = item.contextQuestion ? 2 : 1;
    const currentStepNumber = step === "flashcard" ? 1 : 2;
    const wordLabel = item.article ? `${item.article} ${item.word}` : item.word;

    const resetItemState = () => {
        setFlipped(false);
        setFlashcardKnewIt(null);
        setSelectedKey(null);
        setRoundResult(null);
        setStep("flashcard");
    };

    const advanceToNextItem = () => {
        resetItemState();
        if (index + 1 >= session.items.length) {
            setFinished(true);
        } else {
            setIndex(index + 1);
        }
    };

    const gradeFlashcard = (knewIt: boolean) => {
        setFlashcardKnewIt(knewIt);
        if (item.contextQuestion) {
            setStep("context");
            return;
        }
        // No context step for this round - submit right away (flashcard-only round).
        setSubmitting(true);
        submitPracticeRound({ vocabularyItemId: item.vocabularyItemId, flashcardKnewIt: knewIt, contextSelectedKey: null })
            .then((res) => {
                setRoundResult(res.data);
                setResults((prev) => [...prev, { flashcardCorrect: res.data.flashcardCorrect, contextCorrect: null }]);
            })
            .catch((err) => console.error(err))
            .finally(() => setSubmitting(false));
    };

    const selectContextOption = (key: string) => {
        if (roundResult || flashcardKnewIt === null) return;
        setSelectedKey(key);
        setSubmitting(true);
        submitPracticeRound({ vocabularyItemId: item.vocabularyItemId, flashcardKnewIt, contextSelectedKey: key })
            .then((res) => {
                setRoundResult(res.data);
                setResults((prev) => [...prev, { flashcardCorrect: res.data.flashcardCorrect, contextCorrect: res.data.contextCorrect }]);
            })
            .catch((err) => console.error(err))
            .finally(() => setSubmitting(false));
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-card max-w-xl w-full">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-sm text-foreground/55">{t.vocabulary.practice.itemOf(index + 1, session.items.length)}</span>
                    <div className="flex items-center gap-2">
                        {item.level && <Badge variant="secondary">{item.level}</Badge>}
                        <span className="text-xs text-foreground/50">{t.vocabulary.practice.stepOf(currentStepNumber, totalSteps)}</span>
                    </div>
                </div>

                <div className="mb-6 flex gap-1.5">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1.5 flex-1 rounded-full transition-colors",
                                i < currentStepNumber ? "bg-primary" : "bg-foreground/10",
                            )}
                        />
                    ))}
                </div>

                {step === "flashcard" && (
                    <div>
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setFlipped((f) => !f)}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setFlipped((f) => !f)}
                            className="rounded-xl border border-border/60 bg-accent/40 p-8 text-center cursor-pointer transition hover:bg-accent/60 min-h-[180px] flex flex-col items-center justify-center gap-3"
                        >
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-foreground">{wordLabel}</h2>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        playVocabularyAudio(item.audioUrl, item.word);
                                    }}
                                    aria-label={t.vocabulary.card.playAudioAria}
                                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition hover:bg-accent/70"
                                >
                                    <Volume2 className="size-4" />
                                </button>
                            </div>

                            {!flipped ? (
                                <p className="text-sm text-foreground/55">{t.vocabulary.practice.flipPrompt}</p>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-lg font-medium text-foreground">{item.meaning}</p>
                                    {item.example && <p className="text-sm italic text-foreground/65">„{item.example}“</p>}
                                    {item.synonyms && <p className="text-xs text-foreground/50">{item.synonyms}</p>}
                                </div>
                            )}
                        </div>

                        {flipped && (
                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => gradeFlashcard(true)}
                                    disabled={submitting}
                                    className="flex-1 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-700 dark:text-green-400 transition hover:bg-green-500/20 disabled:opacity-60"
                                >
                                    {t.vocabulary.practice.knewIt}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => gradeFlashcard(false)}
                                    disabled={submitting}
                                    className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-700 dark:text-red-400 transition hover:bg-red-500/20 disabled:opacity-60"
                                >
                                    {t.vocabulary.practice.didntKnowIt}
                                </button>
                            </div>
                        )}

                        {roundResult && !item.contextQuestion && (
                            <div className="mt-6">
                                <div
                                    className={cn(
                                        "flex items-center gap-2 rounded-xl p-4",
                                        roundResult.flashcardCorrect
                                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                            : "bg-red-500/10 text-red-700 dark:text-red-400",
                                    )}
                                >
                                    {roundResult.flashcardCorrect ? <Check className="size-4" /> : <XIcon className="size-4" />}
                                    <span className="text-sm font-medium">
                                        {roundResult.flashcardCorrect ? t.vocabulary.practice.knewIt : t.vocabulary.practice.didntKnowIt}
                                    </span>
                                </div>
                                <Button variant="primary" className="w-full mt-4" onClick={advanceToNextItem}>
                                    {t.vocabulary.practice.next}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {step === "context" && item.contextQuestion && (
                    <div>
                        <p className="text-sm text-foreground/60 mb-2">
                            {item.contextQuestion.isCloze ? t.vocabulary.practice.contextPromptCloze : t.vocabulary.practice.contextPromptMeaning}
                        </p>
                        <p className="text-lg font-medium text-foreground mb-6">{item.contextQuestion.prompt}</p>

                        <div className="space-y-2 mb-4">
                            {item.contextQuestion.options.map((opt) => {
                                const isSelected = opt.key === selectedKey;
                                const isCorrectOption = roundResult && opt.key === roundResult.correctContextKey;
                                let style = "border-border/60 bg-background hover:border-primary/40";
                                if (roundResult) {
                                    if (isCorrectOption) style = "border-green-500 bg-green-500/10";
                                    else if (isSelected) style = "border-red-500 bg-red-500/10";
                                    else style = "border-border/40 opacity-60";
                                } else if (isSelected) {
                                    style = "border-primary bg-primary/10";
                                }
                                return (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        disabled={submitting || Boolean(roundResult)}
                                        onClick={() => selectContextOption(opt.key)}
                                        className={cn(
                                            "flex w-full items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left text-sm text-foreground transition",
                                            style,
                                        )}
                                    >
                                        {opt.text}
                                        {roundResult && isCorrectOption && <Check className="size-4 text-green-600 shrink-0" />}
                                        {roundResult && isSelected && !isCorrectOption && <XIcon className="size-4 text-red-600 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>

                        {roundResult && (
                            <Button variant="primary" className="w-full" onClick={advanceToNextItem}>
                                {t.vocabulary.practice.next}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VocabularyPracticePage() {
    return (
        <Suspense fallback={<Loading />}>
            <VocabularyPracticeContent />
        </Suspense>
    );
}
