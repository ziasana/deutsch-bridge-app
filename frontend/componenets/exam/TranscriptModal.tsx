"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { FileText, X } from "lucide-react";
import TranscriptContent from "@/componenets/exam/TranscriptContent";
import { ExamTranscript } from "@/types/exam";

interface TranscriptModalProps {
    open: boolean;
    onClose: () => void;
    transcripts: ExamTranscript[];
}

/**
 * Document-style reader for Hörverstehen transcripts: a scrollable "page" with comfortable line
 * length, 16px text and real paragraphs. Esc, the backdrop and the X button all close it.
 */
export default function TranscriptModal({ open, onClose, transcripts }: Readonly<TranscriptModalProps>) {
    const showLabels = transcripts.length > 1;

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/50 transition-opacity duration-200 data-closed:opacity-0"
            />

            <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6">
                <DialogPanel
                    transition
                    className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-card text-card-foreground shadow-2xl ring-1 ring-border transition duration-200 data-closed:scale-95 data-closed:opacity-0"
                >
                    <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-8">
                        <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                            <FileText className="size-5 text-primary" />
                            Transkript
                        </DialogTitle>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Schließen"
                            className="flex size-9 items-center justify-center rounded-lg text-foreground/60 transition hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    <div className="overflow-y-auto overscroll-contain px-5 py-6 sm:px-12 sm:py-10 [scrollbar-gutter:stable]">
                        <article lang="de" className="mx-auto max-w-[68ch] text-base leading-[1.8] text-foreground/90 hyphens-auto">
                            {transcripts.map((t, idx) => (
                                <section key={idx} className={idx > 0 ? "mt-10 border-t border-border pt-8" : ""}>
                                    {showLabels && t.label && (
                                        <h3 className="mb-4 text-lg font-semibold text-foreground">{t.label}</h3>
                                    )}
                                    <TranscriptContent transcript={t.transcript} />
                                </section>
                            ))}
                        </article>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
