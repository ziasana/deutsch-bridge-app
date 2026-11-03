"use client";

import Input from "@/componenets/Input";
import { ExamPassage, ExamQuestion } from "@/types/exam";
import { taskNumberAt, updateTaskOption } from "./dtzHoeren";

interface Props {
    passages: ExamPassage[];
    /** The tasks in order; their kinds (richtig/falsch or multiple choice) are fixed by the exam format. */
    questions: ExamQuestion[];
    onChange: (questions: ExamQuestion[]) => void;
    /** Number shown for the first task; the following tasks count up from it. */
    firstNumber: number;
}

const selectClass = "px-2 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white";
const letter = (i: number) => String.fromCharCode(97 + i);

/**
 * DTZ Hören Teil 1-3: the tasks of the exercise in exam order. Each task says which recording (passage) it belongs to - with the usual single
 * audio file that is the same for all of them.
 */
export default function DtzHoerenTasksEditor({ passages, questions, onChange, firstNumber }: Readonly<Props>) {
    const patch = (index: number, change: Partial<ExamQuestion>) => onChange(questions.map((q, i) => (i === index ? { ...q, ...change } : q)));

    return (
        <div className="space-y-4">
            {questions.map((q, index) => {
                const number = taskNumberAt(questions, index, firstNumber);
                const example = Boolean(q.example);
                const trueFalse = q.taskType === "TRUE_FALSE";
                const options = Array.from({ length: 3 }, (_, i) => q.options?.[i] ?? "");
                return (
                    <div key={index} className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {example ? "Beispiel · not scored, shown to the learner with its solution" : `Task ${number} · ${trueFalse ? "richtig / falsch" : "multiple choice (a, b, c)"}`}
                            </p>
                            {passages.length > 1 && (
                                <select aria-label={example ? "Recording, example" : `Recording, task ${number}`} value={q.sectionIndex ?? 0} onChange={(e) => patch(index, { sectionIndex: Number(e.target.value) })} className={selectClass}>
                                    {passages.map((p, i) => (
                                        <option key={p.id} value={i}>
                                            {p.label || `Passage ${i + 1}`}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <Input
                            value={q.prompt}
                            onChange={(e) => patch(index, { prompt: e.target.value })}
                            placeholder={example ? 'Example question, e.g. "Wann öffnet die Praxis?"' : trueFalse ? 'Statement, e.g. "Die Frau möchte einen Termin absagen."' : 'Question, e.g. "Was soll der Anrufer tun?"'}
                            required={false}
                        />
                        {trueFalse ? (
                            <select aria-label={example ? "Correct answer, example" : `Correct answer, task ${number}`} value={q.correctAnswer} onChange={(e) => patch(index, { correctAnswer: e.target.value })} className={selectClass}>
                                <option value="">Select correct answer...</option>
                                <option value="RICHTIG">richtig</option>
                                <option value="FALSCH">falsch</option>
                            </select>
                        ) : (
                            <>
                                {options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center gap-2">
                                        <span className="w-5 text-sm font-semibold text-gray-600 dark:text-gray-300">{letter(optionIndex)}</span>
                                        <Input
                                            value={option}
                                            onChange={(e) => onChange(questions.map((x, i) => (i === index ? updateTaskOption(x, optionIndex, e.target.value) : x)))}
                                            placeholder={`Option ${letter(optionIndex)}`}
                                            required={false}
                                            className="flex-1"
                                        />
                                    </div>
                                ))}
                                <select
                                    aria-label={example ? "Correct option, example" : `Correct option, task ${number}`}
                                    value={q.correctAnswer && options.includes(q.correctAnswer) ? String(options.indexOf(q.correctAnswer)) : ""}
                                    onChange={(e) => patch(index, { correctAnswer: e.target.value === "" ? "" : options[Number(e.target.value)] })}
                                    className={selectClass}
                                >
                                    <option value="">Select correct option...</option>
                                    {options.map((option, optionIndex) => (
                                        <option key={optionIndex} value={optionIndex} disabled={!option.trim()}>
                                            {letter(optionIndex)}) {option}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}
                        {!example && (
                            <>
                                <Input value={q.explanation} onChange={(e) => patch(index, { explanation: e.target.value })} placeholder="Explanation (why this answer is correct)" required={false} />
                                <Input value={q.commonMistake} onChange={(e) => patch(index, { commonMistake: e.target.value })} placeholder="Common mistake" required={false} />
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
