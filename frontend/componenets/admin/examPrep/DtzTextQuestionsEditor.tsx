"use client";

import Input from "@/componenets/Input";
import { ExamPassage, ExamQuestion } from "@/types/exam";
import { CHOICE_COUNT, findTextTask, taskNumber, updateChoiceOption, updateTextTask } from "./dtzTextQuestions";

type Kind = "TRUE_FALSE" | "MULTIPLE_CHOICE";

interface Props {
    passages: ExamPassage[];
    questions: ExamQuestion[];
    onChange: (questions: ExamQuestion[]) => void;
    /** Number shown for the first task; the following tasks count up from it, text by text. */
    firstNumber: number;
    /**
     * The tasks every text carries; both by default (Lesen Teil 3, Hören Teil 3). Hören Teil 1 and 2 have one multiple-choice task per
     * recording, numbered recording by recording.
     */
    kinds?: readonly Kind[];
    /** What the passages are called in the UI: "Text" (default) or e.g. "Ansage". */
    noun?: string;
}

const selectClass = "px-2 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white";
const optionLetter = (i: number) => String.fromCharCode(97 + i);

/**
 * DTZ Lesen Teil 3: below the texts, every text gets its two tasks - a richtig/falsch statement and a multiple-choice
 * question with three options. Which tasks exist is fixed by the exam format, so there is nothing to add or remove.
 */
export default function DtzTextQuestionsEditor({ passages, questions, onChange, firstNumber, kinds = ["TRUE_FALSE", "MULTIPLE_CHOICE"], noun = "Text" }: Readonly<Props>) {
    if (passages.length === 0) {
        return <p className="text-sm text-gray-500 dark:text-gray-400">Add the {noun.toLowerCase()}s above first - each one gets its tasks.</p>;
    }
    const numberOf = (textIndex: number, kind: Kind) => (kinds.length === 1 ? firstNumber + textIndex : taskNumber(firstNumber, textIndex, kind));

    return (
        <div className="space-y-4">
            {passages.map((passage, textIndex) => {
                const trueFalse = findTextTask(questions, textIndex, "TRUE_FALSE");
                const choice = findTextTask(questions, textIndex, "MULTIPLE_CHOICE");
                const options = Array.from({ length: CHOICE_COUNT }, (_, i) => choice?.options?.[i] ?? "");
                return (
                    <div key={passage.id} className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tasks for {passage.label || `${noun} ${textIndex + 1}`}</h3>

                        {kinds.includes("TRUE_FALSE") && <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Task {numberOf(textIndex, "TRUE_FALSE")} · richtig / falsch
                            </p>
                            <Input
                                value={trueFalse?.prompt ?? ""}
                                onChange={(e) => onChange(updateTextTask(questions, textIndex, "TRUE_FALSE", { prompt: e.target.value }))}
                                placeholder={'Statement, e.g. "Das Bürgerbüro in Bergheim wird nächstes Jahr geschlossen."'}
                                required={false}
                            />
                            <select
                                aria-label={`Correct answer, task ${numberOf(textIndex, "TRUE_FALSE")}`}
                                value={trueFalse?.correctAnswer ?? ""}
                                onChange={(e) => onChange(updateTextTask(questions, textIndex, "TRUE_FALSE", { correctAnswer: e.target.value }))}
                                className={selectClass}
                            >
                                <option value="">Select correct answer...</option>
                                <option value="RICHTIG">richtig</option>
                                <option value="FALSCH">falsch</option>
                            </select>
                            <Input
                                value={trueFalse?.explanation ?? ""}
                                onChange={(e) => onChange(updateTextTask(questions, textIndex, "TRUE_FALSE", { explanation: e.target.value }))}
                                placeholder="Explanation (why this is richtig / falsch)"
                                required={false}
                            />
                            <Input
                                value={trueFalse?.commonMistake ?? ""}
                                onChange={(e) => onChange(updateTextTask(questions, textIndex, "TRUE_FALSE", { commonMistake: e.target.value }))}
                                placeholder="Common mistake"
                                required={false}
                            />
                        </div>}

                        {kinds.includes("MULTIPLE_CHOICE") && <div className={kinds.length > 1 ? "space-y-2 border-t border-gray-200 dark:border-gray-600 pt-4" : "space-y-2"}>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Task {numberOf(textIndex, "MULTIPLE_CHOICE")} · multiple choice (a, b, c)
                            </p>
                            <Input
                                value={choice?.prompt ?? ""}
                                onChange={(e) => onChange(updateTextTask(questions, textIndex, "MULTIPLE_CHOICE", { prompt: e.target.value }))}
                                placeholder={'Question, e.g. "Was kann man im Bürgerbüro machen?"'}
                                required={false}
                            />
                            {options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center gap-2">
                                    <span className="w-5 text-sm font-semibold text-gray-600 dark:text-gray-300">{optionLetter(optionIndex)}</span>
                                    <Input
                                        value={option}
                                        onChange={(e) => onChange(updateChoiceOption(questions, textIndex, optionIndex, e.target.value))}
                                        placeholder={`Option ${optionLetter(optionIndex)}`}
                                        required={false}
                                        className="flex-1"
                                    />
                                </div>
                            ))}
                            <select
                                aria-label={`Correct option, task ${numberOf(textIndex, "MULTIPLE_CHOICE")}`}
                                value={choice?.correctAnswer && options.includes(choice.correctAnswer) ? String(options.indexOf(choice.correctAnswer)) : ""}
                                onChange={(e) =>
                                    onChange(updateTextTask(questions, textIndex, "MULTIPLE_CHOICE", { correctAnswer: e.target.value === "" ? "" : options[Number(e.target.value)] }))
                                }
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
                                value={choice?.explanation ?? ""}
                                onChange={(e) => onChange(updateTextTask(questions, textIndex, "MULTIPLE_CHOICE", { explanation: e.target.value }))}
                                placeholder="Explanation (why this option is correct)"
                                required={false}
                            />
                            <Input
                                value={choice?.commonMistake ?? ""}
                                onChange={(e) => onChange(updateTextTask(questions, textIndex, "MULTIPLE_CHOICE", { commonMistake: e.target.value }))}
                                placeholder="Common mistake"
                                required={false}
                            />
                        </div>}
                    </div>
                );
            })}
        </div>
    );
}
