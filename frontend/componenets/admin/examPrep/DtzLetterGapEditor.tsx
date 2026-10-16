"use client";

import Input from "@/componenets/Input";
import { ExamQuestion } from "@/types/exam";
import { normalizeGaps } from "./dtzLetterGap";

interface Props {
    questions: ExamQuestion[];
    onChange: (questions: ExamQuestion[]) => void;
}

/**
 * DTZ Lesen Teil 5: below the letter, the six gap questions 40-45 with three options each. The format fixes their number, type
 * and option count, so there is nothing to add or remove; the correct option is chosen with the radio button.
 */
export default function DtzLetterGapEditor({ questions, onChange }: Readonly<Props>) {
    const gaps = normalizeGaps(questions);
    const update = (index: number, patch: Partial<ExamQuestion>) => onChange(gaps.map((q, i) => (i === index ? { ...q, ...patch } : q)));

    const setOption = (index: number, optionIndex: number, value: string) => {
        const gap = gaps[index];
        const options = [...(gap.options ?? [])];
        const wasCorrect = gap.correctAnswer !== "" && gap.correctAnswer === options[optionIndex];
        options[optionIndex] = value;
        update(index, { options, correctAnswer: wasCorrect ? value : gap.correctAnswer });
    };

    return (
        <div className="space-y-4">
            {gaps.map((q, index) => {
                const number = q.questionNumber;
                return (
                    <div key={number} className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 space-y-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Gap {number} · choose a, b or c</p>
                        {(q.options ?? []).map((option, optionIndex) => {
                            const key = String.fromCharCode(97 + optionIndex);
                            return (
                                <div key={key} className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name={`correct-${number}`}
                                        aria-label={`Option ${key} is correct, gap ${number}`}
                                        checked={option !== "" && q.correctAnswer === option}
                                        disabled={option === ""}
                                        onChange={() => update(index, { correctAnswer: option })}
                                    />
                                    <span className="w-4 text-sm font-semibold text-gray-700 dark:text-gray-200">{key})</span>
                                    <Input
                                        value={option}
                                        onChange={(e) => setOption(index, optionIndex, e.target.value)}
                                        placeholder={`Option ${key}`}
                                        required={false}
                                        aria-label={`Option ${key}, gap ${number}`}
                                    />
                                </div>
                            );
                        })}
                        <Input
                            value={q.explanation}
                            onChange={(e) => update(index, { explanation: e.target.value })}
                            placeholder="Explanation (German): why this option is the only one that fits"
                            required={false}
                            aria-label={`Explanation, gap ${number}`}
                        />
                    </div>
                );
            })}
        </div>
    );
}
