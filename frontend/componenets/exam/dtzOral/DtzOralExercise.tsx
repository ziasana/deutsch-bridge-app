"use client";

import { Check } from "lucide-react";
import { DTZ_ORAL_PARTS, DtzOralContent, PracticeMode } from "@/types/dtzOral";
import { CoverageProps } from "./useCoverage";
import DtzOralTeil1View from "./DtzOralTeil1";
import DtzOralTeil2View from "./DtzOralTeil2";
import DtzOralTeil3View from "./DtzOralTeil3";

interface Props extends CoverageProps {
    title: string;
    content: DtzOralContent;
    /** Admin preview only: the prompt the photo of Teil 2 is made from. */
    adminImagePrompt?: string | null;
    /** The learner page shows the title in its own header; the admin preview shows it here (default true). */
    showHeader?: boolean;
    /** Prüfung mode of the learner page: hides practice support, example phrases and the possible solution. */
    hideHelp?: boolean;
    /** Teil 2: the A2 / B1 / Gemischt choice, when the practice page owns it. */
    practiceMode?: PracticeMode;
    onPracticeModeChange?: (mode: PracticeMode) => void;
    /** Learner page only: marking the exercise as practised. Omitted in the admin preview. */
    completed?: boolean;
    marking?: boolean;
    onMarkCompleted?: () => void;
}

/** The learner view of one DTZ Mündliche Prüfung exercise, by Teil. Also rendered (read only) by the admin preview. */
export default function DtzOralExercise({ title, content, adminImagePrompt, showHeader = true, hideHelp = false, practiceMode, onPracticeModeChange, covered, onToggle, completed, marking, onMarkCompleted }: Readonly<Props>) {
    const meta = DTZ_ORAL_PARTS.find((p) => p.part === content.part);
    return (
        <div className="space-y-5">
            {showHeader && (
                <header>
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">Mündliche Prüfung · {meta?.label} · {meta?.title}</p>
                    <h2 className="mt-1 text-2xl font-bold text-foreground">{title}</h2>
                </header>
            )}
            {content.part === 1 && <DtzOralTeil1View content={content} hideHelp={hideHelp} covered={covered} onToggle={onToggle} />}
            {content.part === 2 && <DtzOralTeil2View content={content} adminImagePrompt={adminImagePrompt} hideHelp={hideHelp} practiceMode={practiceMode} onPracticeModeChange={onPracticeModeChange} covered={covered} onToggle={onToggle} />}
            {content.part === 3 && <DtzOralTeil3View content={content} hideHelp={hideHelp} covered={covered} onToggle={onToggle} />}
            {onMarkCompleted && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onMarkCompleted}
                        disabled={completed || marking}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-default disabled:opacity-60"
                    >
                        <Check className="size-4" aria-hidden="true" />
                        {completed ? "Als geübt markiert" : "Als geübt markieren"}
                    </button>
                </div>
            )}
        </div>
    );
}
