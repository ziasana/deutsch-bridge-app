"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsDown, Clock, PartyPopper, X } from "lucide-react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { cn } from "@/lib/utils";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";

interface Props {
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    /** The shared pool of headings (one more than there are texts, so not every heading fits). */
    answerOptions: string[];
    /** Admin-edited labels for the headings, falling back to a, b, c ... */
    answerOptionLabels: string[];
    /** questionId -> the chosen heading text. */
    answers: Record<string, string>;
    disabled: boolean;
    onAnswer: (questionId: string, value: string) => void;
}

/** One colour per text, so a heading visibly "belongs" to its text. Static class names so Tailwind keeps them. */
const COLORS = [
    { solid: "bg-sky-500", soft: "bg-sky-500/10", border: "border-sky-500/40", text: "text-sky-700 dark:text-sky-300", ring: "ring-sky-500" },
    { solid: "bg-violet-500", soft: "bg-violet-500/10", border: "border-violet-500/40", text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-500" },
    { solid: "bg-amber-500", soft: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-500" },
    { solid: "bg-rose-500", soft: "bg-rose-500/10", border: "border-rose-500/40", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-500" },
    { solid: "bg-emerald-500", soft: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-500" },
];
const colorAt = (i: number) => COLORS[i % COLORS.length];

const wordCount = (html: string) => html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

/**
 * Lesen Teil 1: headings matched to texts. Every text is a card with its own colour and an empty "heading slot"; the
 * learner picks a heading from the list (beside the texts on desktop, inside the active text on a phone) and it lands in
 * the slot in that text's colour. Each heading can be used once - a used heading shows which text holds it and can be
 * taken over by the active text. A sticky strip shows the progress and jumps to any text.
 */
export default function LesenTeil1Board({ passages, questions, answerOptions, answerOptionLabels, answers, disabled, onAnswer }: Readonly<Props>) {
    const [activeId, setActiveId] = useState<string | null>(questions[0]?.id ?? null);
    const cardRefs = useRef<Record<string, HTMLLIElement | null>>({});
    const active = questions.find((q) => q.id === activeId) ?? questions[0];
    const activeIndex = active ? questions.indexOf(active) : -1;

    const numberOf = (q: ExamQuestionPublic) => q.questionNumber ?? questions.indexOf(q) + 1;
    const passageOf = (q: ExamQuestionPublic): ExamPassagePublic | undefined => passages[q.sectionIndex ?? questions.indexOf(q)];
    const labelFor = (i: number) => answerOptionLabels?.[i]?.trim() || String.fromCharCode(97 + i);
    const holderOf = (heading: string) => questions.find((q) => answers[q.id] === heading);
    const answeredCount = questions.filter((q) => answers[q.id]).length;
    const allDone = questions.length > 0 && answeredCount === questions.length;

    // Bring the active text into view when the learner jumps or the board moves on by itself.
    const firstRender = useRef(true);
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        if (activeId) cardRefs.current[activeId]?.scrollIntoView?.({ block: "center", behavior: "smooth" });
    }, [activeId]);

    if (!active) return null;

    const choose = (heading: string) => {
        // A heading another text already holds moves over (one use per heading).
        const holder = holderOf(heading);
        if (holder && holder.id !== active.id) onAnswer(holder.id, "");
        const unselect = answers[active.id] === heading;
        onAnswer(active.id, unselect ? "" : heading);
        if (!unselect) {
            const next =
                questions.slice(activeIndex + 1).find((q) => !answers[q.id] && q.id !== holder?.id) ??
                questions.find((q) => q.id !== active.id && !answers[q.id]);
            if (next) setActiveId(next.id);
        }
    };

    const headingList = (
        <HeadingList
            options={answerOptions}
            labelFor={labelFor}
            active={active}
            answers={answers}
            holderOf={holderOf}
            numberOf={numberOf}
            colorOf={(q) => colorAt(questions.indexOf(q))}
            disabled={disabled}
            onChoose={choose}
        />
    );

    return (
        <div className="space-y-4">
            <div className="sticky top-2 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-card/95 px-4 py-2.5 shadow-card ring-1 ring-border/60 backdrop-blur">
                <nav aria-label="Texte" className="flex flex-wrap items-center gap-1.5">
                    {questions.map((q, i) => {
                        const c = colorAt(i);
                        const done = Boolean(answers[q.id]);
                        return (
                            <button
                                key={q.id}
                                type="button"
                                onClick={() => setActiveId(q.id)}
                                aria-current={q.id === active.id ? "step" : undefined}
                                aria-label={`Text ${numberOf(q)}${done ? ", zugeordnet" : ", noch offen"}`}
                                className={cn(
                                    "flex size-8 cursor-pointer items-center justify-center rounded-full text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    done ? `${c.solid} text-white` : `border-2 border-dashed ${c.border} ${c.text} bg-transparent`,
                                    q.id === active.id && `ring-2 ring-offset-2 ring-offset-card ${c.ring}`,
                                )}
                            >
                                {done ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : numberOf(q)}
                            </button>
                        );
                    })}
                </nav>
                <div className="flex min-w-32 flex-1 items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-label="Zugeordnete Texte" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount}>
                        <div className="h-full rounded-full bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) transition-all duration-500" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums text-foreground/70">{answeredCount}/{questions.length} zugeordnet</span>
                </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
                <ol className="space-y-4">
                    {questions.map((q, idx) => {
                        const passage = passageOf(q);
                        const c = colorAt(idx);
                        const heading = answers[q.id] ?? "";
                        const headingIndex = heading ? answerOptions.indexOf(heading) : -1;
                        const isActive = q.id === active.id;
                        const image = resolveUploadUrl(passage?.imageUrl);
                        const words = passage?.content ? wordCount(passage.content) : 0;
                        return (
                            <li
                                key={q.id}
                                ref={(el) => {
                                    cardRefs.current[q.id] = el;
                                }}
                                className="anim-fade-up scroll-mt-24"
                                style={{ animationDelay: `${idx * 60}ms` }}
                            >
                                <article
                                    aria-label={`Text ${numberOf(q)}`}
                                    className={cn(
                                        "overflow-hidden rounded-3xl bg-card shadow-card ring-2 transition",
                                        isActive ? c.ring : "ring-transparent",
                                    )}
                                >
                                    <div className={cn("flex items-center gap-3 px-5 py-3", c.soft)}>
                                        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white", c.solid)}>
                                            {numberOf(q)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-bold text-foreground">{passage?.label ?? `Text ${numberOf(q)}`}</p>
                                            {words > 0 && (
                                                <p className="flex items-center gap-1 text-xs text-foreground/55">
                                                    <Clock className="size-3" aria-hidden="true" />
                                                    {words} Wörter · ca. {Math.max(1, Math.round(words / 150))} Min.
                                                </p>
                                            )}
                                        </div>
                                        {!isActive && !heading && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveId(q.id)}
                                                className={cn("cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition hover:opacity-80", c.text, c.soft)}
                                            >
                                                Überschrift wählen
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-3 px-5 py-4">
                                        {image && <img src={image} alt="" className="max-h-52 w-full rounded-2xl object-cover" />}
                                        {passage?.content && <LessonMarkdown content={passage.content} className="text-[15px] leading-relaxed text-foreground/85" />}
                                    </div>

                                    <div className="px-5 pb-5">
                                        {heading ? (
                                            <div className={cn("anim-pop flex items-center gap-3 rounded-2xl p-3 text-white", c.solid)}>
                                                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/25 text-sm font-extrabold">
                                                    {headingIndex >= 0 ? labelFor(headingIndex) : "?"}
                                                </span>
                                                <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">{heading}</p>
                                                <button
                                                    type="button"
                                                    disabled={disabled}
                                                    onClick={() => onAnswer(q.id, "")}
                                                    aria-label={`Überschrift von Text ${numberOf(q)} entfernen`}
                                                    className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/20 transition hover:bg-white/35 disabled:cursor-default disabled:opacity-50"
                                                >
                                                    <X className="size-4" aria-hidden="true" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setActiveId(q.id)}
                                                className={cn(
                                                    "flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-3 text-sm font-medium transition",
                                                    isActive ? `${c.border} ${c.soft} ${c.text}` : "border-border text-foreground/50 hover:border-foreground/30",
                                                )}
                                            >
                                                <ChevronsDown className="size-4 lg:-rotate-90" aria-hidden="true" />
                                                <span className="lg:hidden">Welche Überschrift passt zu Text {numberOf(q)}?</span>
                                                <span className="hidden lg:inline">Welche Überschrift passt? Wähle rechts.</span>
                                            </button>
                                        )}

                                        {/* On a phone the heading list opens inside the active text, so nothing needs scrolling back. */}
                                        {isActive && <div className="mt-3 lg:hidden">{headingList}</div>}
                                    </div>
                                </article>
                            </li>
                        );
                    })}
                </ol>

                <aside aria-label="Überschriften" className="hidden rounded-3xl bg-card p-5 shadow-card ring-1 ring-border/60 lg:sticky lg:top-20 lg:block">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="font-bold text-foreground">Überschriften</p>
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", colorAt(activeIndex).soft, colorAt(activeIndex).text)}>
                            für Text {numberOf(active)}
                        </span>
                    </div>
                    {headingList}
                </aside>
            </div>

            {allDone && (
                <div className="anim-pop flex items-center gap-3 rounded-2xl bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) p-4 text-white shadow-md">
                    <PartyPopper className="size-6 shrink-0" aria-hidden="true" />
                    <p className="text-sm font-semibold">Alle Texte haben eine Überschrift. Lies noch einmal drüber und gib dann deine Antworten ab.</p>
                </div>
            )}
        </div>
    );
}

/** The shared heading pool. Used headings stay clickable (they move to the active text) and show who holds them. */
function HeadingList({
    options,
    labelFor,
    active,
    answers,
    holderOf,
    numberOf,
    colorOf,
    disabled,
    onChoose,
}: Readonly<{
    options: string[];
    labelFor: (index: number) => string;
    active: ExamQuestionPublic;
    answers: Record<string, string>;
    holderOf: (heading: string) => ExamQuestionPublic | undefined;
    numberOf: (q: ExamQuestionPublic) => number;
    colorOf: (q: ExamQuestionPublic) => (typeof COLORS)[number];
    disabled: boolean;
    onChoose: (heading: string) => void;
}>) {
    return (
        <div role="group" aria-label={`Überschrift für Text ${numberOf(active)} wählen`} className="space-y-2">
            <p className="text-xs text-foreground/55">Nicht jede Überschrift passt zu einem Text.</p>
            {options.map((option, i) => {
                const holder = holderOf(option);
                const selected = answers[active.id] === option;
                const taken = Boolean(holder) && !selected;
                const hc = holder ? colorOf(holder) : null;
                return (
                    <button
                        key={option}
                        type="button"
                        disabled={disabled}
                        aria-pressed={selected}
                        aria-label={`${labelFor(i)}) ${option}${taken && holder ? `, schon für Text ${numberOf(holder)} gewählt` : ""}`}
                        onClick={() => onChoose(option)}
                        className={cn(
                            "flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left text-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default",
                            selected && hc
                                ? `${hc.border} ${hc.soft} text-foreground`
                                : taken
                                    ? "border-border/50 bg-muted/40 text-foreground/50 hover:border-primary/40"
                                    : "border-border/60 bg-background text-foreground hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-card",
                        )}
                    >
                        <span
                            aria-hidden="true"
                            className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold",
                                hc ? `${hc.solid} text-white` : "bg-accent text-primary",
                            )}
                        >
                            {labelFor(i)}
                        </span>
                        <span className="min-w-0 flex-1 break-words leading-snug">{option}</span>
                        {holder && hc && (
                            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-bold", hc.soft, hc.text)}>
                                Text {numberOf(holder)}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
