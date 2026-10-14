"use client";

import { useState } from "react";
import { ChevronRight, LifeBuoy } from "lucide-react";
import { zeitCheckMessage } from "@/lib/examTime";
import { SpeakingGuideContent } from "@/types/exam";
import { DTZ_ORAL_PARTS, DtzOralContent } from "@/types/dtzOral";
import { ExamPracticeSessionResult } from "@/types/examTime";
import SpeakingHelpDrawer, { SpeakingHelpTab } from "../speaking/SpeakingHelpDrawer";
import { FinishCard, SpeakingMode, SpeakingPracticeHeader, SpeakingReviewCard } from "../speaking/SpeakingPracticeParts";
import { DTZ_LEVEL, DTZ_SPEAKING_PARTS } from "../speaking/speakingMeta";
import { useSpeakingNotes } from "../speaking/useSpeakingNotes";
import DtzOralExercise from "./DtzOralExercise";

interface Props {
    exerciseId: string;
    title: string;
    content: DtzOralContent;
    /** The DTZ Lernbereich of this Teil (tips, Redemittel, mistakes, checklist); undefined while it loads or when there is none. */
    guide?: SpeakingGuideContent | null;
    guideLoading?: boolean;
    completed: boolean;
    marking: boolean;
    onMarkCompleted: () => void;
    /** The learner ends the attempt - the page stops the exercise timer here. */
    onFinish?: () => void;
    /** The learner starts another attempt - the page starts a fresh timer run here. */
    onRepeat?: () => void;
    timeResult?: ExamPracticeSessionResult | null;
}

/**
 * The DTZ Mündliche Prüfung practice page, built like the Telc one: Lernen / Prüfung mode, Redemittel & Tipps drawer (from the DTZ
 * Lernbereich), finish the attempt, then self-assessment with confidence and notes. The examination task itself is the unchanged
 * {@link DtzOralExercise}. Nothing is graded.
 */
export default function DtzOralPractice({ exerciseId, title, content, guide, guideLoading = false, completed, marking, onMarkCompleted, onFinish, onRepeat, timeResult = null }: Readonly<Props>) {
    const [mode, setMode] = useState<SpeakingMode>("LEARN");
    const [phase, setPhase] = useState<"PRACTICE" | "REVIEW">("PRACTICE");
    const [helpOpen, setHelpOpen] = useState(false);
    const notes = useSpeakingNotes(exerciseId);

    const inReview = phase === "REVIEW";
    const helpVisible = mode !== "EXAM" || inReview;
    const helpTabs: SpeakingHelpTab[] = helpVisible ? ["TIPS", "PHRASES", "MISTAKES"] : [];
    const partMeta = DTZ_SPEAKING_PARTS.find((p) => p.part === content.part) ?? DTZ_SPEAKING_PARTS[0];
    const oralMeta = DTZ_ORAL_PARTS.find((p) => p.part === content.part);
    const checklist = guide?.selfAssessment ?? [];
    const timeMessage = timeResult ? zeitCheckMessage(timeResult) : null;

    const changeMode = (next: SpeakingMode) => {
        setMode(next);
        if (next === "EXAM") setHelpOpen(false);
    };
    const finish = () => {
        setPhase("REVIEW");
        onFinish?.();
    };
    const repeat = () => {
        setPhase("PRACTICE");
        onRepeat?.();
        if (mode === "EXAM") setHelpOpen(false);
        notes.update({ checked: [], confidence: null });
    };

    return (
        <div className="space-y-4">
            <SpeakingPracticeHeader
                kicker={`Mündliche Prüfung · Teil ${partMeta.part}`}
                title={oralMeta?.title ?? partMeta.title}
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
                        <span className="block text-sm text-foreground/65">Fragen, Wendungen und Hinweise zu diesem Teil öffnen</span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-primary transition group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
            )}

            <DtzOralExercise title={title} showHeader={false} content={content} hideHelp={!helpVisible} />

            {!helpVisible && (
                <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-foreground/60">
                    Redemittel, Tipps und mögliche Lösungen sind im Prüfungsmodus ausgeblendet, bis Sie die Übung beenden.
                </p>
            )}

            {!inReview ? (
                <FinishCard covered={0} total={0} onFinish={finish} />
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

            <SpeakingHelpDrawer
                open={helpOpen && helpTabs.length > 0}
                onClose={() => setHelpOpen(false)}
                tabs={helpTabs}
                guide={guide}
                loading={guideLoading}
                level={DTZ_LEVEL}
                part={content.part}
                exam="DTZ"
            />
        </div>
    );
}
