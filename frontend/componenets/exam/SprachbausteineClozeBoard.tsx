"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, PartyPopper, Puzzle } from "lucide-react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { cn } from "@/lib/utils";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";

interface Props {
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    /** questionId -> the chosen option text. */
    answers: Record<string, string>;
    disabled: boolean;
    onAnswer: (questionId: string, value: string) => void;
    /** Teil 2: one shared bank of words (more words than gaps), each usable once. Without it every gap has its own options. */
    wordBank?: { options: string[]; labels: string[] };
}

/** Whether an exercise can use the board: a text with numbered gap badges and a question for every gap (own options, or a word bank). */
export function hasGapText(passages: ExamPassagePublic[], questions: ExamQuestionPublic[], hasWordBank = false): boolean {
    return (
        passages.some((p) => p.content?.includes("data-exam-gap")) &&
        questions.length > 0 &&
        questions.every((q) => q.gapNumber != null && (hasWordBank || (q.options?.length ?? 0) > 0))
    );
}

const navButton =
    "inline-flex cursor-pointer items-center justify-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-40";

/**
 * Sprachbausteine Teil 1: the running text with its numbered gaps as tappable chips. The active gap's choices sit in a
 * dock at the bottom of the screen, so the learner reads the text and chooses without scrolling. A chosen word fills
 * the gap inside the sentence, so the learner reads the finished sentence, and the board moves on to the next open gap.
 * A sticky strip shows progress and jumps to any gap.
 */
export default function SprachbausteineClozeBoard({ passages, questions, answers, disabled, onAnswer, wordBank }: Readonly<Props>) {
    const gapOf = (q: ExamQuestionPublic) => q.gapNumber ?? q.questionNumber ?? questions.indexOf(q) + 1;
    const byGap = new Map(questions.map((q) => [gapOf(q), q]));
    const [activeId, setActiveId] = useState<string | null>(questions[0]?.id ?? null);
    const textRef = useRef<HTMLDivElement>(null);
    const active = questions.find((q) => q.id === activeId) ?? questions[0];
    const activeIndex = active ? questions.indexOf(active) : -1;
    const answeredCount = questions.filter((q) => answers[q.id]).length;
    const allDone = questions.length > 0 && answeredCount === questions.length;

    // Keep the active gap in view when the board moves on by itself or the learner jumps.
    const firstRender = useRef(true);
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const q = questions.find((x) => x.id === activeId);
        if (!q) return;
        textRef.current?.querySelector<HTMLElement>(`[data-gap-chip="${gapOf(q)}"]`)?.scrollIntoView?.({ block: "center", behavior: "smooth" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId]);

    if (!active) return null;

    const holderOf = (word: string) => questions.find((q) => answers[q.id] === word);

    const choose = (value: string) => {
        const unselect = answers[active.id] === value;
        // A bank word another gap already holds moves over (one use per word).
        const holder = wordBank && !unselect ? holderOf(value) : undefined;
        if (holder && holder.id !== active.id) onAnswer(holder.id, "");
        onAnswer(active.id, unselect ? "" : value);
        if (!unselect) {
            const next =
                questions.slice(activeIndex + 1).find((q) => !answers[q.id] && q.id !== holder?.id) ??
                questions.find((q) => q.id !== active.id && !answers[q.id]);
            if (next) setActiveId(next.id);
        }
    };

    const renderGap = (gap: number) => {
        const q = byGap.get(gap);
        if (!q) return <span className="exam-gap-marker">{gap}</span>;
        const value = answers[q.id];
        const isActive = q.id === active.id;
        return (
            <button
                type="button"
                data-gap-chip={gap}
                onClick={() => setActiveId(q.id)}
                aria-label={`Lücke ${gap}${value ? `, ${value}` : ", noch offen"}`}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                    "mx-0.5 inline-flex min-w-9 cursor-pointer items-center justify-center gap-1 rounded-lg border-2 px-2 py-0.5 align-baseline text-[0.95em] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    value
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-dashed border-primary/60 bg-primary/10 text-primary",
                    isActive && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                    isActive && !value && "animate-pulse",
                )}
            >
                {value ? <span key={value} className="anim-pop">{value}</span> : gap}
            </button>
        );
    };

    return (
        <div className="space-y-4">
            <div className="sticky top-2 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-card/95 px-4 py-2.5 shadow-card ring-1 ring-border/60 backdrop-blur">
                <nav aria-label="Lücken" className="flex flex-wrap items-center gap-1.5">
                    {questions.map((q) => {
                        const done = Boolean(answers[q.id]);
                        return (
                            <button
                                key={q.id}
                                type="button"
                                onClick={() => setActiveId(q.id)}
                                aria-current={q.id === active.id ? "step" : undefined}
                                aria-label={`Zu Lücke ${gapOf(q)} springen${done ? " (beantwortet)" : ""}`}
                                className={cn(
                                    "flex size-8 cursor-pointer items-center justify-center rounded-full text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    done ? "bg-primary text-primary-foreground" : "border-2 border-dashed border-primary/40 text-primary",
                                    q.id === active.id && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                                )}
                            >
                                {done ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : gapOf(q)}
                            </button>
                        );
                    })}
                </nav>
                <div className="flex min-w-32 flex-1 items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-label="Ausgefüllte Lücken" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount}>
                        <div className="h-full rounded-full bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) transition-all duration-500" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums text-foreground/70">{answeredCount}/{questions.length} ausgefüllt</span>
                </div>
            </div>

            <article aria-label="Lückentext" className="overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-primary/15">
                <header className="relative overflow-hidden bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) px-5 py-4 text-white">
                    <span aria-hidden="true" className="absolute -end-6 -top-8 size-28 rounded-full bg-white/10" />
                    <div className="relative flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                            <Puzzle className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="font-bold leading-tight">Ergänze den Text</p>
                            <p className="text-xs text-white/85">Tippe auf eine Lücke und wähle das passende Wort.</p>
                        </div>
                    </div>
                </header>
                <div ref={textRef} className="space-y-4 px-5 py-5 sm:px-6">
                    {passages.map((p) => (
                        <LessonMarkdown key={p.id} content={p.content} renderGap={renderGap} className="text-base leading-[2.4] text-foreground/90" />
                    ))}
                </div>
            </article>

            {allDone && (
                <div className="anim-pop flex items-center gap-3 rounded-2xl bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) p-4 text-white shadow-md">
                    <PartyPopper className="size-6 shrink-0" aria-hidden="true" />
                    <p className="text-sm font-semibold">Alle Lücken sind ausgefüllt. Lies den Text noch einmal und gib dann deine Antworten ab.</p>
                </div>
            )}

            {/* Choices for the active gap: pinned to the bottom of the screen while the text scrolls. */}
            <section
                key={active.id}
                aria-label={`Auswahl für Lücke ${gapOf(active)}`}
                aria-live="polite"
                className="anim-slide-in sticky bottom-3 z-10 space-y-3 rounded-3xl bg-card/95 p-4 shadow-lg ring-2 ring-primary/30 backdrop-blur"
            >
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        Lücke {gapOf(active)} · {activeIndex + 1} von {questions.length}
                    </p>
                    <div className="flex gap-1.5">
                        <button type="button" className={navButton} disabled={activeIndex <= 0} onClick={() => setActiveId(questions[activeIndex - 1].id)}>
                            <ArrowLeft className="size-3.5" aria-hidden="true" /> Zurück
                        </button>
                        <button type="button" className={navButton} disabled={activeIndex >= questions.length - 1} onClick={() => setActiveId(questions[activeIndex + 1].id)}>
                            Weiter <ArrowRight className="size-3.5" aria-hidden="true" />
                        </button>
                    </div>
                </div>
                {wordBank && <p className="text-xs text-foreground/55">Jedes Wort nur einmal. Nicht jedes Wort passt in eine Lücke.</p>}
                <div
                    role="group"
                    aria-label={`Wort für Lücke ${gapOf(active)} wählen`}
                    className={wordBank ? "flex max-h-48 flex-wrap gap-2 overflow-y-auto p-0.5" : "grid gap-2 sm:grid-cols-3"}
                >
                    {(wordBank ? wordBank.options : (active.options ?? [])).map((option, i) => {
                        const selected = answers[active.id] === option;
                        const holder = wordBank && !selected ? holderOf(option) : undefined;
                        const letter = wordBank?.labels?.[i]?.trim() || String.fromCharCode(wordBank ? 97 + i : 65 + i);
                        return (
                            <button
                                key={option}
                                type="button"
                                disabled={disabled}
                                aria-pressed={selected}
                                onClick={() => choose(option)}
                                className={cn(
                                    "flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-60",
                                    wordBank && "py-2",
                                    selected
                                        ? "anim-pop border-primary bg-primary/10 text-foreground"
                                        : holder
                                            ? "border-border/50 bg-muted/40 text-foreground/50 hover:border-primary/40"
                                            : "border-border/60 bg-background text-foreground hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-card",
                                )}
                            >
                                <span aria-hidden="true" className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold", selected ? "bg-primary text-primary-foreground" : "bg-accent text-primary")}>
                                    {letter}
                                </span>
                                <span className="min-w-0 flex-1 break-words">{option}</span>
                                {holder && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">Lücke {gapOf(holder)}</span>}
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
