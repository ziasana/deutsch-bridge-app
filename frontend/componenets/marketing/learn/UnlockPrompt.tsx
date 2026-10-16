"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Lock, X } from "lucide-react";
import { useMarketing } from "../useMarketing";

/** The sign-up prompt shown when a visitor opens a locked item. Returns the opener and the dialog to render once. */
export function useUnlockPrompt() {
    const [open, setOpen] = useState(false);
    const show = useCallback(() => setOpen(true), []);
    return { show, dialog: <UnlockDialog open={open} onClose={() => setOpen(false)} /> };
}

function UnlockDialog({ open, onClose }: Readonly<{ open: boolean; onClose: () => void }>) {
    const { m } = useMarketing();
    const u = m.learnPage.unlock;
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        closeRef.current?.focus();
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="unlock-title"
                className="relative w-full max-w-md animate-[fade-up_.25s_ease-out] rounded-t-3xl bg-card p-7 text-center shadow-2xl motion-reduce:animate-none sm:rounded-3xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    ref={closeRef}
                    type="button"
                    onClick={onClose}
                    aria-label={u.close}
                    className="absolute end-3 top-3 flex size-9 items-center justify-center rounded-full text-foreground/60 transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <X className="size-4" />
                </button>
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <Lock className="size-6" />
                </span>
                <h2 id="unlock-title" className="mt-4 text-xl font-bold text-foreground">
                    {u.title}
                </h2>
                <p className="mt-2 text-sm text-foreground/70">{u.text}</p>
                <Link href="/signup" className="btn-primary mt-6 block rounded-xl py-3 text-base">
                    {u.cta}
                </Link>
                <Link href="/login" className="mt-3 block text-sm font-semibold text-primary hover:underline">
                    {u.login}
                </Link>
                <p className="mt-3 text-xs text-foreground/50">{u.noCard}</p>
            </div>
        </div>
    );
}
