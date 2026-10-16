"use client";

import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import { ExamQuestion } from "@/types/exam";
import { removeStatement, renameStatement } from "./dtzHoeren";

interface Props {
    /** The shared pool of statements, including the distractors. */
    answerOptions: string[];
    /** One question per person. */
    questions: ExamQuestion[];
    /** Number shown for the first person; the following persons count up from it. */
    firstNumber: number;
    onChange: (change: { answerOptions: string[]; questions: ExamQuestion[] }) => void;
}

const selectClass = "px-2 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white";
const letter = (i: number) => String.fromCharCode(97 + i);

/**
 * DTZ Hören Teil 4: the statements (a, b, c ... - more than there are persons) and, for each person, the statement that fits. The
 * number of persons is fixed by the exam format.
 */
export default function DtzOpinionMatchingEditor({ answerOptions, questions, firstNumber, onChange }: Readonly<Props>) {
    const patchPerson = (index: number, patch: Partial<ExamQuestion>) =>
        onChange({ answerOptions, questions: questions.map((q, i) => (i === index ? { ...q, ...patch } : q)) });

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Statements</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Shown to the learner as a list (a, b, c ...). Add a few distractors that fit nobody.</p>
                {answerOptions.map((statement, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="w-5 text-sm font-semibold text-gray-600 dark:text-gray-300">{letter(i)}</span>
                        <Input
                            value={statement}
                            onChange={(e) => onChange(renameStatement(answerOptions, questions, i, e.target.value) )}
                            placeholder={`Statement ${letter(i)}`}
                            required={false}
                            className="flex-1"
                        />
                        <button type="button" aria-label={`Remove statement ${letter(i)}`} onClick={() => onChange(removeStatement(answerOptions, questions, i))} className="text-red-500 text-sm px-2">
                            ✕
                        </button>
                    </div>
                ))}
                <Button type="button" variant="secondary" className="text-xs px-3 py-1" onClick={() => onChange({ answerOptions: [...answerOptions, ""], questions })}>
                    + Add statement
                </Button>
            </div>

            {questions.map((person, index) => (
                <div key={index} className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 space-y-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Task {firstNumber + index} · person {index + 1}</p>
                    <Input
                        value={person.prompt}
                        onChange={(e) => patchPerson(index, { prompt: e.target.value })}
                        placeholder={'Person, e.g. "Person 1: Frau Keller (Mutter)"'}
                        required={false}
                    />
                    <select
                        aria-label={`Matching statement, task ${firstNumber + index}`}
                        value={person.correctAnswer && answerOptions.includes(person.correctAnswer) ? String(answerOptions.indexOf(person.correctAnswer)) : ""}
                        onChange={(e) => patchPerson(index, { correctAnswer: e.target.value === "" ? "" : answerOptions[Number(e.target.value)] })}
                        className={selectClass}
                    >
                        <option value="">Select the matching statement...</option>
                        {answerOptions.map((statement, i) => (
                            <option key={i} value={i} disabled={!statement.trim()}>
                                {letter(i)}) {statement}
                            </option>
                        ))}
                    </select>
                    <Input value={person.explanation} onChange={(e) => patchPerson(index, { explanation: e.target.value })} placeholder="Explanation (what the person says)" required={false} />
                    <Input value={person.commonMistake} onChange={(e) => patchPerson(index, { commonMistake: e.target.value })} placeholder="Common mistake" required={false} />
                </div>
            ))}
        </div>
    );
}
