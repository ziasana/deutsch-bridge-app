"use client";

import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { DtzOralContent, DtzOralTeil2, PracticeMode } from "@/types/dtzOral";
import { Coverable, Mode, READ_PRACTISE, Segmented, Shell, useReveal } from "../speaking/SpeakingModel";
import { useState } from "react";

type Item = { key: string; label: string; text: string };

/** The A2/B1 answers of Teil 2's Beispielantwort that fit the chosen practice mode. */
function teil2Items(content: DtzOralTeil2, mode: PracticeMode): Item[] {
    const s = content.possibleSolution;
    return [
        { key: "description", label: "Teilnehmer/in A · Bildbeschreibung", text: s?.description },
        ...(mode !== "B1" ? [{ key: "experienceA2", label: "Teilnehmer/in B · Erfahrungen (A2)", text: s?.experienceA2 }] : []),
        ...(mode !== "A2" ? [{ key: "experienceB1", label: "Teilnehmer/in B · Erfahrungen (B1)", text: s?.experienceB1 }] : []),
    ].filter((item): item is Item => !!item.text);
}

/** True when the exercise has a Beispielantwort to show (Teil 1 never has one). */
export function hasDtzSolution(content: DtzOralContent, mode: PracticeMode = "A2"): boolean {
    if (content.part === 2) return teil2Items(content, mode).length > 0;
    if (content.part === 3) return (content.possibleSolution?.dialogue ?? []).length > 0;
    return false;
}

const note = "text-xs text-foreground/60";

/** Teil 2: the answers in paragraphs per speaker/level - readable in full or coverable for self-practice, like the Telc Beispielantwort. */
function PhotoAnswer({ content, mode }: Readonly<{ content: DtzOralTeil2; mode: PracticeMode }>) {
    const [view, setView] = useState<Mode>("READ");
    const reveal = useReveal();
    const items = teil2Items(content, mode).map((item) => ({ ...item, paragraphs: item.text.split(/\n+/).map((p) => p.trim()).filter(Boolean) }));
    const ids = items.flatMap((item) => item.paragraphs.map((_, i) => `${item.key}-${i}`));
    const switchView = (m: Mode) => {
        setView(m);
        reveal.reset();
    };
    return (
        <Shell
            label="Beispielantwort"
            title="Beispielantwort"
            subtitle="So könnte eine gute Antwort klingen."
            controls={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Segmented value={view} options={READ_PRACTISE} onChange={switchView} />
                    {view === "PRACTISE" && (
                        <button type="button" onClick={() => reveal.revealAll(ids)} className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                            <Eye className="size-3.5" aria-hidden="true" /> Alle aufdecken
                        </button>
                    )}
                </div>
            }
        >
            {items.map((item) => (
                <div key={item.key} className="space-y-2.5">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">{item.label}</p>
                    {item.paragraphs.map((p, i) => {
                        const id = `${item.key}-${i}`;
                        return (
                            <div key={id} className="rounded-2xl border-s-4 border-primary bg-primary/[0.05] px-4 py-3">
                                <Coverable covered={view === "PRACTISE" && !reveal.isRevealed(id)} onReveal={() => reveal.reveal(id)}>
                                    <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">{p}</p>
                                </Coverable>
                            </div>
                        );
                    })}
                </div>
            ))}
            <p className={note}>Das ist nur eine Beispielantwort. Sie können auch ganz anders antworten — sprechen Sie über das, was Sie auf dem Foto sehen und erlebt haben.</p>
        </Shell>
    );
}

/** Teil 3: the sample conversation as a chat; pick a role to practise it, your lines stay covered until tapped (as in Telc). */
function PlanningDialogue({ content }: Readonly<{ content: Extract<DtzOralContent, { part: 3 }> }>) {
    const turns = content.possibleSolution?.dialogue ?? [];
    const [view, setView] = useState<Mode>("READ");
    const reveal = useReveal();
    const mine = view === "ROLE_A" ? "A" : view === "ROLE_B" ? "B" : null;
    const switchView = (m: Mode) => {
        setView(m);
        reveal.reset();
    };
    return (
        <Shell
            label="Beispielgespräch"
            title="Beispielgespräch"
            subtitle={mine ? `Du sprichst ${mine}. Antworte laut, dann tippe auf deine Zeile.` : "Lies mit oder übe eine Rolle."}
            controls={
                <Segmented
                    value={view}
                    onChange={switchView}
                    options={[
                        { value: "READ", label: "Lesen" },
                        { value: "ROLE_A", label: "Ich bin A" },
                        { value: "ROLE_B", label: "Ich bin B" },
                    ]}
                />
            }
        >
            <ol className="space-y-3" aria-label="Beispielgespräch">
                {turns.map((turn, i) => {
                    const id = String(i);
                    const right = turn.speaker === "B";
                    const covered = turn.speaker === mine && !reveal.isRevealed(id);
                    return (
                        <li key={`${turn.speaker}-${i}`} className={cn("flex items-end gap-2", right && "flex-row-reverse")}>
                            <span aria-hidden="true" className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold", right ? "bg-foreground/10 text-foreground/70" : "bg-primary text-primary-foreground")}>
                                {turn.speaker}
                            </span>
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                                    right ? "rounded-ee-md bg-foreground/[0.06] text-foreground/85" : "rounded-es-md bg-primary/[0.09] text-foreground/85 ring-1 ring-primary/15",
                                    turn.speaker === mine && "ring-2 ring-primary/50",
                                )}
                            >
                                <span className="sr-only">{turn.speaker}: </span>
                                <Coverable covered={covered} onReveal={() => reveal.reveal(id)}>
                                    <span>{turn.text}</span>
                                </Coverable>
                            </div>
                        </li>
                    );
                })}
            </ol>
            {mine && (
                <button type="button" onClick={() => reveal.reset()} className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                    <EyeOff className="size-3.5" aria-hidden="true" /> Wieder verdecken
                </button>
            )}
            <p className={note}>Das ist nur ein Beispielgespräch. Ihr Plan kann ganz anders aussehen — wichtig ist, dass Sie beide Vorschläge machen, nachfragen und sich gemeinsam entscheiden.</p>
        </Shell>
    );
}

/** The Beispielantwort of Teil 2 (answers per level) or Teil 3 (a sample conversation), in the same design as the Telc one. */
export default function DtzOralSolution({ content, mode = "A2" }: Readonly<{ content: DtzOralContent; mode?: PracticeMode }>) {
    if (content.part === 2) return <PhotoAnswer content={content} mode={mode} />;
    if (content.part === 3) return <PlanningDialogue content={content} />;
    return null;
}
