"use client";

import { useMemo } from "react";
import { CheckCircle2, Mic } from "lucide-react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import WritingTaskCard from "@/componenets/exam/writing/WritingTaskCard";
import { SpeakingStimulus } from "@/componenets/exam/speaking/SpeakingContentView";
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
        <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm" aria-label={passage.label || `Text ${index + 1}`}>
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
        <aside className="rounded-2xl border border-primary/25 bg-primary/5 p-4" aria-label="Antwortmöglichkeiten">
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
                    className="mt-2 w-full resize-y rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
    return (
        <section id={`part-${part.key}`} className="scroll-mt-28 space-y-4" aria-label={part.label}>
            <header>
                <h3 className="text-lg font-bold text-foreground">{part.label}</h3>
                {part.previewOnly && <p className="mt-1 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">Vorbereitungszeit: Du siehst die Aufgaben schon jetzt. Antworten werden erst in der Übungszeit gespeichert.</p>}
            </header>
            {part.exercises.map((exercise, index) => {
                const start = 1 + part.exercises.slice(0, index).reduce((n, e) => n + e.questions.length, 0);
                if (part.section === "SCHRIFTLICHER_AUSDRUCK") {
                    return <WritingExercise key={exercise.ordinal} exercise={exercise} answers={answers} disabled={locked} onAnswer={onAnswer} />;
                }
                if (part.module === "ORAL") {
                    return <OralExercise key={exercise.ordinal} part={part} exercise={exercise} audioCtx={audioCtx} answers={answers} disabled={locked} onAnswer={onAnswer} />;
                }
                return <ObjectiveExercise key={exercise.ordinal} audioCtx={audioCtx} partKey={part.key} startNumber={start} exercise={exercise} answers={answers} disabled={locked} onAnswer={onAnswer} />;
            })}
        </section>
    );
}
