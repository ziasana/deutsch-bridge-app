"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Plus, X } from "lucide-react";
import { getRedemittel } from "@/services/redemittelService";
import RedemittelDetailCard from "./RedemittelDetailCard";
import { useRedemittelActions } from "./useRedemittelActions";

interface Props {
    /** Id of the Redemittel to show; the dialog is closed when null. */
    redemittelId: string | null;
    onClose: () => void;
}

/**
 * Opens a shared Redemittel (the same record the learning module uses) from anywhere - Schreiben,
 * exam preparation - with the option to learn it or save it to the personal collection.
 */
export default function RedemittelDetailDialog({ redemittelId, onClose }: Readonly<Props>) {
    const closeRef = useRef<HTMLButtonElement>(null);
    const { toggleSave, learn } = useRedemittelActions();

    const { data: redemittel, isLoading, isError } = useQuery({
        queryKey: ["redemittel", "detail", redemittelId],
        queryFn: () => getRedemittel(redemittelId as string).then((res) => res.data),
        enabled: redemittelId !== null,
    });

    useEffect(() => {
        if (!redemittelId) return;
        closeRef.current?.focus();
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [redemittelId, onClose]);

    if (!redemittelId) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Redemittel"
                className="anim-pop relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[10px] bg-card shadow-2xl sm:rounded-[10px]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    ref={closeRef}
                    type="button"
                    onClick={onClose}
                    aria-label="Schließen"
                    className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-card/90 text-foreground/60 shadow-card backdrop-blur-sm transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
                >
                    <X className="size-4" />
                </button>
                <div>
                    {isLoading && <p className="p-10 pt-14 text-center text-sm text-foreground/60">Wird geladen …</p>}
                    {isError && <p className="p-10 pt-14 text-center text-sm text-foreground/60">Dieses Redemittel ist nicht verfügbar.</p>}
                    {redemittel && (
                        <RedemittelDetailCard
                            embedded
                            redemittel={redemittel}
                            onToggleSave={(r) => toggleSave.mutate(r)}
                            saving={toggleSave.isPending}
                        >
                            {redemittel.status === "NEW" ? (
                                <button
                                    type="button"
                                    onClick={() => learn.mutate(redemittel)}
                                    disabled={learn.isPending}
                                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 cursor-pointer"
                                >
                                    <Plus className="size-4" aria-hidden="true" />
                                    Lernen
                                </button>
                            ) : (
                                <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 text-sm font-semibold text-green-700 dark:text-green-400">
                                    <Check className="size-4" aria-hidden="true" />
                                    Bereits in deinem Lernplan
                                </span>
                            )}
                        </RedemittelDetailCard>
                    )}
                </div>
            </div>
        </div>
    );
}
