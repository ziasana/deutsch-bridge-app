"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, MoreVertical, Pencil, Trash2, Check, X } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import ConfirmDialog from "@/componenets/ui/ConfirmDialog";

interface TutorHeaderProps {
    title: string | null;
    onRename: (title: string) => void;
    onDelete: () => void;
}

/** Compact conversation header: title + a "..." menu for Rename/Delete (spec s7) - no other AI
 *  controls cluttering it. */
export default function TutorHeader({ title, onRename, onDelete }: Readonly<TutorHeaderProps>) {
    const { t } = useI18n();
    const [menuOpen, setMenuOpen] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [draftTitle, setDraftTitle] = useState(title ?? "");
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
                setRenaming(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const startRename = () => {
        setDraftTitle(title ?? "");
        setRenaming(true);
        setMenuOpen(false);
    };

    const submitRename = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!draftTitle.trim()) return;
        onRename(draftTitle.trim());
        setRenaming(false);
    };

    return (
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
                <Sparkles className="size-4 shrink-0 text-primary" />
                {renaming ? (
                    <form onSubmit={submitRename} className="flex items-center gap-1.5">
                        <input
                            autoFocus
                            value={draftTitle}
                            onChange={(e) => setDraftTitle(e.target.value)}
                            placeholder={t.chat.setTitlePlaceholder}
                            className="rounded-lg border border-border/60 bg-background px-2 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                        />
                        <button type="submit" aria-label={t.chat.save} className="rounded-md p-1 text-primary hover:bg-accent">
                            <Check className="size-4" />
                        </button>
                        <button
                            type="button"
                            aria-label={t.chat.cancel}
                            onClick={() => setRenaming(false)}
                            className="rounded-md p-1 text-foreground/50 hover:bg-accent"
                        >
                            <X className="size-4" />
                        </button>
                    </form>
                ) : (
                    <h1 className="truncate text-base font-semibold text-foreground">{title ?? t.chat.yourAiTutor}</h1>
                )}
            </div>

            {!renaming && title && (
                <div className="relative shrink-0" ref={menuRef}>
                    <button
                        type="button"
                        aria-label={t.chat.rename}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((v) => !v)}
                        className="flex size-8 items-center justify-center rounded-full text-foreground/50 transition hover:bg-accent hover:text-foreground"
                    >
                        <MoreVertical className="size-4" />
                    </button>
                    {menuOpen && (
                        <div
                            role="menu"
                            className="absolute right-0 top-full z-30 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-border/60 bg-card py-1 text-sm shadow-lg"
                        >
                            <button
                                role="menuitem"
                                type="button"
                                onClick={startRename}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground transition hover:bg-accent"
                            >
                                <Pencil className="size-3.5" />
                                {t.chat.rename}
                            </button>
                            <button
                                role="menuitem"
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    setConfirmDeleteOpen(true);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-500 transition hover:bg-accent"
                            >
                                <Trash2 className="size-3.5" />
                                {t.chat.delete}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDeleteOpen}
                title={t.chat.delete}
                message={t.chat.confirmDelete}
                confirmLabel={t.chat.delete}
                cancelLabel={t.chat.cancel}
                onConfirm={() => {
                    setConfirmDeleteOpen(false);
                    onDelete();
                }}
                onCancel={() => setConfirmDeleteOpen(false)}
            />
        </div>
    );
}
