"use client";

import { DtzOralContent, DtzOralTeil2, PracticeMode } from "@/types/dtzOral";

type Item = { key: string; label: string; text: string };

/** The A2/B1 answers of Teil 2's possible solution that fit the chosen practice mode. */
function teil2Items(content: DtzOralTeil2, mode: PracticeMode): Item[] {
    const s = content.possibleSolution;
    return [
        { key: "description", label: "Teilnehmer/in A · Bildbeschreibung", text: s?.description },
        ...(mode !== "B1" ? [{ key: "experienceA2", label: "Teilnehmer/in B · Erfahrungen (A2)", text: s?.experienceA2 }] : []),
        ...(mode !== "A2" ? [{ key: "experienceB1", label: "Teilnehmer/in B · Erfahrungen (B1)", text: s?.experienceB1 }] : []),
    ].filter((item): item is Item => !!item.text);
}

/** True when the exercise has a possible solution to show (Teil 1 never has one). */
export function hasDtzSolution(content: DtzOralContent, mode: PracticeMode = "A2"): boolean {
    if (content.part === 2) return teil2Items(content, mode).length > 0;
    if (content.part === 3) return (content.possibleSolution?.dialogue ?? []).length > 0;
    return false;
}

/** The body of the "Beispielantwort" of Teil 2 (answers per level) or Teil 3 (a sample conversation). Always marked as only one possibility. */
export default function DtzOralSolution({ content, mode = "A2" }: Readonly<{ content: DtzOralContent; mode?: PracticeMode }>) {
    if (content.part === 2) {
        return (
            <>
                <p className="text-xs text-foreground/60">Das ist nur eine Beispielantwort. Sie können auch ganz anders antworten — sprechen Sie über das, was Sie auf dem Foto sehen und erlebt haben.</p>
                {teil2Items(content, mode).map((item) => (
                    <div key={item.key}>
                        <p className="text-xs font-bold uppercase tracking-wide text-primary">{item.label}</p>
                        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground/85">{item.text}</p>
                    </div>
                ))}
            </>
        );
    }
    if (content.part === 3) {
        return (
            <>
                <p className="text-xs text-foreground/60">Das ist nur ein Beispielgespräch. Ihr Plan kann ganz anders aussehen — wichtig ist, dass Sie beide Vorschläge machen, nachfragen und sich gemeinsam entscheiden.</p>
                <ol className="space-y-2" aria-label="Beispielgespräch">
                    {(content.possibleSolution?.dialogue ?? []).map((turn, i) => (
                        <li key={i} className={turn.speaker === "A" ? "flex" : "flex justify-end"}>
                            <p className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${turn.speaker === "A" ? "bg-primary/10 text-foreground" : "bg-foreground/[0.07] text-foreground"}`}>
                                <span className="me-2 text-xs font-bold text-primary">{turn.speaker}</span>{turn.text}
                            </p>
                        </li>
                    ))}
                </ol>
            </>
        );
    }
    return null;
}
