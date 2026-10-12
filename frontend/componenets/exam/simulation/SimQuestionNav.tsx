"use client";

import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartState, SavedAnswer } from "@/types/examSimulation";
import { DONE_ID, WRITING_TEXT_ID } from "./SimExerciseView";

interface Props {
    parts: PartState[];
    answers: Record<string, Record<string, SavedAnswer>>;
    /** The part currently shown; the others are reached through the numbers. */
    activePartKey?: string;
    onSelectPart?: (partKey: string) => void;
}

export function partItems(part: PartState): { id: string; label: string; scrollTo: string }[] {
    if (part.section === "SCHRIFTLICHER_AUSDRUCK") return [{ id: WRITING_TEXT_ID, label: "Text", scrollTo: `part-${part.key}` }];
    if (part.module === "ORAL") return [{ id: DONE_ID, label: "Geübt", scrollTo: `part-${part.key}` }];
    let n = 1;
    return part.exercises.flatMap((e) => e.questions.map((q) => ({ id: q.id, label: String(q.questionNumber ?? n++), scrollTo: `q-${q.id}` })));
}

/** Question palette: every question of the current section with answered / open / flagged state; a click opens its part and scrolls to it. */
export default function SimQuestionNav({ parts, answers, activePartKey, onSelectPart }: Readonly<Props>) {
    const jump = (id: string, partKey: string) => {
        onSelectPart?.(partKey);
        // The part may have to be drawn first; then scroll (or ask the listening board to open the right Hörstation).
        requestAnimationFrame(() => {
            const el = document.getElementById(id);
            if (el) return el.scrollIntoView({ behavior: "smooth", block: "center" });
            window.dispatchEvent(new CustomEvent("exam:goto", { detail: id.replace(/^q-/, "") }));
        });
    };
    return (
        <nav aria-label="Fragenübersicht" className="space-y-4">
            {parts.map((part) => {
                const list = partItems(part);
                const done = list.filter((item) => !!answers[part.key]?.[item.id]?.answer?.trim()).length;
                const active = part.key === activePartKey;
                return (
                    <div key={part.key} className={cn("rounded-2xl p-2.5 transition", active ? "bg-primary/10 ring-1 ring-primary/30" : "")}>
                        <button type="button" onClick={() => jump(`part-${part.key}`, part.key)} className="flex w-full cursor-pointer items-center justify-between gap-2 text-start text-xs font-bold uppercase tracking-wide text-foreground/70 hover:text-foreground">
                            <span className="truncate">{part.label}</span>
                            <span className="tabular-nums text-foreground/50">{done}/{list.length}</span>
                        </button>
                        <ul className="mt-2 flex flex-wrap gap-1.5 p-0">
                            {list.map((item) => {
                                const saved = answers[part.key]?.[item.id];
                                const answered = !!saved?.answer && saved.answer.trim() !== "";
                                return (
                                    <li key={item.id} className="list-none">
                                        <button
                                            type="button"
                                            onClick={() => jump(item.scrollTo, part.key)}
                                            aria-label={`${part.label}, ${item.label}: ${answered ? "beantwortet" : "unbeantwortet"}${saved?.flagged ? ", markiert" : ""}`}
                                            className={cn(
                                                "relative flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-lg border px-2 text-xs font-semibold tabular-nums transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                                answered ? "border-primary bg-primary text-primary-foreground" : "border-dashed border-primary/40 bg-card text-foreground/70 hover:bg-accent",
                                            )}
                                        >
                                            {item.label}
                                            {saved?.flagged && <Flag className="absolute -end-1 -top-1 size-3 fill-amber-500 text-amber-500" aria-hidden />}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            })}
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/60">
                <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-primary" /> beantwortet</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded border border-dashed border-primary/50 bg-card" /> offen</span>
                <span className="inline-flex items-center gap-1.5"><Flag className="size-3 fill-amber-500 text-amber-500" /> markiert</span>
            </p>
        </nav>
    );
}
