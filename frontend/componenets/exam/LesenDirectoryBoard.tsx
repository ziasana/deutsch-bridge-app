"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, X } from "lucide-react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { cn } from "@/lib/utils";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";
import { badgeClass, choiceClass } from "./LesenTextQuestionsBoard";

/** Label of the optional second passage: the unscored example (see ExamContentMapper.EXAMPLE_LABEL on the backend). */
export const EXAMPLE_LABEL = "Beispiel";

interface Props {
    /** passages[0] is the shared information source; a passage labelled "Beispiel" is the unscored example. */
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    /** questionId -> the chosen option's text. */
    answers: Record<string, string>;
    disabled: boolean;
    onAnswer: (questionId: string, value: string) => void;
}

/**
 * The source is stored as HTML with one paragraph per entry (bold heading, then its details). Each entry is shown in its own box so
 * the entries cannot run into each other; an introduction paragraph (no bold heading) stays plain text above them.
 */
function SourceBlocks({ content }: Readonly<{ content: string }>) {
    const blocks = content.match(/<p>[\s\S]*?<\/p>/g) ?? [content];
    return (
        <div className="space-y-3">
            {blocks.map((block, i) =>
                /^<p>\s*<strong>/.test(block) ? (
                    <div key={i} className="rounded-xl border border-border/70 bg-background p-4 shadow-sm [&_strong]:text-foreground">
                        <LessonMarkdown content={block} className="text-sm leading-relaxed text-foreground/85" />
                    </div>
                ) : (
                    <LessonMarkdown key={i} content={block} className="px-1 text-sm text-foreground/75" />
                ),
            )}
        </div>
    );
}

function SourceCard({ passage }: Readonly<{ passage: ExamPassagePublic }>) {
    return (
        <section aria-label={passage.label} className="overflow-hidden rounded-[10px] border border-border/60 bg-card shadow-card">
            <header className="bg-accent/60 px-5 py-3 text-sm font-bold text-foreground">{passage.label}</header>
            <div className="p-5">
                <SourceBlocks content={passage.content} />
            </div>
        </section>
    );
}

/**
 * DTZ Lesen Teil 1 (Kataloge, Register, Verzeichnisse verstehen): the information source and the five situations side by side.
 * On wide screens the source sticks next to the questions so it stays visible while answering; on small screens it opens in a
 * panel on top of the questions, so closing it returns to the same place in the list.
 */
export default function LesenDirectoryBoard({ passages, questions, answers, disabled, onAnswer }: Readonly<Props>) {
    const [sourceOpen, setSourceOpen] = useState(false);
    const closeButton = useRef<HTMLButtonElement>(null);
    const source = passages[0];
    const example = passages.find((p, i) => i > 0 && p.label === EXAMPLE_LABEL);

    useEffect(() => {
        if (!sourceOpen) return;
        closeButton.current?.focus();
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSourceOpen(false);
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [sourceOpen]);

    if (!source) return null;

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
            <div className="hidden lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
                <SourceCard passage={source} />
            </div>

            <div className="space-y-5">
                {example && (
                    <section aria-label={EXAMPLE_LABEL} className="rounded-[10px] border border-dashed border-border bg-background p-5">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground/55">{EXAMPLE_LABEL}</p>
                        <LessonMarkdown content={example.content} className="text-sm text-foreground/85" />
                    </section>
                )}

                {questions.map((question, position) => {
                    const number = question.questionNumber ?? position + 1;
                    const selected = answers[question.id];
                    return (
                        <fieldset key={question.id} disabled={disabled} className="space-y-2.5 rounded-[10px] border border-border/60 bg-card p-5 shadow-card">
                            <legend className="sr-only">Aufgabe {number}</legend>
                            <p className="mb-2 flex gap-3 text-base font-semibold leading-snug text-foreground">
                                <span className="shrink-0 text-primary">{number}</span>
                                <span className="min-w-0 break-words">{question.prompt}</span>
                            </p>
                            {(question.options ?? []).map((option, i) => (
                                <button
                                    key={option}
                                    type="button"
                                    aria-pressed={selected === option}
                                    onClick={() => onAnswer(question.id, option)}
                                    className={choiceClass(selected === option)}
                                >
                                    <span aria-hidden="true" className={badgeClass(selected === option)}>
                                        {String.fromCharCode(97 + i)}
                                    </span>
                                    <span className="min-w-0 flex-1 break-words">{option}</span>
                                </button>
                            ))}
                        </fieldset>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={() => setSourceOpen(true)}
                className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg lg:hidden"
            >
                <BookOpen className="size-4" aria-hidden="true" />
                {source.label}
            </button>

            {sourceOpen && (
                <div className={cn("fixed inset-0 z-40 flex flex-col bg-background lg:hidden")} role="dialog" aria-modal="true" aria-label={source.label}>
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                        <h2 className="text-base font-bold text-foreground">{source.label}</h2>
                        <button
                            ref={closeButton}
                            type="button"
                            onClick={() => setSourceOpen(false)}
                            aria-label="Schließen"
                            className="rounded-full p-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                            <X className="size-5" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        <SourceBlocks content={source.content} />
                    </div>
                </div>
            )}
        </div>
    );
}
