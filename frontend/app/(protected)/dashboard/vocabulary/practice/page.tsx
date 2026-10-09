"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Volume2, Check, X as XIcon, ArrowRight } from "lucide-react";
import { getPracticeSession, submitPracticeRound } from "@/services/vocabularyPracticeService";
import { PracticeVocabularySession, PracticeVocabularyItem, VocabularyRoundResponse } from "@/types/vocabulary";
import Loading from "@/componenets/Loading";
import PracticeShell from "@/componenets/practice/PracticeShell";
import PracticeHeader from "@/componenets/practice/PracticeHeader";
import PracticeChip from "@/componenets/practice/PracticeChip";
import PracticeFlipCard from "@/componenets/practice/PracticeFlipCard";
import PracticeGradeButtons from "@/componenets/practice/PracticeGradeButtons";
import PracticeSummary, { practicePrimaryButton, practiceSecondaryButton } from "@/componenets/practice/PracticeSummary";
import { playVocabularyAudio } from "@/lib/vocabularyAudio";
import { useI18n } from "@/componenets/I18nProvider";
import { cn } from "@/lib/utils";
import { ARTICLE_TONE as ARTICLE_COLORS, SOURCE_ACCENT } from "@/componenets/vocabulary/sourceColors";

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
            <PracticeShell accent={SOURCE_ACCENT.CUSTOM}>
                <div className="anim-fade-up rounded-3xl bg-card p-10 text-center shadow-card">
                    <h1 className="text-2xl font-bold text-foreground">{t.vocabulary.practice.noWords}</h1>
                    <p className="mt-2 text-foreground/65">{t.vocabulary.practice.noWordsSubtitle}</p>
                    <button type="button" onClick={() => router.push(exitTarget)} className={`${practicePrimaryButton} mt-7`}>
                        {t.vocabulary.practice.goToVocabulary}
                    </button>
                </div>
            </PracticeShell>
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
            <PracticeShell accent={SOURCE_ACCENT.CUSTOM}>
                <PracticeSummary
                    accent={SOURCE_ACCENT.CUSTOM}
                    title={t.vocabulary.practice.sessionComplete}
                    subtitle={`${t.vocabulary.practice.wordsPracticed}: ${total}`}
                    rings={[
                        { value: recallAccuracy, label: t.vocabulary.practice.recallAccuracy },
                        { value: contextAccuracy, label: t.vocabulary.practice.contextAccuracy },
                    ]}
                    actions={
                        <>
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
                                className={practicePrimaryButton}
                            >
                                {t.vocabulary.practice.practiceAgain}
                            </button>
                            <button type="button" onClick={() => router.push(exitTarget)} className={practiceSecondaryButton}>
                                {t.vocabulary.practice.backToVocabulary}
                            </button>
                        </>
                    }
                />
            </PracticeShell>
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

    const articleTone = item.article ? (ARTICLE_COLORS[item.article.toLowerCase()] ?? "bg-primary/10 text-primary") : "";

    // Whole-session progress: completed words plus the share of the current word already answered.
    const percent = ((index + (roundResult ? 1 : step === "context" ? 0.5 : 0)) / session.items.length) * 100;

    const nextButton = (
        <button type="button" onClick={advanceToNextItem} className={`${practicePrimaryButton} mt-5 w-full`}>
            {t.vocabulary.practice.next}
            <ArrowRight className="size-4" aria-hidden="true" />
        </button>
    );

    return (
        <PracticeShell accent={SOURCE_ACCENT[item.source]}>
            <PracticeHeader
                exitHref={exitTarget}
                exitLabel={t.vocabulary.practice.backToVocabulary}
                counter={t.vocabulary.practice.itemOf(index + 1, session.items.length)}
                percent={percent}
                meta={
                    <>
                        {item.level && <PracticeChip className="text-primary">{item.level}</PracticeChip>}
                        {item.wordType && <PracticeChip>{t.vocabulary.wordTypes[item.wordType]}</PracticeChip>}
                        {totalSteps > 1 && <PracticeChip>{t.vocabulary.practice.stepOf(currentStepNumber, totalSteps)}</PracticeChip>}
                    </>
                }
            />

            <div className="mt-6">
                {step === "flashcard" && (
                    <div>
                        <PracticeFlipCard
                            flipped={flipped}
                            onToggle={() => setFlipped((f) => !f)}
                            ariaLabel={`${wordLabel} – ${t.vocabulary.practice.flipPrompt}`}
                            frontHint={t.vocabulary.practice.flipPrompt}
                            front={
                                <>
                                    {item.article && (
                                        <span className={cn("rounded-full px-3 py-0.5 text-sm font-bold", articleTone)}>{item.article}</span>
                                    )}
                                    {item.wordType && (
                                        <span className="rounded-full bg-muted px-3 py-0.5 text-xs font-semibold text-foreground/70">
                                            {t.vocabulary.wordTypes[item.wordType]}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <h2 className="break-words text-4xl font-extrabold leading-tight text-foreground">{item.word}</h2>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playVocabularyAudio(item.audioUrl, item.word);
                                            }}
                                            aria-label={t.vocabulary.card.playAudioAria}
                                            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-primary transition hover:scale-110 hover:bg-primary/20"
                                        >
                                            <Volume2 className="size-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                </>
                            }
                            back={
                                <>
                                    <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
                                        {wordLabel}
                                        {item.wordType ? ` · ${t.vocabulary.wordTypes[item.wordType]}` : ""}
                                    </span>
                                    <p className="text-2xl font-bold leading-snug">{item.meaning}</p>
                                    {item.example && <p className="line-clamp-4 text-sm italic text-white/85">„{item.example}“</p>}
                                    {item.synonyms && <p className="text-xs text-white/70">{item.synonyms}</p>}
                                </>
                            }
                        />

                        {!roundResult && (
                            <PracticeGradeButtons
                                visible={flipped}
                                disabled={submitting}
                                knowLabel={t.vocabulary.practice.knewIt}
                                dontKnowLabel={t.vocabulary.practice.didntKnowIt}
                                onKnow={() => gradeFlashcard(true)}
                                onDontKnow={() => gradeFlashcard(false)}
                            />
                        )}

                        {roundResult && !item.contextQuestion && (
                            <div className="mt-6">
                                <div
                                    className={cn(
                                        "flex items-center gap-2 rounded-2xl p-4",
                                        roundResult.flashcardCorrect
                                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                            : "bg-red-500/10 text-red-700 dark:text-red-400",
                                    )}
                                >
                                    {roundResult.flashcardCorrect ? <Check className="size-4" /> : <XIcon className="size-4" />}
                                    <span className="text-sm font-semibold">
                                        {roundResult.flashcardCorrect ? t.vocabulary.practice.knewIt : t.vocabulary.practice.didntKnowIt}
                                    </span>
                                </div>
                                {nextButton}
                            </div>
                        )}
                    </div>
                )}

                {step === "context" && item.contextQuestion && (
                    <div className="anim-fade-up rounded-3xl border-t-4 border-primary bg-card p-6 shadow-card sm:p-8">
                        <p className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                            {item.contextQuestion.isCloze ? t.vocabulary.practice.contextPromptCloze : t.vocabulary.practice.contextPromptMeaning}
                        </p>
                        <p className="mt-3 text-xl font-semibold leading-relaxed text-foreground">{item.contextQuestion.prompt}</p>

                        <div className="mt-6 space-y-2.5">
                            {item.contextQuestion.options.map((opt, i) => {
                                const isSelected = opt.key === selectedKey;
                                const isCorrectOption = roundResult && opt.key === roundResult.correctContextKey;
                                let style = "border-border/60 bg-background hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/50 hover:shadow-card";
                                let letterStyle = "bg-accent text-primary";
                                if (roundResult) {
                                    if (isCorrectOption) {
                                        style = "anim-pop border-green-500 bg-green-500/10";
                                        letterStyle = "bg-green-500 text-white";
                                    } else if (isSelected) {
                                        style = "border-red-500 bg-red-500/10";
                                        letterStyle = "bg-red-500 text-white";
                                    } else {
                                        style = "border-border/40 opacity-55";
                                    }
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
                                            "flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm text-foreground transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                            style,
                                        )}
                                    >
                                        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", letterStyle)} aria-hidden="true">
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        <span className="min-w-0 flex-1 break-words">{opt.text}</span>
                                        {roundResult && isCorrectOption && <Check className="size-4 shrink-0 text-green-600" aria-hidden="true" />}
                                        {roundResult && isSelected && !isCorrectOption && <XIcon className="size-4 shrink-0 text-red-600" aria-hidden="true" />}
                                    </button>
                                );
                            })}
                        </div>

                        {roundResult && nextButton}
                    </div>
                )}
            </div>
        </PracticeShell>
    );
}

export default function VocabularyPracticePage() {
    return (
        <Suspense fallback={<Loading />}>
            <VocabularyPracticeContent />
        </Suspense>
    );
}
