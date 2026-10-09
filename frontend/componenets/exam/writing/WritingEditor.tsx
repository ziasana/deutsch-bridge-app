"use client";

import { HelpCircle, Send } from "lucide-react";
import { countWords } from "./writingMeta";

interface WritingEditorProps {
    value: string;
    onChange: (value: string) => void;
    onOpenHelp?: () => void;
    onSubmit: () => void;
    savedAt: Date | null;
    submitting?: boolean;
}

/** Plain textarea on purpose: exam practice needs focus, not rich text. */
export default function WritingEditor({ value, onChange, onOpenHelp, onSubmit, savedAt, submitting }: WritingEditorProps) {
    const words = countWords(value);
    return (
        <div className="rounded-3xl bg-card p-4 shadow-card ring-1 ring-primary/15 sm:p-5">
            <div className="flex items-center justify-between gap-2">
                <label htmlFor="writing-answer" className="block text-base font-bold text-foreground">
                    ✍️ Deine Antwort
                </label>
                <span className={`rounded-full px-3 py-1 text-xs font-bold tabular-nums transition ${words > 0 ? "bg-primary/15 text-primary" : "bg-accent text-foreground/50"}`} aria-hidden="true">
                    {words} {words === 1 ? "Wort" : "Wörter"}
                </span>
            </div>
            <textarea
                id="writing-answer"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={14}
                spellCheck={false}
                autoCapitalize="sentences"
                className="mt-2 min-h-64 w-full resize-y rounded-lg border border-border bg-background p-3 text-base leading-relaxed text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Schreibe hier deinen Text…"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-foreground/55" aria-live="polite">
                <span>Wörter: {words}</span>
                <span>{savedAt ? `Entwurf gespeichert ${savedAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                {onOpenHelp ? (
                    <button
                        type="button"
                        onClick={onOpenHelp}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
                    >
                        <HelpCircle className="size-4" /> Hilfe
                    </button>
                ) : (
                    <span />
                )}
                <button
                    type="button"
                    disabled={words === 0 || submitting}
                    onClick={onSubmit}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-(--lesson-from) to-(--lesson-to) px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                    <Send className="size-4" aria-hidden="true" />
                    Abgeben
                </button>
            </div>
        </div>
    );
}
