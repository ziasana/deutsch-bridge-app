"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    danger?: boolean;
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
    onConfirm,
    onCancel,
}: Readonly<ConfirmDialogProps>) {
    if (!isOpen) return null;

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
                        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
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
