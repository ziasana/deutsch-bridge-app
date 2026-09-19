"use client";

import { useMemo, useState } from "react";
import { DailyWord } from "@/types/dailyWord";
import { cn } from "@/lib/utils";

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
    const questions = useMemo(() => buildQuestions(words), [words]);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);

    if (questions.length === 0) {
        return null;
    }

    const question = questions[questionIndex];
    const isLast = questionIndex === questions.length - 1;

    const handleSelect = (option: string) => {
        if (selected) return;
        setSelected(option);
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
        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-card">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Quick Practice</h2>
                <span className="text-xs text-foreground/50">
                    {questionIndex + 1} / {questions.length}
                </span>
            </div>

            <p className="mt-4 text-foreground/80">
                Which word means <span className="font-semibold">&ldquo;{question.word.meaning}&rdquo;</span>?
            </p>

            <div className="mt-4 space-y-2" role="radiogroup" aria-label="Answer options">
                {question.options.map((option) => {
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
                                "w-full text-left rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                                !showResult && "border-border/60 hover:bg-accent/50",
                                showResult && isCorrect && "border-transparent bg-primary/10 text-primary",
                                showResult && isSelected && !isCorrect && "border-transparent bg-destructive/10 text-destructive",
                                showResult && !isSelected && !isCorrect && "border-border/40 text-foreground/40",
                            )}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>

            {selected && (
                <div className="mt-4 flex items-center justify-between">
                    <p className={cn("text-sm font-medium", selected === question.word.word ? "text-primary" : "text-destructive")}>
                        {selected === question.word.word ? "✓ Correct" : `✗ It was "${question.word.word}"`}
                    </p>
                    <button
                        type="button"
                        onClick={handleContinue}
                        className="text-sm font-semibold text-primary hover:underline"
                    >
                        {isLast ? "Finish" : "Next"} →
                    </button>
                </div>
            )}
        </div>
    );
}
