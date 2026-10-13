"use client";

import Input from "@/componenets/Input";
import { ExamQuestion } from "@/types/exam";
import { DIRECTORY_FIRST_NUMBER, normalizeDirectoryQuestions, updateDirectoryOption, updateDirectoryQuestion } from "./dtzDirectory";

interface Props {
    questions: ExamQuestion[];
    onChange: (questions: ExamQuestion[]) => void;
}

const selectClass = "px-2 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white";
const optionLetter = (i: number) => String.fromCharCode(97 + i);

/**
 * DTZ Lesen Teil 1: the five situations (21-25) that are solved with the information source above. The exam format fixes the number
 * of situations and options, so there is nothing to add or remove.
 */
export default function DtzDirectoryEditor({ questions, onChange }: Readonly<Props>) {
    const rows = normalizeDirectoryQuestions(questions);
    return (
        <div className="space-y-4">
            {rows.map((question, index) => {
                const number = DIRECTORY_FIRST_NUMBER + index;
                const options = question.options ?? [];
                return (
                    <div key={number} className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 space-y-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Situation {number}</p>
                        <Input
                            value={question.prompt}
                            onChange={(e) => onChange(updateDirectoryQuestion(questions, index, { prompt: e.target.value }))}
                            placeholder={'Situation, e.g. "Ihre Großmutter kann nicht mehr alleine kochen und putzen."'}
                            required={false}
                        />
                        {options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                                <span className="w-5 text-sm font-semibold text-gray-600 dark:text-gray-300">{optionLetter(optionIndex)}</span>
                                <Input
                                    value={option}
                                    onChange={(e) => onChange(updateDirectoryOption(questions, index, optionIndex, e.target.value))}
                                    placeholder={`Option ${optionLetter(optionIndex)}`}
                                    required={false}
                                    className="flex-1"
                                />
                            </div>
                        ))}
                        <select
                            aria-label={`Correct option, situation ${number}`}
                            value={question.correctAnswer && options.includes(question.correctAnswer) ? String(options.indexOf(question.correctAnswer)) : ""}
                            onChange={(e) => onChange(updateDirectoryQuestion(questions, index, { correctAnswer: e.target.value === "" ? "" : options[Number(e.target.value)] }))}
                            className={selectClass}
                        >
                            <option value="">Select correct option...</option>
                            {options.map((option, optionIndex) => (
                                <option key={optionIndex} value={optionIndex} disabled={!option.trim()}>
                                    {optionLetter(optionIndex)}) {option}
                                </option>
                            ))}
                        </select>
                        <Input
                            value={question.explanation}
                            onChange={(e) => onChange(updateDirectoryQuestion(questions, index, { explanation: e.target.value }))}
                            placeholder="Explanation shown after answering (which entry of the source supports the answer)"
                            required={false}
                        />
                    </div>
                );
            })}
        </div>
    );
}
