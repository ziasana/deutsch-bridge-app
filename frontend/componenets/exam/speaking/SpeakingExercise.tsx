"use client";

import { useState } from "react";
import { Check, ChevronRight, Eye, EyeOff, Flag, Lightbulb, LifeBuoy, RotateCw, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { zeitCheckMessage } from "@/lib/examTime";
import { SpeakingContent, SpeakingGuideContent } from "@/types/exam";
import { ExamPracticeSessionResult } from "@/types/examTime";
import { hasSpeakingModel, SpeakingModel } from "./SpeakingContentView";
import SpeakingHelpDrawer, { SpeakingHelpTab } from "./SpeakingHelpDrawer";
import SpeakingStage, { stageTotal } from "./SpeakingStage";
import { partOfTaskType, SPEAKING_PARTS } from "./speakingMeta";
import { useSpeakingNotes } from "./useSpeakingNotes";

/** Two modes: Lernen (all help available) and Prüfung (no help until the attempt is finished). */
export type SpeakingMode = "LEARN" | "EXAM";

const pillPrimary =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-50";
const pillSecondary =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default disabled:opacity-60";
const card = "rounded-[10px] bg-card p-5 shadow-card sm:p-6";

const MODES: { value: SpeakingMode; label: string; hint: string }[] = [
    { value: "LEARN", label: "Lernen", hint: "Alle Hilfen verfügbar: Redemittel, Tipps und Beispielantwort." },
    { value: "EXAM", label: "Prüfung", hint: "Keine Hilfe – Redemittel, Tipps und Beispielantwort erst nach der Übung." },
];

const CONFIDENCE = [
    { value: 1, emoji: "😟" },
    { value: 2, emoji: "😕" },
    { value: 3, emoji: "😐" },
    { value: 4, emoji: "🙂" },
    { value: 5, emoji: "😄" },
];

interface SpeakingExerciseProps {
    exerciseId: string;
    content: SpeakingContent;
    /** The Lernbereich of this Teil (shared Redemittel, tips, goals, checklist); undefined while it loads or when there is none. */
    guide?: SpeakingGuideContent | null;
    /** True while the Lernbereich is still loading. */
    guideLoading?: boolean;
    level: string;
    /** Persisted: the learner marked this exercise as done (self-assessed). */
    completed: boolean;
    marking: boolean;
    onMarkCompleted: () => void;
    /** Called when the learner ends the attempt - the page stops the exercise timer here. */
    onFinish?: () => void;
    /** Called when the learner starts another attempt - the page starts a fresh timer run here. */
    onRepeat?: () => void;
    /** The finished timer run of this attempt (shown as the Zeit-Check in the review), if there was one. */
    timeResult?: ExamPracticeSessionResult | null;
}

/**
 * Mündlicher Ausdruck practice. Nothing here is graded: the learner talks (alone or with a partner), then ticks the
 * self-assessment checklist. Three different states are kept apart: opened (nothing stored), practice attempt finished (this visit)
 * and "self-assessed as done" (stored through the existing mark-completed endpoint).
 */
export default function SpeakingExercise({ exerciseId, content, guide, guideLoading = false, level, completed, marking, onMarkCompleted, onFinish, onRepeat, timeResult = null }: Readonly<SpeakingExerciseProps>) {
    const [mode, setMode] = useState<SpeakingMode>("LEARN");
    const [phase, setPhase] = useState<"PRACTICE" | "REVIEW">("PRACTICE");
    const [helpOpen, setHelpOpen] = useState(false);
    const [showModel, setShowModel] = useState(false);
    // Topics / tasks / planning points the learner has talked about in this attempt (a live aid, not stored).
    const [covered, setCovered] = useState<string[]>([]);
    const notes = useSpeakingNotes(exerciseId);

    const inReview = phase === "REVIEW";
    // The exam mode withholds help and the example answer until the attempt is finished.
    const helpVisible = mode !== "EXAM" || inReview;
    const helpTabs: SpeakingHelpTab[] = !helpVisible ? [] : ["TIPS", "PHRASES", "MISTAKES"];
    const modelOffered = helpVisible && hasSpeakingModel(content);
    const part = partOfTaskType(content.taskType);
    // The standard checklist lives in the Lernbereich; an exercise may bring its own.
    const checklist = content.selfAssessment.length > 0 ? content.selfAssessment : (guide?.selfAssessment ?? []);
    const allChecked = checklist.length > 0 && checklist.every((item) => notes.checked.includes(item));

    const changeMode = (next: SpeakingMode) => {
        setMode(next);
        if (next === "EXAM") {
            setHelpOpen(false);
            setShowModel(false);
        }
    };
    const finish = () => {
        setPhase("REVIEW");
        onFinish?.();
    };
    const repeat = () => {
        setPhase("PRACTICE");
        setShowModel(false);
        setCovered([]);
        onRepeat?.();
        if (mode === "EXAM") setHelpOpen(false);
        notes.update({ checked: [], confidence: null });
    };
    const toggleCovered = (id: string) => setCovered((current) => (current.includes(id) ? current.filter((c) => c !== id) : [...current, id]));
    const toggleItem = (item: string) =>
        notes.update({ checked: notes.checked.includes(item) ? notes.checked.filter((c) => c !== item) : [...notes.checked, item] });

    const partMeta = SPEAKING_PARTS.find((p) => p.part === part) ?? SPEAKING_PARTS[0];
    const checkedCount = checklist.filter((item) => notes.checked.includes(item)).length;
    const totalItems = stageTotal(content, guide);
    const timeMessage = timeResult ? zeitCheckMessage(timeResult) : null;

    return (
        <div className="space-y-4">
            <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 p-5 text-white shadow-md sm:p-6">
                <span aria-hidden="true" className="absolute -end-8 -top-10 size-40 rounded-full bg-white/10" />
                <span aria-hidden="true" className="absolute -bottom-12 end-24 size-32 rounded-full bg-white/10" />
                <div className="relative flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-white/80">Mündlicher Ausdruck · Teil {partMeta.part}</p>
                        <p className="mt-1 text-xl font-extrabold sm:text-2xl">{partMeta.title}</p>
                        <p className="mt-0.5 text-sm text-white/85">{partMeta.description}</p>
                    </div>
                    <div role="group" aria-label="Übungsmodus" className="inline-flex shrink-0 rounded-full bg-black/15 p-1">
                        {MODES.map((m) => (
                            <button
                                key={m.value}
                                type="button"
                                aria-pressed={mode === m.value}
                                disabled={inReview}
                                onClick={() => changeMode(m.value)}
                                className={cn(
                                    "cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-default",
                                    mode === m.value ? "bg-white text-pink-600 shadow-sm" : "text-white/85 hover:bg-white/15",
                                )}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>
                <p className="relative mt-3 text-xs text-white/80">{MODES.find((m) => m.value === mode)?.hint}</p>
                <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3">
                    <Stepper inReview={inReview} completed={completed} />
                    <StatusChips completed={completed} reviewed={inReview} />
                </div>
            </header>

            {helpTabs.length > 0 && (
                <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={helpOpen}
                    onClick={() => setHelpOpen(true)}
                    className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-primary/20 bg-card p-4 text-start shadow-card transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:scale-110">
                        <LifeBuoy className="size-6" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-base font-bold text-foreground">Redemittel &amp; Tipps</span>
                        <span className="block text-sm text-foreground/65">Fragen, Wendungen und Hinweise zu dieser Aufgabe öffnen</span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-primary transition group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
            )}

            <SpeakingStage content={content} guide={guide} covered={covered} onToggle={toggleCovered} />

            {!helpVisible && (
                <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-foreground/60">
                    Redemittel, Tipps und Beispiele sind im Prüfungsmodus ausgeblendet, bis Sie die Übung beenden.
                </p>
            )}

            {!inReview ? (
                <FinishCard covered={Math.min(covered.length, totalItems)} total={totalItems} onFinish={finish} />
            ) : (
                <section className={`${card} anim-fade-up`} aria-label="Selbsteinschätzung">
                    <div className="flex flex-wrap items-center gap-4">
                        <ScoreRing done={checkedCount} total={checklist.length} />
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-bold text-foreground">Selbsteinschätzung</h2>
                            <p className="mt-0.5 text-xs text-foreground/60">Es gibt keine Punkte – haken Sie ab, was Ihnen gelungen ist.</p>
                            {timeMessage && (
                                <p className="mt-2 inline-flex flex-wrap items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-foreground/80">
                                    <Timer className="size-3.5" aria-hidden="true" />
                                    {timeMessage.lines.join(" · ")}
                                </p>
                            )}
                        </div>
                    </div>
                    <ul className="mt-4 grid gap-2">
                        {checklist.map((item) => {
                            const checked = notes.checked.includes(item);
                            return (
                                <li key={item}>
                                    <label
                                        className={cn(
                                            "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition focus-within:ring-2 focus-within:ring-primary/50",
                                            checked ? "border-emerald-500/50 bg-emerald-500/10 text-foreground" : "border-border text-foreground/85 hover:bg-accent",
                                        )}
                                    >
                                        <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => toggleItem(item)} />
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition",
                                                checked ? "anim-pop border-emerald-500 bg-emerald-500 text-white" : "border-foreground/25 text-transparent",
                                            )}
                                        >
                                            <Check className="size-3.5" />
                                        </span>
                                        <span>{item}</span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>

                    <fieldset className="mt-5">
                        <legend className="text-sm font-semibold text-foreground">Wie sicher fühlen Sie sich? (optional)</legend>
                        <div className="mt-2 flex gap-2">
                            {CONFIDENCE.map(({ value, emoji }) => (
                                <button
                                    key={value}
                                    type="button"
                                    aria-pressed={notes.confidence === value}
                                    aria-label={`Sicherheit ${value} von 5`}
                                    onClick={() => notes.update({ confidence: notes.confidence === value ? null : value })}
                                    className={cn(
                                        "flex size-11 cursor-pointer items-center justify-center rounded-full border text-xl transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                        notes.confidence === value ? "border-primary bg-primary/15 ring-2 ring-primary/40" : "border-border grayscale hover:grayscale-0",
                                    )}
                                >
                                    <span aria-hidden="true">{emoji}</span>
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    <label className="mt-4 block">
                        <span className="text-sm font-semibold text-foreground">Notizen (optional)</span>
                        <textarea
                            className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm"
                            rows={3}
                            value={notes.notes}
                            onChange={(e) => notes.update({ notes: e.target.value })}
                            placeholder="Was möchten Sie beim nächsten Mal besser machen?"
                        />
                    </label>

                    <div className="mt-5 flex flex-wrap justify-end gap-2">
                        <button type="button" className={pillSecondary} onClick={repeat}>
                            <RotateCw className="size-4" aria-hidden="true" />
                            Übung wiederholen
                        </button>
                        <button type="button" className={pillPrimary} disabled={completed || marking} onClick={onMarkCompleted}>
                            {completed ? "Als erledigt markiert ✓" : marking ? "Wird markiert..." : allChecked ? "Als erledigt markieren" : "Trotzdem als erledigt markieren"}
                        </button>
                    </div>
                </section>
            )}

            {modelOffered && (
                <section aria-label="Beispielantwort" className="space-y-3">
                    <button
                        type="button"
                        aria-expanded={showModel}
                        aria-label={showModel ? "Beispielantwort verbergen" : "Beispielantwort anzeigen"}
                        onClick={() => setShowModel((v) => !v)}
                        className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-amber-500/50 bg-amber-500/10 p-4 text-start transition hover:-translate-y-0.5 hover:bg-amber-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                    >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 transition group-hover:scale-110 dark:text-amber-300">
                            <Lightbulb className="size-6" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-base font-bold text-foreground">{showModel ? "Beispielantwort verbergen" : "Beispielantwort anzeigen"}</span>
                            <span className="block text-sm text-foreground/65">{showModel ? "Zum Vergleichen mit Ihrer eigenen Antwort." : "Tipp: Sprechen Sie zuerst selbst – vergleichen Sie danach."}</span>
                        </span>
                        {showModel ? <EyeOff className="size-5 shrink-0 text-foreground/50" aria-hidden="true" /> : <Eye className="size-5 shrink-0 text-foreground/50" aria-hidden="true" />}
                    </button>
                    {showModel && (
                        <div className="anim-fade-up">
                            <SpeakingModel content={content} />
                        </div>
                    )}
                </section>
            )}

            <SpeakingHelpDrawer
                open={helpOpen && helpTabs.length > 0}
                onClose={() => setHelpOpen(false)}
                tabs={helpTabs}
                content={content}
                guide={guide}
                loading={guideLoading}
                level={level}
                part={part}
            />
        </div>
    );
}

/** "Finish line" of the attempt: shows how much of the task was covered and ends the attempt (stops the timer). */
function FinishCard({ covered, total, onFinish }: Readonly<{ covered: number; total: number; onFinish: () => void }>) {
    const allCovered = total > 0 && covered === total;
    return (
        <div className="relative overflow-hidden rounded-2xl bg-card p-4 shadow-card sm:p-5">
            <span aria-hidden="true" className="pointer-events-none absolute -end-6 -top-8 size-28 rounded-full bg-gradient-to-br from-pink-500/15 to-orange-400/15" />
            <div className="relative flex flex-wrap items-center gap-4">
                <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm", allCovered ? "bg-emerald-500" : "bg-gradient-to-br from-pink-500 to-orange-400")}>
                    <Flag className="size-6" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-foreground">{allCovered ? "Alles besprochen – prima!" : "Fertig mit dem Gespräch?"}</p>
                    <p className="text-sm text-foreground/65">
                        {total > 0 && <span className="font-semibold text-foreground/80">{covered} von {total} besprochen · </span>}
                        Beenden stoppt die Zeit und führt Sie zur Selbsteinschätzung.
                    </p>
                </div>
                <button type="button" className={cn(pillPrimary, "w-full sm:w-auto", allCovered && "animate-pulse")} onClick={onFinish}>
                    <Check className="size-4" aria-hidden="true" />
                    Übung beenden
                </button>
            </div>
        </div>
    );
}

/** Two steps of an attempt: talking, then judging yourself. */
function Stepper({ inReview, completed }: Readonly<{ inReview: boolean; completed: boolean }>) {
    const steps = [
        { label: "Sprechen", state: inReview ? "done" : "current" },
        { label: "Auswerten", state: completed ? "done" : inReview ? "current" : "todo" },
    ] as const;
    return (
        <ol className="flex items-center gap-2 text-xs font-semibold" aria-label="Ablauf">
            {steps.map((step, index) => (
                <li key={step.label} aria-current={step.state === "current" ? "step" : undefined} className="flex items-center gap-2">
                    {index > 0 && <span aria-hidden="true" className="h-0.5 w-6 rounded bg-white/40" />}
                    <span
                        className={cn(
                            "flex size-6 items-center justify-center rounded-full border-2 text-[11px]",
                            step.state === "done" && "border-white bg-white text-pink-600",
                            step.state === "current" && "border-white bg-white/25 text-white",
                            step.state === "todo" && "border-white/40 text-white/60",
                        )}
                    >
                        {step.state === "done" ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
                    </span>
                    <span className={step.state === "todo" ? "text-white/60" : "text-white"}>{step.label}</span>
                </li>
            ))}
        </ol>
    );
}

/** Ring showing how many checklist items were ticked - a self-assessment overview, deliberately without a grade. */
function ScoreRing({ done, total }: Readonly<{ done: number; total: number }>) {
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    const ratio = total === 0 ? 0 : done / total;
    return (
        <div className="relative size-16 shrink-0" role="img" aria-label={`${done} von ${total} geschafft`}>
            <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden="true">
                <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="6" className="stroke-accent" />
                <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    fill="none"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="stroke-pink-500 transition-all duration-500"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - ratio)}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold tabular-nums text-foreground" aria-hidden="true">
                {done}/{total}
            </span>
        </div>
    );
}

function StatusChips({ completed, reviewed }: Readonly<{ completed: boolean; reviewed: boolean }>) {
    return (
        <ul className="flex flex-wrap gap-2 text-xs font-semibold" aria-label="Fortschritt">
            <li className="rounded-full bg-white/20 px-2.5 py-0.5 text-white">Geöffnet</li>
            {reviewed && <li className="rounded-full bg-white px-2.5 py-0.5 text-pink-600">Durchgang abgeschlossen</li>}
            {completed && <li className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-white">Selbst als erledigt eingeschätzt</li>}
        </ul>
    );
}
