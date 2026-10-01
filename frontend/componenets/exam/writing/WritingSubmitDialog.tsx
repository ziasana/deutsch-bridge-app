"use client";

import { useEffect, useRef } from "react";

interface Props {
    open: boolean;
    submitting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function WritingSubmitDialog({ open, submitting, onCancel, onConfirm }: Props) {
    const confirmRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        confirmRef.current?.focus();
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div role="alertdialog" aria-modal="true" aria-labelledby="submit-title" className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
                <h2 id="submit-title" className="text-lg font-semibold text-foreground">
                    Bist du bereit, deinen Text abzugeben?
                </h2>
                <p className="mt-2 text-sm text-foreground/60">Du kannst ihn danach noch einmal überarbeiten.</p>
                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={onCancel} className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-accent cursor-pointer">
                        Zurück
                    </button>
                    <button
                        ref={confirmRef}
                        type="button"
                        disabled={submitting}
                        onClick={onConfirm}
                        className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                    >
                        {submitting ? "Wird abgegeben…" : "Abgeben"}
                    </button>
                </div>
            </div>
        </div>
    );
}
