"use client";

import { DtzOralTeil3 } from "@/types/dtzOral";
import { AllDone, CoverCard, emojiFor, ProgressBar, SceneImage, shell, TaskBadge } from "../speaking/SpeakingStage";
import DtzOralSolution, { hasDtzSolution } from "./DtzOralSolution";
import { CoverageProps, useCoverage } from "./useCoverage";

/**
 * Teil 3 - Gemeinsam etwas planen: the shared situation (with an illustration beside it), the instruction and the planning notes, which the
 * learner taps once they are clarified. The notes are open questions; no decision is made in advance.
 */
export default function DtzOralTeil3View({ content, hideHelp = false, hideSolution = false, covered: coveredProp, onToggle }: Readonly<{ content: DtzOralTeil3; hideHelp?: boolean; hideSolution?: boolean } & CoverageProps>) {
    const { covered, toggle } = useCoverage(coveredProp, onToggle);
    const ids = content.planningNotes.map((n) => `note-${n.number}`);
    const done = ids.filter((id) => covered.includes(id)).length;
    return (
        <div className="space-y-5">
            <div className={shell}>
            <section aria-label="Situation">
                <div className="grid md:grid-cols-5">
                    <div className="aspect-[4/3] md:col-span-2 md:aspect-auto">
                        <SceneImage src={null} alt={content.topic ?? ""} topic={content.topic} />
                    </div>
                    <div className="p-5 sm:p-6 md:col-span-3">
                        <TaskBadge>Teil 3 · Gemeinsam etwas planen</TaskBadge>
                        <p className="mt-2 text-base leading-relaxed text-foreground">{content.situation}</p>
                        <p className="mt-3 text-base font-bold text-foreground">{content.taskInstruction}</p>
                    </div>
                </div>
            </section>

            <section className="border-t border-border/60 p-5 sm:p-6" aria-label="Notizen zur Planung">
                <p className="text-xs text-foreground/60">Machen Sie Vorschläge, reagieren Sie auf Ihren Partner und einigen Sie sich. Tippen Sie jeden Punkt an, den Sie geklärt haben.</p>
                <div className="mt-3">
                    <ProgressBar done={done} total={ids.length} label="Geklärte Planungspunkte" />
                </div>
                <ol className="mt-3 grid gap-3 sm:grid-cols-2">
                    {content.planningNotes.map((note, index) => (
                        <li key={note.number}>
                            <CoverCard id={ids[index]} index={index} emoji={emojiFor(note.label, "📌")} title={note.label} covered={covered.includes(ids[index])} onToggle={toggle} />
                        </li>
                    ))}
                </ol>
                {ids.length > 0 && done === ids.length && <AllDone>Alles geplant – jetzt noch auf eine gemeinsame Lösung einigen!</AllDone>}
            </section>
            </div>

            {!hideHelp && !hideSolution && hasDtzSolution(content) && (
                <DtzOralSolution content={content} />
            )}
        </div>
    );
}
