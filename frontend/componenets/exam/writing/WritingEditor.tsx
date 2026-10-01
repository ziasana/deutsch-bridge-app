"use client";

import { HelpCircle } from "lucide-react";
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
        <div className="rounded-[10px] bg-card p-4 shadow-card sm:p-5">
            <label htmlFor="writing-answer" className="block text-sm font-semibold text-foreground">
                Deine Antwort
            </label>
            <textarea
                id="writing-answer"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={14}
                spellCheck={false}
                autoCapitalize="sentences"
                className="mt-2 min-h-64 w-full resize-y rounded-lg border border-border bg-background p-3 text-base leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent cursor-pointer"
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
                    className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                    Abgeben
                </button>
            </div>
        </div>
    );
}
