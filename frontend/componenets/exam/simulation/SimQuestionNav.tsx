"use client";

import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartState, SavedAnswer } from "@/types/examSimulation";
import { DONE_ID, WRITING_TEXT_ID } from "./SimExerciseView";

interface Props {
    parts: PartState[];
    answers: Record<string, Record<string, SavedAnswer>>;
}

function items(part: PartState): { id: string; label: string; scrollTo: string }[] {
    if (part.section === "SCHRIFTLICHER_AUSDRUCK") return [{ id: WRITING_TEXT_ID, label: "Text", scrollTo: `part-${part.key}` }];
    if (part.module === "ORAL") return [{ id: DONE_ID, label: "Geübt", scrollTo: `part-${part.key}` }];
    let n = 1;
    return part.exercises.flatMap((e) => e.questions.map((q) => ({ id: q.id, label: String(q.questionNumber ?? n++), scrollTo: `q-${q.id}` })));
}

/** Question navigation: every question of the current section with answered / unanswered / flagged state. */
export default function SimQuestionNav({ parts, answers }: Readonly<Props>) {
    const jump = (id: string) => {
        const el = document.getElementById(id);
        if (el) return el.scrollIntoView({ behavior: "smooth", block: "start" });
        // Not on the page right now (a Hörstation that is not open): let the listening board open it.
        window.dispatchEvent(new CustomEvent("hoeren:goto", { detail: id.replace(/^q-/, "") }));
    };
    return (
        <nav aria-label="Fragenübersicht" className="space-y-4">
            {parts.map((part) => (
                <div key={part.key}>
                    <button type="button" onClick={() => jump(`part-${part.key}`)} className="text-start text-xs font-bold uppercase tracking-wide text-foreground/60 hover:text-foreground">
                        {part.label}
                    </button>
                    <ul className="mt-2 flex flex-wrap gap-1.5 p-0">
                        {items(part).map((item) => {
                            const saved = answers[part.key]?.[item.id];
                            const answered = !!saved?.answer && saved.answer.trim() !== "";
                            return (
                                <li key={item.id} className="list-none">
                                    <button
                                        type="button"
                                        onClick={() => jump(item.scrollTo)}
                                        aria-label={`${part.label}, ${item.label}: ${answered ? "beantwortet" : "unbeantwortet"}${saved?.flagged ? ", markiert" : ""}`}
                                        className={cn(
                                            "relative flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-semibold tabular-nums transition",
                                            answered ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/70 hover:bg-accent",
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
            ))}
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/60">
                <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-primary" /> beantwortet</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded border border-border bg-card" /> offen</span>
                <span className="inline-flex items-center gap-1.5"><Flag className="size-3 fill-amber-500 text-amber-500" /> markiert</span>
            </p>
        </nav>
    );
}
