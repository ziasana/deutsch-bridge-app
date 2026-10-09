"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, PartyPopper, Search } from "lucide-react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { cn } from "@/lib/utils";
import { ExamPassagePublic, ExamQuestionPublic } from "@/types/exam";
import { readingColorAt as colorAt } from "./readingColors";

/** The answer stored for "no advertisement fits" (the "x" on the answer sheet). */
export const NO_AD_ANSWER = "X";

interface Props {
    passages: ExamPassagePublic[];
    questions: ExamQuestionPublic[];
    /** questionId -> passage id (an advertisement) or {@link NO_AD_ANSWER}. */
    answers: Record<string, string>;
    disabled: boolean;
    onAnswer: (questionId: string, value: string) => void;
}

const navButton =
    "inline-flex cursor-pointer items-center justify-center gap-1 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-40";

/**
 * Lesen Teil 3: situations matched to advertisements. Every situation has its own colour; the active one sits in a
 * gradient card with the choice tiles (a-l, x) beside the advertisement cards, so the learner never scrolls back and
 * forth. A chosen advertisement turns into the situation's colour. Each ad can be used once - a used ad shows which
 * situation holds it and can be taken over by the active situation. A sticky strip shows progress and jumps anywhere.
 */
export default function LesenTeil3Board({ passages, questions, answers, disabled, onAnswer }: Readonly<Props>) {
    const [activeId, setActiveId] = useState<string | null>(questions[0]?.id ?? null);
    const panelRef = useRef<HTMLDivElement>(null);
    const active = questions.find((q) => q.id === activeId) ?? questions[0];
    const activeIndex = active ? questions.indexOf(active) : -1;

    const numberOf = (q: ExamQuestionPublic) => q.questionNumber ?? questions.indexOf(q) + 11;
    const labelOf = (passageId: string | undefined) =>
        !passageId ? null : passageId === NO_AD_ANSWER ? "x" : (passages.find((p) => p.id === passageId)?.label ?? "?");
    const usedBy = (passageId: string) => questions.find((q) => answers[q.id] === passageId);
    const colorOfQuestion = (q: ExamQuestionPublic) => colorAt(questions.indexOf(q));
    const answeredCount = questions.filter((q) => answers[q.id]).length;
    const allDone = questions.length > 0 && answeredCount === questions.length;

    // Keep the active situation in view on small screens when moving through the list.
    const firstRender = useRef(true);
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        if (activeId && window.matchMedia?.("(max-width: 1023px)")?.matches) {
            panelRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
        }
    }, [activeId]);

    if (!active) return null;
    const activeColor = colorOfQuestion(active);

    const choose = (value: string) => {
        // Choosing the ad that another situation already holds moves it over (one use per advertisement).
        if (value !== NO_AD_ANSWER) {
            const holder = usedBy(value);
            if (holder && holder.id !== active.id) onAnswer(holder.id, "");
        }
        onAnswer(active.id, answers[active.id] === value ? "" : value);
        if (answers[active.id] !== value) {
            const next = questions.slice(activeIndex + 1).find((q) => !answers[q.id]) ?? questions.find((q) => q.id !== active.id && !answers[q.id]);
            if (next) setActiveId(next.id);
        }
    };

    const tile =
        "relative flex size-11 cursor-pointer items-center justify-center rounded-xl border-2 text-base font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-50";

    return (
        <div className="space-y-4">
            <div className="sticky top-2 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-card/95 px-4 py-2.5 shadow-card ring-1 ring-border/60 backdrop-blur">
                <nav aria-label="Situationen" className="flex flex-wrap items-center gap-1.5">
                    {questions.map((q) => {
                        const c = colorOfQuestion(q);
                        const label = labelOf(answers[q.id]);
                        return (
                            <button
                                key={q.id}
                                type="button"
                                onClick={() => setActiveId(q.id)}
                                aria-current={q.id === active.id ? "step" : undefined}
                                aria-label={`Situation ${numberOf(q)}${label ? `, Antwort ${label === "x" ? "keine Anzeige" : `Anzeige ${label}`}` : ", noch nicht beantwortet"}`}
                                className={cn(
                                    "flex h-8 min-w-8 cursor-pointer items-center justify-center gap-1 rounded-full px-2 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    label ? `${c.solid} text-white` : `border-2 border-dashed ${c.border} ${c.text} bg-transparent`,
                                    q.id === active.id && `ring-2 ring-offset-2 ring-offset-card ${c.ring}`,
                                )}
                            >
                                {numberOf(q)}
                                {label && <span className="font-semibold opacity-90">{label}</span>}
                            </button>
                        );
                    })}
                </nav>
                <div className="flex min-w-32 flex-1 items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10" role="progressbar" aria-label="Zugeordnete Situationen" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount}>
                        <div className="h-full rounded-full bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) transition-all duration-500" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums text-foreground/70">{answeredCount}/{questions.length} zugeordnet</span>
                </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
                <div ref={panelRef} className="lg:sticky lg:top-20">
                    <section aria-live="polite" key={active.id} className="anim-slide-in overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-border/60">
                        <div className="relative overflow-hidden bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) px-5 py-4 text-white">
                            <span aria-hidden="true" className="absolute -end-6 -top-8 size-28 rounded-full bg-white/10" />
                            <div className="relative flex items-center gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                                    <Search className="size-5" aria-hidden="true" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                                        Situation {numberOf(active)} · {activeIndex + 1} von {questions.length}
                                    </p>
                                    <p className="text-sm font-semibold text-white/95">Welche Anzeige passt?</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 p-5">
                            <p className={cn("rounded-2xl border-s-4 p-4 text-base font-medium leading-relaxed text-foreground", activeColor.border, activeColor.soft)}>
                                {active.prompt}
                            </p>

                            <div role="group" aria-label={`Anzeige für Situation ${numberOf(active)} wählen`} className="flex flex-wrap gap-2">
                                {passages.map((p) => {
                                    const holder = usedBy(p.id);
                                    const selected = answers[active.id] === p.id;
                                    const hc = holder ? colorOfQuestion(holder) : null;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            disabled={disabled}
                                            aria-pressed={selected}
                                            aria-label={`Anzeige ${p.label}${holder && !selected ? `, schon für Situation ${numberOf(holder)} gewählt` : ""}`}
                                            onClick={() => choose(p.id)}
                                            className={cn(
                                                tile,
                                                selected && hc
                                                    ? `anim-pop ${hc.solid} border-transparent text-white shadow-md`
                                                    : hc
                                                        ? `${hc.border} ${hc.soft} ${hc.text}`
                                                        : "border-border bg-background text-foreground hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-card",
                                            )}
                                        >
                                            {p.label}
                                            {hc && !selected && holder && (
                                                <span className={cn("absolute -end-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white", hc.solid)}>
                                                    {numberOf(holder) % 100}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                                <button
                                    type="button"
                                    disabled={disabled}
                                    aria-pressed={answers[active.id] === NO_AD_ANSWER}
                                    aria-label="x: keine passende Anzeige"
                                    onClick={() => choose(NO_AD_ANSWER)}
                                    className={cn(
                                        tile,
                                        answers[active.id] === NO_AD_ANSWER
                                            ? `anim-pop ${activeColor.solid} border-transparent text-white shadow-md`
                                            : "border-dashed border-border bg-background text-foreground/70 hover:border-primary/50",
                                    )}
                                >
                                    x
                                </button>
                            </div>
                            <p className="text-xs text-foreground/55">Jede Anzeige nur einmal. Passt keine Anzeige, wähle x.</p>

                            <div className="flex justify-between gap-2">
                                <button type="button" className={navButton} disabled={activeIndex <= 0} onClick={() => setActiveId(questions[activeIndex - 1].id)}>
                                    <ArrowLeft className="size-4" aria-hidden="true" /> Zurück
                                </button>
                                <button type="button" className={navButton} disabled={activeIndex >= questions.length - 1} onClick={() => setActiveId(questions[activeIndex + 1].id)}>
                                    Weiter <ArrowRight className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </section>
                </div>

                <section aria-label="Anzeigen" className="grid gap-3 sm:grid-cols-2">
                    {passages.map((p, idx) => {
                        const holder = usedBy(p.id);
                        return (
                            <AdvertisementCard
                                key={p.id}
                                passage={p}
                                index={idx}
                                holderNumber={holder ? numberOf(holder) : null}
                                holderColor={holder ? colorOfQuestion(holder) : null}
                                selectedByActive={answers[active.id] === p.id}
                                activeNumber={numberOf(active)}
                                activeColor={activeColor}
                                disabled={disabled}
                                onChoose={() => choose(p.id)}
                            />
                        );
                    })}
                </section>
            </div>

            {allDone && (
                <div className="anim-pop flex items-center gap-3 rounded-2xl bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) p-4 text-white shadow-md">
                    <PartyPopper className="size-6 shrink-0" aria-hidden="true" />
                    <p className="text-sm font-semibold">Alle Situationen sind zugeordnet. Prüfe noch einmal und gib dann deine Antworten ab.</p>
                </div>
            )}
        </div>
    );
}

/** One advertisement as a notice-board card: letter badge, optional picture, the text, and a button to pick it. */
function AdvertisementCard({
    passage,
    index,
    holderNumber,
    holderColor,
    selectedByActive,
    activeNumber,
    activeColor,
    disabled,
    onChoose,
}: Readonly<{
    passage: ExamPassagePublic;
    index: number;
    holderNumber: number | null;
    holderColor: ReturnType<typeof colorAt> | null;
    selectedByActive: boolean;
    activeNumber: number;
    activeColor: ReturnType<typeof colorAt>;
    disabled: boolean;
    onChoose: () => void;
}>) {
    const image = resolveUploadUrl(passage.imageUrl);
    return (
        <article
            aria-label={`Anzeige ${passage.label}`}
            className={cn(
                "anim-fade-up flex flex-col gap-2.5 rounded-2xl bg-card p-4 shadow-card ring-2 transition",
                selectedByActive ? activeColor.ring : holderColor ? "ring-foreground/15" : "ring-transparent hover:ring-border",
                holderColor && !selectedByActive && "bg-card/70",
            )}
            style={{ animationDelay: `${index * 40}ms` }}
        >
            <div className="flex items-center justify-between gap-2">
                <span
                    className={cn(
                        "flex size-9 items-center justify-center rounded-xl text-base font-extrabold text-white",
                        selectedByActive ? activeColor.solid : holderColor ? holderColor.solid : "bg-gradient-to-br from-(--lesson-from) to-(--lesson-to)",
                    )}
                >
                    {passage.label}
                </span>
                {holderNumber != null && holderColor && (
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold", holderColor.soft, holderColor.text)}>
                        <Check className="size-3" aria-hidden="true" /> Situation {holderNumber}
                    </span>
                )}
            </div>
            {image && <img src={image} alt="" className="max-h-40 w-full rounded-xl object-cover" />}
            {passage.content && <LessonMarkdown content={passage.content} className="flex-1 text-sm leading-relaxed text-foreground/85" />}
            <button
                type="button"
                disabled={disabled}
                onClick={onChoose}
                aria-pressed={selectedByActive}
                aria-label={`Anzeige ${passage.label} für Situation ${activeNumber} ${selectedByActive ? "abwählen" : "wählen"}`}
                className={cn(
                    "mt-1 inline-flex w-full cursor-pointer items-center justify-center rounded-full border px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-50",
                    selectedByActive ? `border-transparent text-white ${activeColor.solid}` : "border-border bg-background text-foreground hover:bg-accent",
                )}
            >
                {selectedByActive ? "Gewählt" : `Für Situation ${activeNumber} wählen`}
            </button>
        </article>
    );
}
