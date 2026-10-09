"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { DailyWord } from "@/types/dailyWord";
import { useI18n } from "@/componenets/I18nProvider";
import { cn } from "@/lib/utils";
import { ACCENT_TITLE_COLOR } from "@/componenets/learning/levelMeta";

interface PracticeQuestion {
    word: DailyWord;
    options: string[];
}

function buildQuestions(words: DailyWord[]): PracticeQuestion[] {
    return words.map((word) => {
        const distractors = words
            .filter((w) => w.id !== word.id)
            .map((w) => w.word)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        const options = [word.word, ...distractors].sort(() => Math.random() - 0.5);
        return { word, options };
    });
}

interface DailyWordsQuickPracticeProps {
    words: DailyWord[];
    onComplete: () => void;
}

export default function DailyWordsQuickPractice({ words, onComplete }: DailyWordsQuickPracticeProps) {
    const { t, language } = useI18n();
    const questions = useMemo(() => buildQuestions(words), [words]);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    // Right/wrong per answered question, for the progress dots.
    const [results, setResults] = useState<boolean[]>([]);

    if (questions.length === 0) {
        return null;
    }

    const question = questions[questionIndex];
    const isLast = questionIndex === questions.length - 1;
    // Persian-explanation learners only get an AI-generated meaningFa for A1-B1 words (see
    // DailyWordService), so fall back to the English meaning when it's missing rather than
    // showing a blank prompt.
    const promptMeaning = language === "fa" && question.word.meaningFa ? question.word.meaningFa : question.word.meaning;

    const handleSelect = (option: string) => {
        if (selected) return;
        setSelected(option);
        setResults((prev) => [...prev.slice(0, questionIndex), option === question.word.word]);
    };

    const handleContinue = () => {
        setSelected(null);
        if (isLast) {
            onComplete();
        } else {
            setQuestionIndex((i) => i + 1);
        }
    };

    return (
        <div className="anim-fade-up overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-border/60">
            <div className="flex items-center justify-between gap-3 bg-primary/[0.07] px-6 py-4 sm:px-8">
                <h2 className="text-lg font-extrabold" style={{ color: ACCENT_TITLE_COLOR }}>{t.dailyWords.practice.title}</h2>
                <span className="rounded-full bg-card/80 px-3 py-1 text-xs font-bold text-primary shadow-sm">
                    {t.dailyWords.practice.questionOf(questionIndex + 1, questions.length)}
                </span>
            </div>

            <div className="p-6 pt-5 sm:p-8 sm:pt-6">
            <div className="flex flex-wrap items-center gap-2" aria-hidden="true">
                {questions.map((q, i) => {
                    const result = results[i];
                    const current = i === questionIndex;
                    const showResult = result !== undefined && (!current || selected !== null);
                    return (
                        <span
                            key={q.word.id}
                            className={cn(
                                "flex size-8 items-center justify-center rounded-full text-xs font-extrabold transition",
                                showResult ? (result ? "bg-green-500 text-white" : "bg-red-500 text-white") : "border-2 border-dashed border-primary/40 text-primary",
                                current && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                            )}
                        >
                            {showResult ? result ? <Check className="size-4" strokeWidth={3} /> : <X className="size-4" strokeWidth={3} /> : i + 1}
                        </span>
                    );
                })}
            </div>

            <p className="mt-6 text-xl font-semibold leading-relaxed text-foreground">{t.dailyWords.practice.prompt(promptMeaning)}</p>

            <div className="mt-6 space-y-2.5" role="radiogroup" aria-label={t.dailyWords.practice.answerOptionsAria}>
                {question.options.map((option, i) => {
                    const isCorrect = option === question.word.word;
                    const isSelected = option === selected;
                    const showResult = selected !== null;

                    return (
                        <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => handleSelect(option)}
                            disabled={showResult}
                            className={cn(
                                "flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                !showResult && "border-border/60 bg-background hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent/50 hover:shadow-card",
                                showResult && isCorrect && "anim-pop border-green-500 bg-green-500/10 text-foreground",
                                showResult && isSelected && !isCorrect && "border-red-500 bg-red-500/10 text-foreground",
                                showResult && !isSelected && !isCorrect && "border-border/40 text-foreground/40",
                            )}
                        >
                            <span
                                aria-hidden="true"
                                className={cn(
                                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                    showResult && isCorrect ? "bg-green-500 text-white" : showResult && isSelected ? "bg-red-500 text-white" : "bg-accent text-primary",
                                )}
                            >
                                {showResult && isCorrect ? <Check className="size-4" strokeWidth={3} /> : showResult && isSelected ? <X className="size-4" strokeWidth={3} /> : String.fromCharCode(65 + i)}
                            </span>
                            <span className="min-w-0 flex-1 break-words">{option}</span>
                        </button>
                    );
                })}
            </div>

            {selected && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <p className={cn("text-sm font-semibold", selected === question.word.word ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>
                        {selected === question.word.word ? t.dailyWords.practice.correct : t.dailyWords.practice.incorrect(question.word.word)}
                    </p>
                    <button
                        type="button"
                        onClick={handleContinue}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        {isLast ? t.dailyWords.practice.finish : t.dailyWords.practice.next}
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                </div>
            )}
            </div>
        </div>
    );
}
