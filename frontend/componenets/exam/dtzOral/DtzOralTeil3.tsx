"use client";

import { DtzOralTeil3 } from "@/types/dtzOral";

/**
 * Teil 3 - Gemeinsam etwas planen: the shared situation, the instruction and the planning notes. The notes are open questions; no decision is
 * made in advance. Example phrases are optional help, shown apart from the task.
 */
export default function DtzOralTeil3View({ content }: Readonly<{ content: DtzOralTeil3 }>) {
    const phrases = content.learnerSupport?.examplePhrases ?? [];
    const dialogue = content.possibleSolution?.dialogue ?? [];
    return (
        <div className="space-y-5">
            <section className="rounded-[10px] bg-card p-6 shadow-card sm:p-8" aria-label="Situation">
                <p className="text-base leading-relaxed text-foreground">{content.situation}</p>
                <p className="mt-3 text-base font-bold text-foreground">{content.taskInstruction}</p>
            </section>

            <section aria-label="Notizen zur Planung">
                <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {content.planningNotes.map((note) => (
                        <li key={note.number} className="flex min-h-20 items-center gap-3 rounded-2xl bg-amber-100/70 p-4 shadow-sm ring-1 ring-amber-300/60 dark:bg-amber-400/15 dark:ring-amber-300/30">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-extrabold text-white">{note.number}</span>
                            <span className="text-base font-semibold text-foreground">{note.label}</span>
                        </li>
                    ))}
                </ol>
            </section>

            {dialogue.length > 0 && (
                <details className="group rounded-[10px] bg-card shadow-card ring-1 ring-foreground/10 open:ring-primary/30">
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-6 py-4 text-sm font-semibold text-foreground">
                        Mögliche Lösung
                        <span className="ms-auto text-xs font-medium text-primary group-open:hidden">anzeigen</span>
                        <span className="ms-auto hidden text-xs font-medium text-primary group-open:inline">ausblenden</span>
                    </summary>
                    <div className="space-y-3 px-6 pb-6">
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
                    </div>
                </details>
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
