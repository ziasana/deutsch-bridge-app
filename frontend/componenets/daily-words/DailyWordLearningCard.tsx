"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Check, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { DailyWord } from "@/types/dailyWord";
import { getLevelMeta } from "@/componenets/learning/levelMeta";
import { playVocabularyAudio } from "@/lib/vocabularyAudio";
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
}: Readonly<DailyWordLearningCardProps>) {
    const { t } = useI18n();
    const [isPlaying, setIsPlaying] = useState(false);
    const levelColor = getLevelMeta(word.level).color;
    const synonyms = word.synonyms
        ? word.synonyms
              .split(/[,;]/)
              .map((s) => s.trim())
              .filter(Boolean)
        : [];

    const handlePlayAudio = () => {
        setIsPlaying(true);
        playVocabularyAudio(null, word.word);
        // SpeechSynthesis has no reliable "ended" callback across browsers for this fire-and-forget case,
        // so the pressed state is a short, fixed pulse rather than tracked to real playback end.
        window.setTimeout(() => setIsPlaying(false), 1200);
    };

    const navButton =
        "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-card text-foreground/70 shadow-card transition hover:-translate-y-0.5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:text-foreground/70";

    return (
        <div className="flex items-center gap-3">
            <button type="button" onClick={onPrevious} disabled={!canGoPrevious} aria-label={t.dailyWords.card.previousAria} className={cn(navButton, "hidden sm:flex")}>
                <ChevronLeft className="size-5" aria-hidden="true" />
            </button>

            <article
                key={word.id}
                className="anim-fade-up min-w-0 flex-1 rounded-3xl bg-card p-6 text-center shadow-card sm:p-8"
                style={{ borderTop: `4px solid ${levelColor}` }}
            >
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
                        {t.dailyWords.card.wordOf(index + 1, total)}
                    </span>
                    <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: `${levelColor}1f`, color: levelColor }}>
                        {word.level}
                    </span>
                </div>

                <div className="mt-6 flex items-center justify-center gap-3">
                    <h2 className="break-words text-4xl font-bold text-foreground sm:text-5xl">{word.word}</h2>
                    <button
                        type="button"
                        onClick={handlePlayAudio}
                        aria-label={t.dailyWords.card.playAria(word.word)}
                        className={cn(
                            "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-primary transition hover:scale-110 hover:bg-primary/20",
                            isPlaying && "bg-primary text-primary-foreground",
                        )}
                    >
                        <Volume2 className={cn("size-5", isPlaying && "animate-pulse")} aria-hidden="true" />
                    </button>
                </div>

                <p className="mt-5 text-xl font-medium text-foreground/85">{word.meaning}</p>

                {word.example && (
                    <p className="mx-auto mt-5 max-w-md border-s-4 border-primary/25 ps-4 text-start text-sm italic leading-relaxed text-foreground/65">
                        &ldquo;{word.example}&rdquo;
                    </p>
                )}

                {synonyms.length > 0 && <p className="mt-4 text-xs text-foreground/50">{synonyms.join(" · ")}</p>}

                {(word.meaningFa || word.exampleFa) && (
                    <div dir="rtl" className="mt-5 border-t border-border/60 pt-4 text-right font-fa">
                        {word.meaningFa && <p className="font-medium text-foreground/75">{word.meaningFa}</p>}
                        {word.exampleFa && <p className="mt-1 text-sm text-foreground/55">{word.exampleFa}</p>}
                    </div>
                )}

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                        type="button"
                        disabled={isSaving || isSaved}
                        onClick={onSave}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-60"
                    >
                        {isSaved ? <BookmarkCheck className="size-4 text-primary" aria-hidden="true" /> : <Bookmark className="size-4" aria-hidden="true" />}
                        {isSaving ? t.dailyWords.card.saving : isSaved ? t.dailyWords.card.saved : t.dailyWords.card.save}
                    </button>
                    <button
                        type="button"
                        disabled={isMarking || word.learned}
                        onClick={onMarkLearned}
                        className={cn(
                            "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-default",
                            word.learned
                                ? "border border-green-500/30 bg-green-500/10 text-green-700 focus-visible:ring-green-400 dark:text-green-400"
                                : "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary/50 disabled:opacity-60",
                        )}
                    >
                        <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                        {word.learned ? t.dailyWords.card.learned : isMarking ? t.dailyWords.card.saving : t.dailyWords.card.markLearned}
                    </button>
                </div>

                <div className="mt-6 flex items-center justify-between sm:hidden">
                    <button type="button" onClick={onPrevious} disabled={!canGoPrevious} aria-label={t.dailyWords.card.previousAria} className={navButton}>
                        <ChevronLeft className="size-5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={onNext} disabled={!canGoNext} aria-label={t.dailyWords.card.nextAria} className={navButton}>
                        <ChevronRight className="size-5" aria-hidden="true" />
                    </button>
                </div>
            </article>

            <button type="button" onClick={onNext} disabled={!canGoNext} aria-label={t.dailyWords.card.nextAria} className={cn(navButton, "hidden sm:flex")}>
                <ChevronRight className="size-5" aria-hidden="true" />
            </button>
        </div>
    );
}
