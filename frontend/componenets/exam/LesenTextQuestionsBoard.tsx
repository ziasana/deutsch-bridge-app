"use client";

import { Headphones } from "lucide-react";
import AudioPlayer from "@/componenets/AudioPlayer";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { formatTextHeadings } from "@/lib/textHeadings";
import { cn } from "@/lib/utils";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";
import { readingColorAt } from "./readingColors";

export const TRUE_FALSE_CHOICES = [
    { value: "RICHTIG", label: "richtig" },
    { value: "FALSCH", label: "falsch" },
] as const;

interface Props {
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    /** questionId -> RICHTIG / FALSCH (richtig/falsch tasks) or the chosen option text (multiple choice). */
    answers: Record<string, string>;
    disabled: boolean;
    onAnswer: (questionId: string, value: string) => void;
}

export const choiceClass = (selected: boolean) =>
    cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm text-foreground transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-60",
        selected ? "border-primary bg-primary/10" : "border-border/60 bg-background hover:border-primary/50 hover:bg-accent/50",
    );

export const badgeClass = (selected: boolean) =>
    cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        selected ? "bg-primary text-primary-foreground" : "bg-accent text-primary",
    );

/**
 * DTZ Lesen Teil 3 and DTZ Hören Teil 1-3: each text (or recording - a passage with audio gets a player) is followed by its two tasks - a richtig/falsch statement and a multiple-choice question
 * with the options a, b, c. Everything is answered on one page (like the paper test) and submitted together.
 */
export default function LesenTextQuestionsBoard({ passages, questions, answers, disabled, onAnswer }: Readonly<Props>) {
    // Tasks that could not be tied to a text still have to be answerable, so they get a card of their own at the end.
    // One information text with only richtig/falsch statements (Teil 4): its subtitles are shown as headings, like in a document.
    const formatHeadings = passages.length === 1 && questions.length > 0 && questions.every((q) => q.taskType === "TRUE_FALSE");
    const orphans = questions.filter((q) => q.sectionIndex == null || !passages[q.sectionIndex]);

    const renderTask = (question: ExamQuestionPublic, position: number) => {
        const number = question.questionNumber ?? position + 1;
        const selected = answers[question.id];
        const isTrueFalse = question.taskType === "TRUE_FALSE";
        return (
            <fieldset key={question.id} disabled={disabled} role="radiogroup" aria-label={`Aufgabe ${number}`} className="space-y-2.5">
                <legend className="mb-2 flex gap-3 text-base font-semibold leading-snug text-foreground">
                    <span className="shrink-0 text-primary">{number}</span>
                    <span className="min-w-0 break-words">{question.prompt}</span>
                </legend>
                {isTrueFalse ? (
                    <div className="grid grid-cols-2 gap-2.5">
                        {TRUE_FALSE_CHOICES.map((choice) => (
                            <button
                                key={choice.value}
                                type="button"
                                role="radio"
                                aria-checked={selected === choice.value}
                                onClick={() => onAnswer(question.id, choice.value)}
                                className={cn(choiceClass(selected === choice.value), "justify-center font-semibold")}
                            >
                                {choice.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    (question.options ?? []).map((option, i) => (
                        <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={selected === option}
                            onClick={() => onAnswer(question.id, option)}
                            className={choiceClass(selected === option)}
                        >
                            <span aria-hidden="true" className={badgeClass(selected === option)}>
                                {String.fromCharCode(97 + i)}
                            </span>
                            <span className="min-w-0 flex-1 break-words">{option}</span>
                        </button>
                    ))
                )}
            </fieldset>
        );
    };

    const tasksOf = (index: number) => questions.filter((q) => q.sectionIndex === index);

    return (
        <div className="space-y-6">
            {passages.map((passage, index) => {
                const color = readingColorAt(index);
                const imageSrc = resolveUploadUrl(passage.imageUrl);
                const audioSrc = resolveUploadUrl(passage.audioUrl);
                return (
                    <section key={passage.id} aria-label={passage.label} className={cn("overflow-hidden rounded-[10px] border bg-card shadow-card", color.border)}>
                        <header className={cn("flex items-center gap-2 px-5 py-3 text-sm font-bold", color.soft, color.text)}>
                            {audioSrc ? <Headphones aria-hidden="true" className="size-4" /> : <span aria-hidden="true" className={cn("size-2.5 rounded-full", color.solid)} />}
                            {passage.label}
                        </header>
                        <div className="space-y-5 p-5 sm:p-6">
                            {audioSrc && <AudioPlayer key={audioSrc} src={audioSrc} />}
                            {imageSrc && <img src={imageSrc} alt="" className="max-w-full rounded-lg" />}
                            {passage.content && <LessonMarkdown
                                    content={formatHeadings ? formatTextHeadings(passage.content) : passage.content}
                                    className={cn("text-sm text-foreground/85", formatHeadings && "[&_h3]:mb-1 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground [&_p]:my-0 [&_p]:leading-7 [&_h3:first-child]:mt-0")}
                                />}
                            <div className="space-y-6 border-t border-border/60 pt-5">{tasksOf(index).map((q) => renderTask(q, questions.indexOf(q)))}</div>
                        </div>
                    </section>
                );
            })}
            {orphans.length > 0 && (
                <section className="space-y-6 rounded-[10px] border border-border/60 bg-card p-5 shadow-card sm:p-6">
                    {orphans.map((q) => renderTask(q, questions.indexOf(q)))}
                </section>
            )}
        </div>
    );
}
