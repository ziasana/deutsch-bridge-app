"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Headphones, Mic, PenLine } from "lucide-react";
import HoerenBoard from "@/componenets/exam/HoerenBoard";
import LesenTeil1Board from "@/componenets/exam/LesenTeil1Board";
import LesenTextPanel from "@/componenets/exam/LesenTextPanel";
import LesenTeil3Board from "@/componenets/exam/LesenTeil3Board";
import SprachbausteineClozeBoard, { hasGapText } from "@/componenets/exam/SprachbausteineClozeBoard";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import WritingTaskCard from "@/componenets/exam/writing/WritingTaskCard";
import { SpeakingStimulus } from "@/componenets/exam/speaking/SpeakingContentView";
import { formatPoints } from "@/lib/examSimulation";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { cn } from "@/lib/utils";
import type { ExamPassagePublic } from "@/types/exam";
import type { ExercisePublic, PartState, SavedAnswer } from "@/types/examSimulation";
import SimQuestionField, { optionLabel } from "./SimQuestionField";
import SimAudio from "./SimAudio";

export const WRITING_TEXT_ID = "__text";
export const DONE_ID = "__done";

export function countWords(text: string): number {
    const trimmed = text.trim();
    return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

interface Props {
    attemptId: string;
    part: PartState;
    answers: Record<string, SavedAnswer>;
    disabled: boolean;
    onAnswer: (questionId: string, answer: string | null, flagged: boolean) => void;
}

interface AudioContext {
    attemptId: string;
    partKey: string;
    maxPlays: number | null;
    plays: Record<string, number>;
    disabled: boolean;
}

function PassageBlock({ passage, index, audioCtx }: Readonly<{ passage: ExamPassagePublic; index: number; audioCtx: AudioContext }>) {
    const audio = resolveUploadUrl(passage.audioUrl);
    const image = resolveUploadUrl(passage.imageUrl);
    return (
        <article className="rounded-3xl bg-card p-5 shadow-card ring-1 ring-border/60" aria-label={passage.label || `Text ${index + 1}`}>
            {passage.label && <h4 className="mb-2 text-sm font-bold text-foreground">{passage.label}</h4>}
            {audio && (
                <SimAudio attemptId={audioCtx.attemptId} partKey={audioCtx.partKey} passageId={passage.id} src={audio} maxPlays={audioCtx.maxPlays}
                    initialPlaysUsed={audioCtx.plays[passage.id] ?? 0} disabled={audioCtx.disabled} />
            )}
            {image && <img src={image} alt="" className="my-3 max-w-full rounded-xl" />}
            {passage.content && <LessonMarkdown content={passage.content} className="text-sm leading-relaxed text-foreground/85" />}
        </article>
    );
}

/** The shared answer pool (headlines / word bank) of matching and cloze tasks. */
function OptionPool({ exercise }: Readonly<{ exercise: ExercisePublic }>) {
    const options = exercise.answerOptions ?? [];
    if (options.length === 0) return null;
    return (
        <aside className="rounded-3xl border border-primary/25 bg-primary/5 p-5" aria-label="Antwortmöglichkeiten">
            <h4 className="text-sm font-bold text-foreground">Zur Auswahl</h4>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {options.map((o, i) => (
                    <li key={`${o}-${i}`} className="flex gap-2 text-sm text-foreground/85">
                        <span className="font-semibold text-primary">{optionLabel(exercise, i)}</span>
                        <span>{o}</span>
                    </li>
                ))}
            </ul>
        </aside>
    );
}

/**
 * Hörverstehen of the exam looks and answers exactly like the Übung (HoerenBoard): every statement is judged Richtig (+) or
 * Falsch (-). The exam only swaps in its own audio player, which counts and limits the plays on the server.
 */
function ListeningExercise({ part, exercise, answers, disabled, onAnswer, audioCtx, startNumber }: Readonly<{ part: PartState; exercise: ExercisePublic; audioCtx: AudioContext; startNumber: number } & Omit<Props, "part" | "attemptId">>) {
    const values = useMemo(() => Object.fromEntries(exercise.questions.map((q) => [q.id, answers[q.id]?.answer ?? ""])), [exercise, answers]);
    const flags = useMemo(() => Object.fromEntries(exercise.questions.map((q) => [q.id, answers[q.id]?.flagged ?? false])), [exercise, answers]);
    const numbered = useMemo(() => exercise.questions.map((q, i) => ({ ...q, questionNumber: q.questionNumber ?? startNumber + i })), [exercise, startNumber]);
    return (
        <HoerenBoard
            teil={part.teil}
            passages={exercise.passages}
            questions={numbered}
            answerOptions={exercise.answerOptions ?? []}
            answers={values}
            flagged={flags}
            disabled={disabled}
            showIntro={false}
            stickyClassName="top-24"
            anchorPrefix="q-"
            doneMessage="Alle Aussagen dieses Teils sind beantwortet."
            onAnswer={(questionId, value) => onAnswer(questionId, value === "" ? null : value, flags[questionId] ?? false)}
            onToggleFlag={(questionId) => onAnswer(questionId, answers[questionId]?.answer ?? null, !(flags[questionId] ?? false))}
            renderAudio={(passage, src) => (
                <SimAudio attemptId={audioCtx.attemptId} partKey={audioCtx.partKey} passageId={passage.id} src={src} maxPlays={audioCtx.maxPlays}
                    initialPlaysUsed={audioCtx.plays[passage.id] ?? 0} disabled={audioCtx.disabled} />
            )}
        />
    );
}

/** Answers of a board that works with plain values: questionId -> value, "" = not answered (as the Übung boards expect). */
function useBoardAnswers(exercise: ExercisePublic, answers: Record<string, SavedAnswer>, startNumber: number) {
    const values = useMemo(() => Object.fromEntries(exercise.questions.map((q) => [q.id, answers[q.id]?.answer ?? ""])), [exercise, answers]);
    const questions = useMemo(() => exercise.questions.map((q, i) => ({ ...q, questionNumber: q.questionNumber ?? startNumber + i })), [exercise, startNumber]);
    return { values, questions };
}

/** Lesen Teil 1 (headings matched to texts) with the Übung's board. */
function HeadingMatchingExercise({ exercise, answers, disabled, onAnswer, startNumber }: Readonly<{ exercise: ExercisePublic; startNumber: number } & Omit<Props, "part" | "attemptId">>) {
    const { values, questions } = useBoardAnswers(exercise, answers, startNumber);
    return (
        <LesenTeil1Board
            passages={exercise.passages}
            questions={questions}
            answerOptions={exercise.answerOptions ?? []}
            answerOptionLabels={exercise.answerOptionLabels ?? []}
            answers={values}
            disabled={disabled}
            stickyClassName="top-24"
            asideStickyClassName="lg:top-44"
            onAnswer={(questionId, value) => onAnswer(questionId, value === "" ? null : value, answers[questionId]?.flagged ?? false)}
        />
    );
}

/**
 * Lesen Teil 2 like the Übung: the text on a "magazine page" with the marker pens on top, and the questions one at a time
 * below it, with a numbered strip to jump between them.
 */
function ReadingChoiceExercise({ exercise, answers, disabled, onAnswer, startNumber }: Readonly<{ exercise: ExercisePublic; startNumber: number } & Omit<Props, "part" | "attemptId">>) {
    const [activeId, setActiveId] = useState(exercise.questions[0]?.id ?? "");
    const index = Math.max(0, exercise.questions.findIndex((q) => q.id === activeId));
    const question = exercise.questions[index];

    // The exam's side navigation asks for a question by id.
    useEffect(() => {
        const onGoto = (e: Event) => {
            const id = (e as CustomEvent<string>).detail;
            if (exercise.questions.some((q) => q.id === id)) setActiveId(id);
        };
        window.addEventListener("exam:goto", onGoto);
        return () => window.removeEventListener("exam:goto", onGoto);
    }, [exercise.questions]);

    if (!question) return null;
    const numberOf = (i: number) => exercise.questions[i].questionNumber ?? startNumber + i;
    const saved = answers[question.id];
    const nav = "inline-flex cursor-pointer items-center gap-1 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-foreground transition hover:bg-accent disabled:cursor-default disabled:opacity-40";
    return (
        <div className="space-y-5">
            <LesenTextPanel passages={exercise.passages} />
            <div className="space-y-3">
                <nav aria-label="Fragen" className="flex flex-wrap items-center gap-2">
                    {exercise.questions.map((q, i) => {
                        const done = !!answers[q.id]?.answer;
                        return (
                            <button
                                key={q.id}
                                type="button"
                                onClick={() => setActiveId(q.id)}
                                aria-current={i === index ? "step" : undefined}
                                aria-label={`Frage ${numberOf(i)}${done ? " (beantwortet)" : ""}`}
                                className={cn(
                                    "flex size-8 cursor-pointer items-center justify-center rounded-full text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    done ? "bg-primary text-primary-foreground" : "border-2 border-dashed border-primary/40 text-primary",
                                    i === index && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                )}
                            >
                                {done ? <Check className="size-4" strokeWidth={3} aria-hidden /> : numberOf(i)}
                            </button>
                        );
                    })}
                </nav>
                <ul key={question.id} className="anim-slide-in p-0">
                    <SimQuestionField
                        exercise={exercise}
                        question={question}
                        number={numberOf(index)}
                        value={saved?.answer ?? null}
                        flagged={saved?.flagged ?? false}
                        disabled={disabled}
                        onChange={(value) => onAnswer(question.id, value, saved?.flagged ?? false)}
                        onToggleFlag={() => onAnswer(question.id, saved?.answer ?? null, !(saved?.flagged ?? false))}
                    />
                </ul>
                <div className="flex justify-between gap-2">
                    <button type="button" className={nav} disabled={index <= 0} onClick={() => setActiveId(exercise.questions[index - 1].id)}>
                        <ArrowLeft className="size-4" aria-hidden /> Zurück
                    </button>
                    <button type="button" className={cn(nav, saved?.answer && index < exercise.questions.length - 1 && "border-transparent bg-primary text-primary-foreground hover:bg-primary/90")} disabled={index >= exercise.questions.length - 1} onClick={() => setActiveId(exercise.questions[index + 1].id)}>
                        Weiter <ArrowRight className="size-4" aria-hidden />
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Lesen Teil 3 (situations and advertisements) with the Übung's board; the exam only collects the choices. */
function SituationMatchingExercise({ exercise, answers, disabled, onAnswer, startNumber }: Readonly<{ exercise: ExercisePublic; startNumber: number } & Omit<Props, "part" | "attemptId">>) {
    const { values, questions } = useBoardAnswers(exercise, answers, startNumber);
    return (
        <LesenTeil3Board
            passages={exercise.passages}
            questions={questions}
            answers={values}
            disabled={disabled}
            stickyClassName="top-24"
            panelStickyClassName="lg:top-44"
            onAnswer={(questionId, value) => onAnswer(questionId, value === "" ? null : value, answers[questionId]?.flagged ?? false)}
        />
    );
}

/** Sprachbausteine (running text with gaps; Teil 2 with a shared word bank) with the Übung's board. */
function GapTextExercise({ exercise, answers, disabled, onAnswer, startNumber }: Readonly<{ exercise: ExercisePublic; startNumber: number } & Omit<Props, "part" | "attemptId">>) {
    const { values, questions } = useBoardAnswers(exercise, answers, startNumber);
    const wordBank = exercise.taskType === "WORD_BANK_CLOZE" ? { options: exercise.answerOptions ?? [], labels: exercise.answerOptionLabels ?? [] } : undefined;
    return (
        <SprachbausteineClozeBoard
            passages={exercise.passages}
            questions={questions}
            answers={values}
            disabled={disabled}
            wordBank={wordBank}
            stickyClassName="top-24"
            dockClassName="bottom-20"
            onAnswer={(questionId, value) => onAnswer(questionId, value === "" ? null : value, answers[questionId]?.flagged ?? false)}
        />
    );
}

function ObjectiveExercise({ exercise, answers, disabled, onAnswer, partKey, startNumber, audioCtx }: Readonly<{ exercise: ExercisePublic; partKey: string; startNumber: number; audioCtx: AudioContext } & Omit<Props, "part" | "attemptId">>) {
    // Passages that questions point at are shown right before their first question; the rest (running texts, ads) up front.
    const { upfront, before } = useMemo(() => {
        const referenced = new Set(exercise.questions.map((q) => q.sectionIndex).filter((i): i is number => i != null));
        const shownBefore = new Map<string, number>();
        const seen = new Set<number>();
        for (const q of exercise.questions) {
            if (q.sectionIndex != null && !seen.has(q.sectionIndex)) {
                seen.add(q.sectionIndex);
                shownBefore.set(q.id, q.sectionIndex);
            }
        }
        return { upfront: exercise.passages.map((p, i) => ({ p, i })).filter(({ i }) => !referenced.has(i)), before: shownBefore };
    }, [exercise]);

    return (
        <div className="space-y-4">
            {exercise.teilDescription && <LessonMarkdown content={exercise.teilDescription} className="text-sm text-foreground/70" />}
            {upfront.map(({ p, i }) => (
                <PassageBlock key={p.id} passage={p} index={i} audioCtx={audioCtx} />
            ))}
            <OptionPool exercise={exercise} />
            <ol className="space-y-3 p-0">
                {exercise.questions.map((q, idx) => {
                    const passageIndex = before.get(q.id);
                    const saved = answers[q.id];
                    return (
                        <div key={q.id} className="space-y-3">
                            {passageIndex != null && exercise.passages[passageIndex] && <PassageBlock passage={exercise.passages[passageIndex]} index={passageIndex} audioCtx={audioCtx} />}
                            <SimQuestionField
                                exercise={exercise}
                                question={q}
                                number={q.questionNumber ?? startNumber + idx}
                                value={saved?.answer ?? null}
                                flagged={saved?.flagged ?? false}
                                disabled={disabled}
                                onChange={(value) => onAnswer(q.id, value, saved?.flagged ?? false)}
                                onToggleFlag={() => onAnswer(q.id, saved?.answer ?? null, !(saved?.flagged ?? false))}
                            />
                        </div>
                    );
                })}
            </ol>
            <span className="sr-only">{partKey}</span>
        </div>
    );
}

function WritingExercise({ exercise, answers, disabled, onAnswer }: Readonly<{ exercise: ExercisePublic } & Omit<Props, "part" | "attemptId">>) {
    const text = answers[WRITING_TEXT_ID]?.answer ?? "";
    const words = countWords(text);
    return (
        <div className="space-y-4">
            <WritingTaskCard passages={exercise.passages} />
            {exercise.leitpunkte && exercise.leitpunkte.length > 0 && (
                <ul className="list-disc space-y-1 rounded-2xl border border-border/70 bg-card p-4 ps-8 text-sm text-foreground/85">
                    {exercise.leitpunkte.map((l) => (
                        <li key={l}>{l}</li>
                    ))}
                </ul>
            )}
            <div>
                <label htmlFor="sim-writing" className="text-sm font-semibold text-foreground">
                    Deine Antwort
                </label>
                <textarea
                    id="sim-writing"
                    value={text}
                    disabled={disabled}
                    maxLength={20000}
                    onChange={(e) => onAnswer(WRITING_TEXT_ID, e.target.value, false)}
                    rows={16}
                    spellCheck={false}
                    className="mt-2 w-full resize-y rounded-3xl border-2 border-border bg-card p-5 text-sm shadow-card transition focus-visible:border-primary leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    placeholder="Schreibe hier deinen Text …"
                />
                <p className="mt-1 text-xs tabular-nums text-foreground/60" aria-live="polite">
                    {words} {words === 1 ? "Wort" : "Wörter"}
                </p>
            </div>
        </div>
    );
}

function OralExercise({ part, exercise, answers, disabled, onAnswer, audioCtx }: Readonly<{ part: PartState; exercise: ExercisePublic; audioCtx: AudioContext } & Omit<Props, "part" | "attemptId">>) {
    const done = answers[DONE_ID]?.answer === "true";
    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-pink-500/30 bg-pink-500/5 p-4 text-sm text-foreground/85">
                <p className="flex items-center gap-2 font-semibold text-foreground">
                    <Mic className="size-4" aria-hidden /> Mündliche Übung – sprich laut, am besten mit Partnerin oder Partner.
                </p>
                <p className="mt-1 text-foreground/70">
                    Diese Teile werden in der Simulation nicht bewertet. Markiere unten, wenn du den Teil geübt hast.
                </p>
            </div>
            {exercise.teilDescription && <LessonMarkdown content={exercise.teilDescription} className="text-sm text-foreground/70" />}
            {exercise.passages.map((p, i) => (
                <PassageBlock key={p.id} passage={p} index={i} audioCtx={audioCtx} />
            ))}
            {exercise.speaking && <SpeakingStimulus content={exercise.speaking} />}
            {!part.previewOnly && (
                <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={done}
                    onClick={() => onAnswer(DONE_ID, done ? null : "true", false)}
                    className={cn("inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition", done ? "border-green-600 bg-green-500/15 text-green-700 dark:text-green-400" : "border-border bg-card text-foreground hover:bg-accent")}
                >
                    <CheckCircle2 className="size-4" aria-hidden />
                    {done ? "Teil geübt" : "Als geübt markieren"}
                </button>
            )}
        </div>
    );
}

/** One part of the running exam: every exercise of the part, rendered for its kind. */
export default function SimExerciseView({ attemptId, part, answers, disabled, onAnswer }: Readonly<Props>) {
    const locked = disabled || part.previewOnly;
    const audioCtx: AudioContext = { attemptId, partKey: part.key, maxPlays: part.maxAudioPlays, plays: part.audioPlays ?? {}, disabled: locked };
    const isListening = part.section === "HOERVERSTEHEN" && part.module !== "ORAL";
    const questionCount = part.exercises.reduce((n, e) => n + e.questions.length, 0);
    const HeaderIcon = isListening ? Headphones : part.module === "ORAL" ? Mic : part.section === "SCHRIFTLICHER_AUSDRUCK" ? PenLine : BookOpen;
    return (
        <section id={`part-${part.key}`} className="scroll-mt-28 space-y-4" aria-label={part.label}>
            <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) p-5 text-white shadow-md">
                <span aria-hidden className="absolute -end-8 -top-10 size-36 rounded-full bg-white/10" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2.5 text-lg font-bold">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-white/20">
                            <HeaderIcon className="size-5" aria-hidden />
                        </span>
                        {part.label}
                    </h3>
                    <p className="flex flex-wrap gap-2 text-xs font-semibold">
                        {questionCount > 0 && <span className="rounded-full bg-white/20 px-3 py-1">{questionCount} {questionCount === 1 ? "Frage" : "Fragen"}</span>}
                        {part.maxPoints > 0 && part.scoringMethod !== "UNSCORED" && <span className="rounded-full bg-white/20 px-3 py-1">{formatPoints(part.maxPoints)} Punkte</span>}
                        {isListening && part.maxAudioPlays != null && <span className="rounded-full bg-white/20 px-3 py-1">Audio {part.maxAudioPlays === 1 ? "einmal" : `${part.maxAudioPlays}-mal`}</span>}
                    </p>
                </div>
                {part.previewOnly && <p className="relative mt-3 rounded-xl bg-white/20 px-3 py-2 text-sm">Vorbereitungszeit: Du siehst die Aufgaben schon jetzt. Antworten werden erst in der Übungszeit gespeichert.</p>}
            </header>
            {part.exercises.map((exercise, index) => {
                const start = 1 + part.exercises.slice(0, index).reduce((n, e) => n + e.questions.length, 0);
                if (part.section === "SCHRIFTLICHER_AUSDRUCK") {
                    return <WritingExercise key={exercise.ordinal} exercise={exercise} answers={answers} disabled={locked} onAnswer={onAnswer} />;
                }
                if (part.module === "ORAL") {
                    return <OralExercise key={exercise.ordinal} part={part} exercise={exercise} audioCtx={audioCtx} answers={answers} disabled={locked} onAnswer={onAnswer} />;
                }
                if (isListening && (exercise.answerOptions?.length ?? 0) >= 2) {
                    return <ListeningExercise key={exercise.ordinal} part={part} exercise={exercise} audioCtx={audioCtx} startNumber={start} answers={answers} disabled={locked} onAnswer={onAnswer} />;
                }
                if (part.section === "LESEVERSTEHEN" && exercise.taskType === "MATCHING" && exercise.questions.length > 0 && exercise.passages.length > 0) {
                    return <HeadingMatchingExercise key={exercise.ordinal} startNumber={start} exercise={exercise} answers={answers} disabled={locked} onAnswer={onAnswer} />;
                }
                if (part.section === "LESEVERSTEHEN" && exercise.taskType === "MULTIPLE_CHOICE" && exercise.passages.length > 0 && exercise.questions.length > 0) {
                    return <ReadingChoiceExercise key={exercise.ordinal} startNumber={start} exercise={exercise} answers={answers} disabled={locked} onAnswer={onAnswer} />;
                }
                if (exercise.taskType === "SITUATION_MATCHING" && exercise.questions.length > 0) {
                    return <SituationMatchingExercise key={exercise.ordinal} startNumber={start} exercise={exercise} answers={answers} disabled={locked} onAnswer={onAnswer} />;
                }
                if (part.section === "SPRACHBAUSTEINE" && hasGapText(exercise.passages, exercise.questions, exercise.taskType === "WORD_BANK_CLOZE")) {
                    return <GapTextExercise key={exercise.ordinal} startNumber={start} exercise={exercise} answers={answers} disabled={locked} onAnswer={onAnswer} />;
                }
                return <ObjectiveExercise key={exercise.ordinal} audioCtx={audioCtx} partKey={part.key} startNumber={start} exercise={exercise} answers={answers} disabled={locked} onAnswer={onAnswer} />;
            })}
        </section>
    );
}
