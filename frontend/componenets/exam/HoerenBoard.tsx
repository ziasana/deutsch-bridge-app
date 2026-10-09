"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Headphones, PartyPopper, X } from "lucide-react";
import AudioPlayer from "@/componenets/AudioPlayer";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { cn } from "@/lib/utils";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";
import { readingColorAt as colorAt } from "./readingColors";

interface Props {
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    /** The two answers, in order: right ("+") then wrong ("-"). */
    answerOptions: string[];
    /** questionId -> chosen option. */
    answers: Record<string, string>;
    disabled: boolean;
    onAnswer: (questionId: string, value: string) => void;
    /** Teil 3 plays one recording at a time ("Hörstation"); other Teile list the recordings (or sit beside one long recording). */
    teil?: number;
}

/**
 * Hörverstehen: every clip is a card of its own - the player and, right beneath it, the statement(s) to judge - so the
 * learner listens and decides in one place instead of matching a list of players to a list of statements. Each
 * statement has big Richtig / Falsch buttons. A sticky strip shows progress and jumps to any clip. Statements that
 * point to no clip are collected in a last card.
 */
const stepButton =
    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-40";

/** One statement with its Richtig / Falsch buttons. `compact` puts the buttons beside the text (long recording, many statements). */
function StatementItem({
    q,
    number,
    color,
    right,
    wrong,
    selected,
    disabled,
    compact = false,
    onAnswer,
}: Readonly<{
    q: ExamQuestionPublic;
    number: number;
    color: ReturnType<typeof colorAt>;
    right: string;
    wrong: string;
    selected: string;
    disabled: boolean;
    compact?: boolean;
    onAnswer: (questionId: string, value: string) => void;
}>) {
    return (
        <li
            id={`hoeren-q-${q.id}`}
            className={cn(
                "scroll-mt-24",
                compact
                    ? cn("flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-card p-4 shadow-card ring-2 transition", selected ? color.ring : "ring-transparent")
                    : "space-y-3",
            )}
        >
            <p className={cn("flex items-start gap-2.5 font-medium leading-snug text-foreground", compact && "min-w-0 flex-1 basis-60")}>
                <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-white", color.solid)}>{number}</span>
                {q.prompt}
            </p>
            <div className={cn("grid grid-cols-2 gap-3", compact && "w-full shrink-0 sm:w-72")}>
                {[
                    { value: right, label: "Richtig", icon: Check, on: "anim-pop border-emerald-500 bg-emerald-500 text-white shadow-md" },
                    { value: wrong, label: "Falsch", icon: X, on: "anim-pop border-rose-500 bg-rose-500 text-white shadow-md" },
                ].map(({ value, label, icon: Icon, on }) => (
                    <button
                        key={value}
                        type="button"
                        disabled={disabled}
                        aria-pressed={selected === value}
                        aria-label={`Aussage ${number}: ${label} (${value})`}
                        onClick={() => onAnswer(q.id, selected === value ? "" : value)}
                        className={cn(
                            "flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 px-4 text-base font-bold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-60",
                            compact ? "py-2" : "py-3",
                            selected === value ? on : "border-border bg-background text-foreground/70 hover:border-primary/50",
                        )}
                    >
                        <Icon className="size-5" strokeWidth={3} aria-hidden="true" />
                        {label}
                        <span className="text-sm font-semibold opacity-70">({value})</span>
                    </button>
                ))}
            </div>
        </li>
    );
}

export default function HoerenBoard({ passages, questions, answerOptions, answers, disabled, onAnswer, teil }: Readonly<Props>) {
    const [step, setStep] = useState(0);
    const right = answerOptions[0] ?? "+";
    const wrong = answerOptions[1] ?? "-";
    const cardRefs = useRef<Record<string, HTMLElement | null>>({});
    const numberOf = (q: ExamQuestionPublic) => q.questionNumber ?? questions.indexOf(q) + 1;
    const answeredCount = questions.filter((q) => answers[q.id]).length;
    const allDone = questions.length > 0 && answeredCount === questions.length;

    const passageIndexOf = (q: ExamQuestionPublic) => (q.sectionIndex != null && q.sectionIndex < passages.length ? q.sectionIndex : -1);
    const loose = questions.filter((q) => passageIndexOf(q) < 0);
    const cards: { key: string; title: string; passage: ExamPassagePublic | null; items: ExamQuestionPublic[] }[] = passages.map((p, i) => ({
        key: p.id,
        title: p.label,
        passage: p,
        items: questions.filter((q) => passageIndexOf(q) === i),
    }));
    if (loose.length > 0) cards.push({ key: "loose", title: "Weitere Aussagen", passage: null, items: loose });

    // One long recording with several statements (Teil 2): the player stays beside the statements while they scroll.
    const single = passages.length === 1 && questions.length > 2 && loose.length === 0;

    const wizard = teil === 3 && !single && cards.length > 1;
    const stepIndex = Math.min(step, cards.length - 1);

    const jumpTo = (q: ExamQuestionPublic) => {
        if (wizard) {
            const idx = passageIndexOf(q);
            setStep(idx >= 0 ? idx : cards.length - 1);
            return;
        }
        if (single) {
            document.getElementById(`hoeren-q-${q.id}`)?.scrollIntoView?.({ block: "center", behavior: "smooth" });
            return;
        }
        const idx = passageIndexOf(q);
        const key = idx >= 0 ? passages[idx].id : "loose";
        cardRefs.current[key]?.scrollIntoView?.({ block: "center", behavior: "smooth" });
    };

    const renderCard = (card: (typeof cards)[number], idx: number) => {
        const c = colorAt(idx);
        const audioSrc = card.passage ? resolveUploadUrl(card.passage.audioUrl) : null;
        const image = card.passage ? resolveUploadUrl(card.passage.imageUrl) : null;
        const done = card.items.length > 0 && card.items.every((q) => answers[q.id]);
        return (
            <article aria-label={card.title} className={cn("overflow-hidden rounded-3xl bg-card shadow-card ring-2 transition", done ? c.ring : "ring-transparent")}>
                <div className={cn("flex items-center gap-3 px-5 py-3", c.soft)}>
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl text-white", c.solid)}>
                        {done ? <Check className="size-5" strokeWidth={3} aria-hidden="true" /> : <Headphones className="size-5" aria-hidden="true" />}
                    </span>
                    <p className="min-w-0 flex-1 truncate font-bold text-foreground">{card.title}</p>
                    {done && <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", c.text)}>Beantwortet</span>}
                </div>

                {card.passage && (audioSrc || image || card.passage.content) && (
                    <div className="space-y-3 px-5 pt-4">
                        {audioSrc && <AudioPlayer key={audioSrc} src={audioSrc} />}
                        {image && <img src={image} alt="" className="max-h-52 w-full rounded-2xl object-cover" />}
                        {card.passage.content && <LessonMarkdown content={card.passage.content} className="text-sm text-foreground/80" />}
                    </div>
                )}

                <ul className="space-y-4 p-5">
                    {card.items.map((q) => (
                        <StatementItem key={q.id} q={q} number={numberOf(q)} color={c} right={right} wrong={wrong} selected={answers[q.id] ?? ""} disabled={disabled} onAnswer={onAnswer} />
                    ))}
                </ul>
            </article>
        );
    };

    return (
        <div className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) p-5 text-white shadow-md sm:p-6">
                <span aria-hidden="true" className="absolute -end-8 -top-10 size-40 rounded-full bg-white/10" />
                <span aria-hidden="true" className="absolute end-5 top-3 text-6xl opacity-20">🎧</span>
                <p className="relative text-xs font-bold uppercase tracking-wider text-white/80">So geht es</p>
                <ol className="relative mt-2 space-y-1 text-sm leading-relaxed text-white/95">
                    <li>1. {wizard ? "Drücke auf Play und höre den Text an. Mit „Weiter“ kommst du zum nächsten Text." : "Drücke auf Play und höre den Text an."}</li>
                    <li>2. Entscheide: Ist die Aussage richtig ({right}) oder falsch ({wrong})?</li>
                    <li>3. Am Ende gibst du alle Antworten ab und siehst dein Ergebnis.</li>
                </ol>
            </div>

            <div className="sticky top-2 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-card/95 px-4 py-2.5 shadow-card ring-1 ring-border/60 backdrop-blur">
                <nav aria-label="Aussagen" className="flex flex-wrap items-center gap-1.5">
                    {questions.map((q) => {
                        const done = Boolean(answers[q.id]);
                        return (
                            <button
                                key={q.id}
                                type="button"
                                onClick={() => jumpTo(q)}
                                aria-label={`Zu Aussage ${numberOf(q)} springen${done ? " (beantwortet)" : ""}`}
                                className={cn(
                                    "flex size-8 cursor-pointer items-center justify-center rounded-full text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    done ? "bg-primary text-primary-foreground" : "border-2 border-dashed border-primary/40 text-primary",
                                )}
                            >
                                {done ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : numberOf(q)}
                            </button>
                        );
                    })}
                </nav>
                <div className="flex min-w-32 flex-1 items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-label="Beantwortete Aussagen" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount}>
                        <div className="h-full rounded-full bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) transition-all duration-500" style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums text-foreground/70">{answeredCount}/{questions.length} beantwortet</span>
                </div>
            </div>

            {single ? (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
                    <RecordingCard passage={passages[0]} answered={answeredCount} total={questions.length} className="lg:sticky lg:top-20" />
                    <ol aria-label="Aussagen" className="space-y-3">
                        {questions.map((q) => (
                            <StatementItem key={q.id} q={q} number={numberOf(q)} color={colorAt(questions.indexOf(q))} right={right} wrong={wrong} selected={answers[q.id] ?? ""} disabled={disabled} compact onAnswer={onAnswer} />
                        ))}
                    </ol>
                </div>
            ) : wizard ? (
                <section aria-label="Hörstation" key={cards[stepIndex].key} className="anim-slide-in space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">
                            {cards[stepIndex].title} · {stepIndex + 1} von {cards.length}
                        </p>
                        <nav aria-label="Hörtexte" className="flex items-center gap-1.5">
                            {cards.map((card, idx) => {
                                const c = colorAt(idx);
                                const done = card.items.length > 0 && card.items.every((q) => answers[q.id]);
                                return (
                                    <button
                                        key={card.key}
                                        type="button"
                                        onClick={() => setStep(idx)}
                                        aria-current={idx === stepIndex ? "step" : undefined}
                                        aria-label={`${card.title}${done ? " (beantwortet)" : ""}`}
                                        className={cn(
                                            "flex size-8 cursor-pointer items-center justify-center rounded-full text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                            done ? `${c.solid} text-white` : `border-2 border-dashed ${c.border} ${c.text}`,
                                            idx === stepIndex && `ring-2 ring-offset-2 ring-offset-background ${c.ring}`,
                                        )}
                                    >
                                        {done ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : idx + 1}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                    {renderCard(cards[stepIndex], stepIndex)}
                    <div className="flex justify-between gap-2">
                        <button type="button" className={stepButton} disabled={stepIndex === 0} onClick={() => setStep(stepIndex - 1)}>
                            <ArrowLeft className="size-4" aria-hidden="true" /> Zurück
                        </button>
                        <button
                            type="button"
                            className={cn(stepButton, cards[stepIndex].items.every((q) => answers[q.id]) && stepIndex < cards.length - 1 && "border-transparent bg-primary text-primary-foreground hover:bg-primary/90")}
                            disabled={stepIndex >= cards.length - 1}
                            onClick={() => setStep(stepIndex + 1)}
                        >
                            Weiter <ArrowRight className="size-4" aria-hidden="true" />
                        </button>
                    </div>
                </section>
            ) : (
            <ol className="space-y-5">
                {cards.map((card, idx) => (
                    <li
                        key={card.key}
                        ref={(el) => {
                            cardRefs.current[card.key] = el;
                        }}
                        className="anim-fade-up scroll-mt-24"
                        style={{ animationDelay: `${idx * 60}ms` }}
                    >
                        {renderCard(card, idx)}
                    </li>
                ))}
            </ol>
            )}

            {allDone && (
                <div className="anim-pop flex items-center gap-3 rounded-2xl bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) p-4 text-white shadow-md">
                    <PartyPopper className="size-6 shrink-0" aria-hidden="true" />
                    <p className="text-sm font-semibold">Alle Aussagen sind beantwortet. Du kannst deine Antworten jetzt abgeben.</p>
                </div>
            )}
        </div>
    );
}

/** The one long recording: a big player card that stays in view beside the statements. */
function RecordingCard({ passage, answered, total, className }: Readonly<{ passage: ExamPassagePublic; answered: number; total: number; className?: string }>) {
    const audioSrc = resolveUploadUrl(passage.audioUrl);
    const image = resolveUploadUrl(passage.imageUrl);
    return (
        <article aria-label={passage.label} className={cn("overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-primary/15", className)}>
            <header className="relative overflow-hidden bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) px-5 py-4 text-white">
                <span aria-hidden="true" className="absolute -end-6 -top-8 size-28 rounded-full bg-white/10" />
                <div className="relative flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                        <Headphones className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-bold leading-tight">{passage.label}</p>
                        <p className="text-xs text-white/85">Höre zu und beantworte die Aussagen – du kannst jederzeit zurückspulen.</p>
                    </div>
                </div>
            </header>
            <div className="space-y-3 p-5">
                {audioSrc && <AudioPlayer key={audioSrc} src={audioSrc} />}
                {image && <img src={image} alt="" className="max-h-52 w-full rounded-2xl object-cover" />}
                {passage.content && <LessonMarkdown content={passage.content} className="text-sm text-foreground/80" />}
                <p className="text-center text-xs font-semibold tabular-nums text-foreground/60">{answered} von {total} Aussagen beantwortet</p>
            </div>
        </article>
    );
}
