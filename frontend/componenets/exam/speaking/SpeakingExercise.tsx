"use client";

import { useState } from "react";
import { ChevronRight, Eye, EyeOff, Lightbulb, LifeBuoy } from "lucide-react";
import { zeitCheckMessage } from "@/lib/examTime";
import { SpeakingContent, SpeakingGuideContent } from "@/types/exam";
import { ExamPracticeSessionResult } from "@/types/examTime";
import { hasSpeakingModel, SpeakingModel } from "./SpeakingContentView";
import SpeakingHelpDrawer, { SpeakingHelpTab } from "./SpeakingHelpDrawer";
import SpeakingStage, { stageTotal } from "./SpeakingStage";
import { partOfTaskType, SPEAKING_PARTS } from "./speakingMeta";
import { useSpeakingNotes } from "./useSpeakingNotes";
import { FinishCard, SpeakingMode, SpeakingPracticeHeader, SpeakingReviewCard } from "./SpeakingPracticeParts";

export type { SpeakingMode } from "./SpeakingPracticeParts";

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

    const partMeta = SPEAKING_PARTS.find((p) => p.part === part) ?? SPEAKING_PARTS[0];
    const totalItems = stageTotal(content, guide);
    const timeMessage = timeResult ? zeitCheckMessage(timeResult) : null;

    return (
        <div className="space-y-4">
            <SpeakingPracticeHeader
                kicker={`Mündlicher Ausdruck · Teil ${partMeta.part}`}
                title={partMeta.title}
                description={partMeta.description}
                mode={mode}
                onModeChange={changeMode}
                inReview={inReview}
                completed={completed}
            />

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
                <SpeakingReviewCard
                    checklist={checklist}
                    notes={notes}
                    timeLines={timeMessage ? timeMessage.lines : null}
                    completed={completed}
                    marking={marking}
                    onMarkCompleted={onMarkCompleted}
                    onRepeat={repeat}
                />
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

