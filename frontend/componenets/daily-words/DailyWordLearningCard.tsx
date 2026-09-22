"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Volume2, CheckCircle2 } from "lucide-react";
import { DailyWord } from "@/types/dailyWord";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import { playVocabularyAudio } from "@/lib/vocabularyAudio";
import Button from "@/componenets/Button";
import { useI18n } from "@/componenets/I18nProvider";
import { cn } from "@/lib/utils";

interface DailyWordLearningCardProps {
    word: DailyWord;
    index: number;
    total: number;
    isSaved: boolean;
    isSaving: boolean;
    isMarking: boolean;
    canGoPrevious: boolean;
    canGoNext: boolean;
    onSave: () => void;
    onMarkLearned: () => void;
    onPrevious: () => void;
    onNext: () => void;
}

export default function DailyWordLearningCard({
    word,
    index,
    total,
    isSaved,
    isSaving,
    isMarking,
    canGoPrevious,
    canGoNext,
    onSave,
    onMarkLearned,
    onPrevious,
    onNext,
}: DailyWordLearningCardProps) {
    const { t } = useI18n();
    const [isPlaying, setIsPlaying] = useState(false);
    const levelColor = getLevelMeta(word.level).color;

    const handlePlayAudio = () => {
        setIsPlaying(true);
        playVocabularyAudio(null, word.word);
        // SpeechSynthesis has no reliable "ended" callback across browsers for this fire-and-forget case,
        // so the pressed state is a short, fixed pulse rather than tracked to real playback end.
        window.setTimeout(() => setIsPlaying(false), 1200);
    };

    return (
        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-card">
            <div className="flex flex-col items-center text-center">
                <span className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
                    {t.dailyWords.card.wordOf(index + 1, total)}
                </span>

                <div className="mt-3 flex items-center gap-2">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{word.word}</h2>
                    <button
                        type="button"
                        onClick={handlePlayAudio}
                        aria-label={t.dailyWords.card.playAria(word.word)}
                        className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-accent hover:text-primary",
                            isPlaying && "text-primary bg-accent",
                        )}
                    >
                        <Volume2 className={cn("size-5", isPlaying && "animate-pulse")} />
                    </button>
                </div>

                <span
                    className="mt-2 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: `${levelColor}1a`, color: levelColor }}
                >
                    {word.level}
                </span>

                <p className="mt-4 text-lg text-foreground/80">{word.meaning}</p>

                {word.example && (
                    <p className="mt-3 text-sm text-foreground/55 italic max-w-md">&ldquo;{word.example}&rdquo;</p>
                )}

                {word.synonyms && (
                    <p className="mt-3 text-xs text-foreground/45">{word.synonyms}</p>
                )}

                {(word.meaningFa || word.exampleFa) && (
                    <div dir="rtl" className="mt-4 pt-4 border-t border-border/40 w-full text-right font-fa">
                        {word.meaningFa && <p className="text-foreground/70">{word.meaningFa}</p>}
                        {word.exampleFa && <p className="text-foreground/50 text-sm mt-1">{word.exampleFa}</p>}
                    </div>
                )}

                <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full sm:justify-center">
                    <Button
                        variant="secondary"
                        className="text-sm"
                        disabled={isSaving || isSaved}
                        onClick={onSave}
                    >
                        {isSaving ? t.dailyWords.card.saving : isSaved ? t.dailyWords.card.saved : t.dailyWords.card.save}
                    </Button>
                    <Button
                        variant={word.learned ? "secondary" : "primary"}
                        className="text-sm"
                        disabled={isMarking || word.learned}
                        onClick={onMarkLearned}
                    >
                        {word.learned ? (
                            <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 className="size-4" /> {t.dailyWords.card.learned}
                            </span>
                        ) : isMarking ? (
                            t.dailyWords.card.saving
                        ) : (
                            t.dailyWords.card.markLearned
                        )}
                    </Button>
                </div>

                <div className="mt-6 flex items-center justify-between w-full">
                    <button
                        type="button"
                        onClick={onPrevious}
                        disabled={!canGoPrevious}
                        aria-label={t.dailyWords.card.previousAria}
                        className="inline-flex items-center gap-1 text-sm font-medium text-foreground/60 disabled:opacity-30 hover:text-primary transition-colors"
                    >
                        <ChevronLeft className="size-4" /> {t.dailyWords.card.previous}
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={!canGoNext}
                        aria-label={t.dailyWords.card.nextAria}
                        className="inline-flex items-center gap-1 text-sm font-medium text-foreground/60 disabled:opacity-30 hover:text-primary transition-colors"
                    >
                        {t.dailyWords.card.next} <ChevronRight className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
