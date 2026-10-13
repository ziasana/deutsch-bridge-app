"use client";

import Input from "@/componenets/Input";
import { ExamQuestion } from "@/types/exam";
import { TRUE_FALSE_FIRST_NUMBER, normalizeStatements } from "./dtzTrueFalseText";

interface Props {
    questions: ExamQuestion[];
    onChange: (questions: ExamQuestion[]) => void;
}

const selectClass = "px-2 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white";

/**
 * DTZ Lesen Teil 4: below the text, the three richtig/falsch statements 37-39. The format fixes their number and type, so there is
 * nothing to add or remove.
 */
export default function DtzTrueFalseTextEditor({ questions, onChange }: Readonly<Props>) {
    const statements = normalizeStatements(questions);
    const update = (index: number, patch: Partial<ExamQuestion>) => onChange(statements.map((q, i) => (i === index ? { ...q, ...patch } : q)));

    return (
        <div className="space-y-4">
            {statements.map((q, index) => {
                const number = TRUE_FALSE_FIRST_NUMBER + index;
                return (
                    <div key={number} className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 space-y-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Statement {number} · richtig / falsch</p>
                        <Input
                            value={q.prompt}
                            onChange={(e) => update(index, { prompt: e.target.value })}
                            placeholder={'Statement, e.g. "Die Betreuung ist auch in den Ferien geöffnet."'}
                            required={false}
                            aria-label={`Statement ${number}`}
                        />
                        <select
                            aria-label={`Correct answer, statement ${number}`}
                            value={q.correctAnswer}
                            onChange={(e) => update(index, { correctAnswer: e.target.value })}
                            className={selectClass}
                        >
                            <option value="">Select correct answer...</option>
                            <option value="RICHTIG">richtig</option>
                            <option value="FALSCH">falsch</option>
                        </select>
                        <Input
                            value={q.explanation}
                            onChange={(e) => update(index, { explanation: e.target.value })}
                            placeholder="Explanation (what the text says)"
                            required={false}
                            aria-label={`Explanation, statement ${number}`}
                        />
                    </div>
                );
            })}
        </div>
    );
}
