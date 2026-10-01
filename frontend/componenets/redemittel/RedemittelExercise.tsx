"use client";

import { useState } from "react";
import { ArrowRight, Check, CircleHelp } from "lucide-react";
import { RedemittelAnswer, RedemittelExercise as Exercise, RedemittelExerciseType } from "@/types/redemittel";
import { inDays } from "./redemittelMeta";

const TYPE_LABELS: Record<RedemittelExerciseType, string> = {
    MEANING: "Verstehen",
    FUNCTION: "Funktion",
    FILL_BLANK: "Ergänzen",
    CLOZE: "Lückentext",
    SITUATION: "Situation",
    WORD_ORDER: "Wortreihenfolge",
    PRODUCTION: "Eigener Satz",
};

interface Props {
    exercise: Exercise;
    /** Submits the answer (option id or text) and resolves with the grading. */
    onAnswer: (answer: string) => Promise<RedemittelAnswer>;
    onNext: () => void;
    isLast: boolean;
    /** Review answers move the schedule, so the result also tells when the next review is. */
    showSchedule?: boolean;
}

const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 cursor-pointer";

/**
 * One reusable exercise for every Redemittel type, used by both practice and review. Feedback is
 * always text + icon (never colour alone) and stays encouraging; the next step is the learner's call.
 */
export default function RedemittelExercise({ exercise, onAnswer, onNext, isLast, showSchedule }: Readonly<Props>) {
    const [selected, setSelected] = useState<string | null>(null);
    const [text, setText] = useState("");
    const [result, setResult] = useState<RedemittelAnswer | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (answer: string) => {
        if (submitting || result) return;
        setSubmitting(true);
        setError(null);
        try {
            setResult(await onAnswer(answer));
        } catch {
            setError("Die Antwort konnte nicht gespeichert werden. Bitte versuche es noch einmal.");
            setSelected(null);
        } finally {
            setSubmitting(false);
        }
    };

    const isProduction = exercise.type === "PRODUCTION";
    const isWordOrder = exercise.type === "WORD_ORDER";
    const isChoice = Boolean(exercise.options) && !isWordOrder;
    // Word order: indexes of the words the learner has placed, in order.
    const [placed, setPlaced] = useState<number[]>([]);
    const words = exercise.options ?? [];
    const good = result?.correct;

    return (
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{TYPE_LABELS[exercise.type]}</p>
            <p className="mt-3 whitespace-pre-line break-words text-lg font-semibold leading-relaxed text-foreground sm:text-xl">{exercise.prompt}</p>

            {isProduction && exercise.phrase && (
                <p className="mt-4 rounded-lg bg-accent/50 px-4 py-3 text-lg font-semibold text-foreground">„{exercise.phrase} …“</p>
            )}
            {isProduction && exercise.topic && (
                <p className="mt-3 text-sm text-foreground/70">
                    <span className="font-semibold text-foreground/80">Thema: </span>
                    {exercise.topic}
                </p>
            )}

            {isWordOrder && (
                <div className="mt-5">
                    <div
                        aria-label="Dein Satz"
                        className="flex min-h-14 flex-wrap items-center gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-2"
                    >
                        {placed.length === 0 && <span className="text-sm text-foreground/45">Tippe die Wörter in der richtigen Reihenfolge an …</span>}
                        {placed.map((wordIndex, position) => (
                            <button
                                key={`${wordIndex}-${position}`}
                                type="button"
                                disabled={result !== null}
                                onClick={() => setPlaced(placed.filter((_, i) => i !== position))}
                                className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
                            >
                                {words[wordIndex].text}
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Wörter">
                        {words.map((word, wordIndex) =>
                            placed.includes(wordIndex) ? null : (
                                <button
                                    key={word.id}
                                    type="button"
                                    disabled={result !== null}
                                    onClick={() => setPlaced([...placed, wordIndex])}
                                    className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-card transition hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
                                >
                                    {word.text}
                                </button>
                            ),
                        )}
                    </div>
                    {result === null && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                disabled={placed.length !== words.length || submitting}
                                onClick={() => void submit(placed.map((i) => words[i].text).join(" "))}
                                className={primaryButton}
                            >
                                Prüfen
                            </button>
                            <button
                                type="button"
                                disabled={placed.length === 0}
                                onClick={() => setPlaced([])}
                                className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-40 cursor-pointer"
                            >
                                Zurücksetzen
                            </button>
                        </div>
                    )}
                </div>
            )}

            {isChoice && (
                <ul className="mt-5 space-y-2.5" aria-label="Antwortmöglichkeiten">
                    {words.map((option, i) => {
                        const isChosen = selected === option.id;
                        const isRight = result !== null && option.text === result.correctAnswer;
                        const state = result === null ? "" : isRight ? "border-green-600 bg-green-500/10" : isChosen ? "border-amber-500 bg-amber-500/10" : "opacity-60";
                        return (
                            <li key={option.id}>
                                <button
                                    type="button"
                                    disabled={result !== null || submitting}
                                    onClick={() => {
                                        setSelected(option.id);
                                        void submit(option.id);
                                    }}
                                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                                        result === null ? "border-border/60 hover:border-primary/50 hover:bg-accent cursor-pointer" : state
                                    }`}
                                >
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary" aria-hidden="true">
                                        {String.fromCharCode(65 + i)}
                                    </span>
                                    <span className="min-w-0 flex-1 break-words">{option.text}</span>
                                    {result !== null && isRight && <Check className="size-4 shrink-0 text-green-700" aria-label="Richtig" />}
                                    {result !== null && !isRight && isChosen && <CircleHelp className="size-4 shrink-0 text-amber-600" aria-label="Deine Antwort" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {!exercise.options && (
                <form
                    className="mt-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (text.trim()) void submit(text.trim());
                    }}
                >
                    <label htmlFor="redemittel-answer" className="sr-only">
                        {isProduction ? "Dein Satz" : exercise.type === "CLOZE" ? "Fehlendes Redemittel" : "Fehlendes Wort"}
                    </label>
                    {isProduction ? (
                        <textarea
                            id="redemittel-answer"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={result !== null}
                            rows={3}
                            placeholder="Schreibe deinen Satz …"
                            className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-base text-foreground outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-70"
                        />
                    ) : (
                        <input
                            id="redemittel-answer"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={result !== null}
                            autoComplete="off"
                            autoCapitalize="off"
                            placeholder={exercise.type === "CLOZE" ? "Redemittel eintippen …" : "Fehlendes Wort …"}
                            className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-base text-foreground outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-70"
                        />
                    )}
                    {result === null && (
                        <button type="submit" disabled={!text.trim() || submitting} className={`${primaryButton} mt-3`}>
                            {isProduction ? "Abschicken" : "Prüfen"}
                        </button>
                    )}
                </form>
            )}

            {error && (
                <p role="alert" className="mt-4 text-sm text-foreground/70">
                    {error}
                </p>
            )}

            {result && (
                <div role="status" aria-live="polite" className="mt-5 space-y-2 rounded-xl bg-accent/50 px-4 py-3.5 text-sm text-foreground/85">
                    {result.attempted ? (
                        <>
                            <p className="font-semibold text-foreground">✓ Gut gemacht – du hast das Redemittel selbst verwendet.</p>
                            {result.modelAnswer && (
                                <p>
                                    <span className="font-semibold">So kann es klingen: </span>„{result.modelAnswer}“
                                </p>
                            )}
                        </>
                    ) : good ? (
                        <p className="font-semibold text-foreground">✓ Richtig!</p>
                    ) : (
                        <>
                            <p className="font-semibold text-foreground">✗ Noch einmal üben</p>
                            {result.correctAnswer && (
                                <p>
                                    <span className="font-semibold">Richtig wäre: </span>
                                    {result.correctAnswer}
                                </p>
                            )}
                        </>
                    )}
                    {showSchedule && result.status === "MASTERED" && <p>Sicher gelernt – keine weitere Wiederholung nötig.</p>}
                    {showSchedule && result.status !== "MASTERED" && result.nextReviewInDays !== null && (
                        <p>
                            {good || result.attempted
                                ? `Nächste Wiederholung: ${inDays(result.nextReviewInDays)}`
                                : "Dieses Redemittel wird morgen erneut wiederholt."}
                        </p>
                    )}
                </div>
            )}

            {result && (
                <div className="mt-5 flex justify-end">
                    <button type="button" onClick={onNext} className={primaryButton} autoFocus>
                        {isLast ? "Fertig" : "Weiter"}
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                </div>
            )}
        </div>
    );
}
