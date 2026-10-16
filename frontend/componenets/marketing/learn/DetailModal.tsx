"use client";

import { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";

/** The dashboard's detail dialog shell: dim backdrop, sheet on phones, Escape or a click outside closes it. */
export default function DetailModal({ label, onClose, children }: Readonly<{ label: string; onClose: () => void; children: ReactNode }>) {
    const closeRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        closeRef.current?.focus();
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label={label}
                className="anim-pop relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[10px] bg-card shadow-2xl sm:rounded-[10px]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    ref={closeRef}
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute end-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-card/90 text-foreground/60 shadow-card backdrop-blur-sm transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <X className="size-4" />
                </button>
                {children}
            </div>
        </div>
    );
}
