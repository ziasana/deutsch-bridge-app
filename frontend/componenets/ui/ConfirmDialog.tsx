"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    danger?: boolean;
    /** When set, the confirm button stays disabled until the user types exactly this text (case-insensitive). */
    requireText?: string;
    requireTextLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

/** Token-styled replacement for window.confirm(), matching the app's modal look (see VocabularyModal). */
export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    danger = true,
    requireText,
    requireTextLabel,
    onConfirm,
    onCancel,
}: Readonly<ConfirmDialogProps>) {
    const [typed, setTyped] = useState("");

    useEffect(() => {
        if (!isOpen) setTyped("");
    }, [isOpen]);

    if (!isOpen) return null;

    const confirmBlocked = requireText !== undefined && typed.trim().toLowerCase() !== requireText.trim().toLowerCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-lg">
                <div className="flex items-start gap-3">
                    <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${danger ? "bg-red-500/10" : "bg-accent"}`}
                    >
                        <AlertTriangle className={`size-5 ${danger ? "text-red-500" : "text-primary"}`} />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-foreground">{title}</h2>
                        <p className="mt-1 text-sm text-foreground/60">{message}</p>
                    </div>
                </div>

                {requireText !== undefined && (
                    <label className="mt-4 block text-sm text-foreground/70">
                        {requireTextLabel ?? `Type "${requireText}" to confirm`}
                        <input
                            type="text"
                            value={typed}
                            onChange={(e) => setTyped(e.target.value)}
                            autoFocus
                            autoComplete="off"
                            spellCheck={false}
                            className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-red-500"
                        />
                    </label>
                )}

                <div className="mt-5 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={confirmBlocked}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            danger ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
