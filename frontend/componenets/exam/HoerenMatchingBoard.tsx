"use client";

import { Check, Headphones } from "lucide-react";
import AudioPlayer from "@/componenets/AudioPlayer";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { cn } from "@/lib/utils";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";
import { readingColorAt } from "./readingColors";

interface Props {
    /** The one recording the persons speak in. */
    passages: ExamPassagePublic[];
    /** One question per person; its prompt names the person. */
    questions: ExamQuestionPublic[];
    /** The shared pool of statements (more than there are persons). */
    answerOptions: string[];
    /** Optional labels per statement ("a", "b" ...); blank = positional letter. */
    answerOptionLabels?: string[];
    /** questionId -> the chosen statement. */
    answers: Record<string, string>;
    disabled: boolean;
    onAnswer: (questionId: string, value: string) => void;
}

/**
 * DTZ Hören Teil 4: the learner listens to one discussion and assigns a statement to every person. All statements are listed
 * (a, b, c ...) next to the recording; each person picks one of them. A statement is meant for one person only, so it is blocked
 * for the others until it is released again.
 */
export default function HoerenMatchingBoard({ passages, questions, answerOptions, answerOptionLabels = [], answers, disabled, onAnswer }: Readonly<Props>) {
    const labelOf = (index: number) => answerOptionLabels[index]?.trim() || String.fromCharCode(97 + index);
    const takenBy = (statement: string, exceptQuestionId: string) => questions.some((q) => q.id !== exceptQuestionId && answers[q.id] === statement);

    return (
        <div className="space-y-6">
            {passages.map((passage, index) => {
                const color = readingColorAt(index);
                const audioSrc = resolveUploadUrl(passage.audioUrl);
                return (
                    <section key={passage.id} aria-label={passage.label} className={cn("overflow-hidden rounded-[10px] border bg-card shadow-card", color.border)}>
                        <header className={cn("flex items-center gap-2 px-5 py-3 text-sm font-bold", color.soft, color.text)}>
                            <Headphones aria-hidden="true" className="size-4" />
                            {passage.label}
                        </header>
                        <div className="space-y-3 p-5 sm:p-6">
                            {audioSrc && <AudioPlayer key={audioSrc} src={audioSrc} />}
                            {passage.content && <LessonMarkdown content={passage.content} className="text-sm text-foreground/85" />}
                        </div>
                    </section>
                );
            })}

            <section aria-label="Aussagen" className="rounded-[10px] border border-border/60 bg-card p-5 shadow-card sm:p-6">
                <h3 className="mb-3 text-sm font-bold text-foreground">Aussagen</h3>
                <ul className="space-y-2">
                    {answerOptions.map((statement, i) => {
                        const used = questions.some((q) => answers[q.id] === statement);
                        return (
                            <li key={statement + i} className={cn("flex gap-3 rounded-xl px-3 py-2 text-sm", used ? "bg-primary/10 text-foreground" : "bg-background text-foreground/85")}>
                                <span aria-hidden="true" className="shrink-0 font-bold text-primary">{labelOf(i)}</span>
                                <span className="min-w-0 flex-1 break-words">{statement}</span>
                                {used && <Check aria-hidden="true" className="size-4 shrink-0 text-primary" strokeWidth={3} />}
                            </li>
                        );
                    })}
                </ul>
            </section>

            <section aria-label="Personen" className="space-y-5 rounded-[10px] border border-border/60 bg-card p-5 shadow-card sm:p-6">
                <h3 className="text-sm font-bold text-foreground">Wer sagt was?</h3>
                {questions.map((question, position) => {
                    const number = question.questionNumber ?? position + 1;
                    const selected = answers[question.id] ?? "";
                    return (
                        <fieldset key={question.id} disabled={disabled} role="radiogroup" aria-label={`Aufgabe ${number}`} className="space-y-2.5">
                            <legend className="mb-2 flex gap-3 text-base font-semibold leading-snug text-foreground">
                                <span className="shrink-0 text-primary">{number}</span>
                                <span className="min-w-0 break-words">{question.prompt}</span>
                            </legend>
                            <div className="flex flex-wrap gap-2">
                                {answerOptions.map((statement, i) => {
                                    const blocked = selected !== statement && takenBy(statement, question.id);
                                    return (
                                        <button
                                            key={statement + i}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected === statement}
                                            aria-label={`Aufgabe ${number}: Aussage ${labelOf(i)}`}
                                            disabled={blocked}
                                            onClick={() => onAnswer(question.id, selected === statement ? "" : statement)}
                                            className={cn(
                                                "flex size-10 cursor-pointer items-center justify-center rounded-full border text-sm font-bold uppercase transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-35",
                                                selected === statement ? "border-primary bg-primary text-primary-foreground" : "border-border/60 bg-background text-foreground hover:border-primary/50 hover:bg-accent/50",
                                            )}
                                        >
                                            {labelOf(i)}
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>
                    );
                })}
            </section>
        </div>
    );
}
