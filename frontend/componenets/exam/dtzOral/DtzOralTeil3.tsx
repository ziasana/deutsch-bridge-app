"use client";

import { DtzOralTeil3 } from "@/types/dtzOral";
import { AllDone, CoverCard, emojiFor, ProgressBar, SceneImage, shell, TaskBadge } from "../speaking/SpeakingStage";
import PossibleSolution from "./PossibleSolution";
import { CoverageProps, useCoverage } from "./useCoverage";

/**
 * Teil 3 - Gemeinsam etwas planen: the shared situation (with an illustration beside it), the instruction and the planning notes, which the
 * learner taps once they are clarified. The notes are open questions; no decision is made in advance. Example phrases are optional help.
 */
export default function DtzOralTeil3View({ content, hideHelp = false, covered: coveredProp, onToggle }: Readonly<{ content: DtzOralTeil3; hideHelp?: boolean } & CoverageProps>) {
    const { covered, toggle } = useCoverage(coveredProp, onToggle);
    const phrases = hideHelp ? [] : (content.learnerSupport?.examplePhrases ?? []);
    const dialogue = hideHelp ? [] : (content.possibleSolution?.dialogue ?? []);
    const ids = content.planningNotes.map((n) => `note-${n.number}`);
    const done = ids.filter((id) => covered.includes(id)).length;
    return (
        <div className="space-y-5">
            <section className={shell} aria-label="Situation">
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

            <section className={`${shell} p-5 sm:p-6`} aria-label="Notizen zur Planung">
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

            {dialogue.length > 0 && (
                <PossibleSolution>
                    <p className="text-xs text-foreground/60">Das ist nur ein mögliches Gespräch. Ihr Plan kann ganz anders aussehen — wichtig ist, dass Sie beide Vorschläge machen, nachfragen und sich gemeinsam entscheiden.</p>
                    <ol className="space-y-2" aria-label="Mögliches Gespräch">
                        {dialogue.map((turn, i) => (
                            <li key={i} className={turn.speaker === "A" ? "flex" : "flex justify-end"}>
                                <p className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${turn.speaker === "A" ? "bg-primary/10 text-foreground" : "bg-foreground/[0.07] text-foreground"}`}>
                                    <span className="me-2 text-xs font-bold text-primary">{turn.speaker}</span>{turn.text}
                                </p>
                            </li>
                        ))}
                    </ol>
                </PossibleSolution>
            )}

            {phrases.length > 0 && (
                <details className="rounded-2xl bg-card shadow-card ring-1 ring-foreground/10 open:ring-primary/30">
                    <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-foreground">Redemittel (optional)</summary>
                    <ul className="space-y-1.5 px-5 pb-5 text-sm text-foreground/80">
                        {phrases.map((phrase) => <li key={phrase}>• {phrase}</li>)}
                    </ul>
                </details>
            )}
        </div>
    );
}
