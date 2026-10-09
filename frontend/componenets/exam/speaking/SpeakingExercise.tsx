"use client";

import { useState } from "react";
import { Check, ChevronRight, Eye, EyeOff, LifeBuoy, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpeakingContent, SpeakingGuideContent } from "@/types/exam";
import { hasSpeakingModel, SpeakingModel, SpeakingStimulus } from "./SpeakingContentView";
import SpeakingHelpDrawer, { SpeakingHelpTab } from "./SpeakingHelpDrawer";
import { partOfTaskType } from "./speakingMeta";
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

const CONFIDENCE = [1, 2, 3, 4, 5];

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
}

/**
 * Mündlicher Ausdruck practice. Nothing here is graded: the learner talks (alone or with a partner), then ticks the
 * self-assessment checklist. Three different states are kept apart: opened (nothing stored), practice attempt finished (this visit)
 * and "self-assessed as done" (stored through the existing mark-completed endpoint).
 */
export default function SpeakingExercise({ exerciseId, content, guide, guideLoading = false, level, completed, marking, onMarkCompleted }: Readonly<SpeakingExerciseProps>) {
    const [mode, setMode] = useState<SpeakingMode>("LEARN");
    const [phase, setPhase] = useState<"PRACTICE" | "REVIEW">("PRACTICE");
    const [helpOpen, setHelpOpen] = useState(false);
    const [showModel, setShowModel] = useState(false);
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
    const finish = () => setPhase("REVIEW");
    const repeat = () => {
        setPhase("PRACTICE");
        setShowModel(false);
        if (mode === "EXAM") setHelpOpen(false);
        notes.update({ checked: [], confidence: null });
    };
    const toggleItem = (item: string) =>
        notes.update({ checked: notes.checked.includes(item) ? notes.checked.filter((c) => c !== item) : [...notes.checked, item] });

    return (
        <div className="space-y-4">
            <div className={card}>
                <div className="flex flex-wrap items-center gap-2">
                    <div role="group" aria-label="Übungsmodus" className="inline-flex rounded-full border border-border p-1">
                        {MODES.map((m) => (
                            <button
                                key={m.value}
                                type="button"
                                aria-pressed={mode === m.value}
                                disabled={inReview}
                                onClick={() => changeMode(m.value)}
                                className={cn(
                                    "cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition disabled:cursor-default",
                                    mode === m.value ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-accent",
                                )}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                    <StatusChips completed={completed} reviewed={inReview} />
                </div>
                <p className="mt-2 text-xs text-foreground/60">{MODES.find((m) => m.value === mode)?.hint}</p>
            </div>

            {helpTabs.length > 0 && (
                <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={helpOpen}
                    onClick={() => setHelpOpen(true)}
                    className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl bg-primary p-4 text-start text-primary-foreground shadow-md transition hover:bg-primary/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
                >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <LifeBuoy className="size-6" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-base font-bold">Redemittel &amp; Tipps</span>
                        <span className="block text-sm text-primary-foreground/85">Fragen, Wendungen und Hinweise zu dieser Aufgabe öffnen</span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
            )}

            <SpeakingStimulus content={content} guide={guide} />

            {!helpVisible && (
                <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-foreground/60">
                    Redemittel, Tipps und Beispiele sind im Prüfungsmodus ausgeblendet, bis Sie die Übung beenden.
                </p>
            )}

            {!inReview ? (
                <div className="flex justify-end">
                    <button type="button" className={pillPrimary} onClick={finish}>
                        <Check className="size-4" aria-hidden="true" />
                        Übung beenden
                    </button>
                </div>
            ) : (
                <section className={card} aria-label="Selbsteinschätzung">
                    <h2 className="text-sm font-semibold text-foreground">Selbsteinschätzung</h2>
                    <p className="mt-1 text-xs text-foreground/60">Es gibt keine Punkte – haken Sie ab, was Ihnen gelungen ist.</p>
                    <ul className="mt-3 space-y-2">
                        {checklist.map((item) => (
                            <li key={item}>
                                <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground/85">
                                    <input type="checkbox" className="mt-1" checked={notes.checked.includes(item)} onChange={() => toggleItem(item)} />
                                    <span>{item}</span>
                                </label>
                            </li>
                        ))}
                    </ul>

                    <fieldset className="mt-4">
                        <legend className="text-sm font-semibold text-foreground">Wie sicher fühlen Sie sich? (optional)</legend>
                        <div className="mt-2 flex gap-2">
                            {CONFIDENCE.map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    aria-pressed={notes.confidence === value}
                                    aria-label={`Sicherheit ${value} von 5`}
                                    onClick={() => notes.update({ confidence: notes.confidence === value ? null : value })}
                                    className={cn(
                                        "size-9 cursor-pointer rounded-full border text-sm font-semibold transition",
                                        notes.confidence === value ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground/70 hover:bg-accent",
                                    )}
                                >
                                    {value}
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
                    <button type="button" className={pillSecondary} aria-expanded={showModel} onClick={() => setShowModel((v) => !v)}>
                        {showModel ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                        {showModel ? "Beispielantwort verbergen" : "Beispielantwort anzeigen"}
                    </button>
                    {showModel && <SpeakingModel content={content} />}
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

function StatusChips({ completed, reviewed }: Readonly<{ completed: boolean; reviewed: boolean }>) {
    return (
        <ul className="flex flex-wrap gap-2 text-xs font-semibold" aria-label="Fortschritt">
            <li className="rounded-full bg-accent px-2.5 py-0.5 text-foreground/70">Geöffnet</li>
            {reviewed && <li className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">Durchgang abgeschlossen</li>}
            {completed && <li className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-emerald-700 dark:text-emerald-300">Selbst als erledigt eingeschätzt</li>}
        </ul>
    );
}
