"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { cn } from "@/lib/utils";
import { DtzOralTeil2, PracticeMode } from "@/types/dtzOral";
import { AllDone, CoverCard, ProgressBar, SceneImage, shell, TaskBadge } from "../speaking/SpeakingStage";
import DtzOralSolution, { hasDtzSolution } from "./DtzOralSolution";
import PossibleSolution from "./PossibleSolution";
import { CoverageProps, useCoverage } from "./useCoverage";

export const PRACTICE_MODES: { value: PracticeMode; label: string; hint: string }[] = [
    { value: "A2", label: "A2", hint: "Konkrete Fragen zu Ihrem Alltag" },
    { value: "B1", label: "B1", hint: "Gründe, Vergleiche und Meinungen" },
    { value: "MIXED", label: "Gemischt", hint: "A2- und B1-Fragen im Wechsel" },
];

/** The follow-up questions of the chosen practice mode; "MIXED" alternates A2 and B1 and tags every question with its level. */
export function questionsFor(content: DtzOralTeil2, mode: PracticeMode): { text: string; level: "A2" | "B1" }[] {
    const a2 = content.participantB.questionsA2.map((text) => ({ text, level: "A2" as const }));
    const b1 = content.participantB.questionsB1.map((text) => ({ text, level: "B1" as const }));
    if (mode === "A2") return a2;
    if (mode === "B1") return b1;
    const mixed: { text: string; level: "A2" | "B1" }[] = [];
    for (let i = 0; i < Math.max(a2.length, b1.length); i++) {
        if (a2[i]) mixed.push(a2[i]);
        if (b1[i]) mixed.push(b1[i]);
    }
    return mixed;
}

/**
 * Teil 2 - Über Erfahrungen sprechen. The photo stays beside the prompts where the screen is wide enough (tap it to enlarge). Participant A
 * describes the photo, participant B tells about their own experiences; the learner picks A2, B1 or mixed follow-up questions for the same
 * photo and taps every question once it has been talked about. The task itself has no model answer; the possible solution is optional help.
 */
interface Props extends CoverageProps {
    content: DtzOralTeil2;
    adminImagePrompt?: string | null;
    /** Prüfung mode: the possible solution stays hidden. */
    hideHelp?: boolean;
    /** The practice page shows the possible solution itself, at the bottom of the page. */
    hideSolution?: boolean;
    /** The A2 / B1 / Gemischt choice; controlled by the practice page so it can count the questions, otherwise kept here. */
    practiceMode?: PracticeMode;
    onPracticeModeChange?: (mode: PracticeMode) => void;
}

export default function DtzOralTeil2View({ content, adminImagePrompt, hideHelp = false, hideSolution = false, practiceMode, onPracticeModeChange, covered: coveredProp, onToggle }: Readonly<Props>) {
    const [localMode, setLocalMode] = useState<PracticeMode>("A2");
    const mode = practiceMode ?? localMode;
    const setMode = onPracticeModeChange ?? setLocalMode;
    const { covered, toggle } = useCoverage(coveredProp, onToggle);
    const src = resolveUploadUrl(content.image.imageUrl);
    const questions = questionsFor(content, mode);
    const aIds = content.participantA.questions.map((_, i) => `a-${i}`);
    const bIds = questions.map((q) => `b-${q.level}-${q.text}`);
    const doneA = aIds.filter((id) => covered.includes(id)).length;
    const doneB = bIds.filter((id) => covered.includes(id)).length;
    return (
        <section className={shell} aria-label="Aufgabe">
            <div className="bg-gradient-to-br from-pink-500/15 via-orange-400/10 to-amber-400/15 p-5 sm:p-6">
                <TaskBadge>Teil 2 · Über Erfahrungen sprechen</TaskBadge>
                {content.topic && <h2 className="mt-2 text-lg font-bold text-foreground">{content.topic}</h2>}
                <p className="mt-1 text-xs text-foreground/60">Tippen Sie jede Frage an, wenn Sie sie besprochen haben.</p>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <figure className="lg:sticky lg:top-4 lg:self-start">
                    {src ? (
                        <div className="aspect-[4/3] overflow-hidden rounded-2xl shadow-md">
                            <SceneImage src={src} alt={content.image.altText || "Foto zur Aufgabe"} topic={content.topic} />
                        </div>
                    ) : (
                        <div role="img" aria-label="Kein Foto" className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-foreground/20 text-sm text-foreground/50">
                            <ImageOff className="size-8" aria-hidden="true" />
                            Noch kein Foto
                        </div>
                    )}
                    {adminImagePrompt && (
                        <figcaption className="mt-3 rounded-lg bg-foreground/[0.04] p-3 text-xs text-foreground/70">
                            <span className="font-semibold">Image prompt (admin only): </span>{adminImagePrompt}
                        </figcaption>
                    )}
                </figure>

                <div className="space-y-6">
                    <section aria-label="Teilnehmer A">
                        <ParticipantHeading letter="A" title={content.participantA.title} instructions={content.participantA.instructions} />
                        <div className="mt-3">
                            <ProgressBar done={doneA} total={aIds.length} label="Besprochene Fragen zum Foto" />
                        </div>
                        <ul className="mt-3 grid gap-3">
                            {content.participantA.questions.map((q, i) => (
                                <li key={q}>
                                    <CoverCard id={aIds[i]} index={i} emoji="📷" title={q} covered={covered.includes(aIds[i])} onToggle={toggle} />
                                </li>
                            ))}
                        </ul>
                        {aIds.length > 0 && doneA === aIds.length && <AllDone>Foto beschrieben – prima!</AllDone>}
                    </section>

                    <section aria-label="Teilnehmer B" className="border-t border-border/60 pt-6">
                        <ParticipantHeading letter="B" title={content.participantB.title} instructions={content.participantB.instructions} />
                        <div role="radiogroup" aria-label="Übungsniveau" className="mt-4 flex flex-wrap gap-2">
                            {PRACTICE_MODES.map((m) => (
                                <button
                                    key={m.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={mode === m.value}
                                    title={m.hint}
                                    onClick={() => setMode(m.value)}
                                    className={cn(
                                        "cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50",
                                        mode === m.value ? "border-transparent bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-sm" : "border-border bg-card text-foreground/70 hover:border-pink-500/40 hover:bg-pink-500/5",
                                    )}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                        <div className="mt-3">
                            <ProgressBar done={doneB} total={bIds.length} label="Besprochene Erfahrungsfragen" />
                        </div>
                        <ol className="mt-3 grid gap-3" aria-label={`Fragen ${mode === "MIXED" ? "gemischt" : mode}`}>
                            {questions.map((q, i) => (
                                <li key={bIds[i]}>
                                    <CoverCard id={bIds[i]} index={i} emoji={`${i + 1}`} title={q.text} hint={mode === "MIXED" ? q.level : null} covered={covered.includes(bIds[i])} onToggle={toggle} />
                                </li>
                            ))}
                        </ol>
                        {bIds.length > 0 && doneB === bIds.length && <AllDone>Alle Fragen besprochen – stark!</AllDone>}
                    </section>

                    {!hideHelp && !hideSolution && hasDtzSolution(content, mode) && (
                        <PossibleSolution>
                            <DtzOralSolution content={content} mode={mode} />
                        </PossibleSolution>
                    )}
                </div>
            </div>
        </section>
    );
}

/** "A" / "B" avatar, the role title and the examiner's wording - the same look as the person header of the Telc Teil 2. */
function ParticipantHeading({ letter, title, instructions }: Readonly<{ letter: string; title: string; instructions: string }>) {
    return (
        <div className="flex items-start gap-3">
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full border-4 border-card bg-gradient-to-br from-pink-500 to-orange-400 text-lg font-bold text-white shadow-md">
                {letter}
            </span>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Teilnehmer/in {letter} · {title}</p>
                <p className="mt-1 text-base text-foreground/90">{instructions}</p>
            </div>
        </div>
    );
}
