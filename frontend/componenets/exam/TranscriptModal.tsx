"use client";

import { useRef, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { Headphones, Minus, Plus, X } from "lucide-react";
import TranscriptContent, { TranscriptTextSize } from "@/componenets/exam/TranscriptContent";
import { LessonAccent, lessonThemeVars } from "@/componenets/exam/lessonTheme";
import { cn } from "@/lib/utils";
import { ExamTranscript } from "@/types/exam";
import { readingColorAt } from "./readingColors";

interface TranscriptModalProps {
    open: boolean;
    onClose: () => void;
    transcripts: ExamTranscript[];
    /** Section colour; the modal is rendered outside the page, so it brings its own theme (default: listening, green). */
    accent?: LessonAccent;
}

const SIZES: TranscriptTextSize[] = ["base", "lg", "xl"];

/**
 * Reader for Hörverstehen transcripts: a gradient header, one "paper" card per text with comfortable line length,
 * a jump bar when there are several texts and a text-size control. Esc, the backdrop and the X button close it.
 */
export default function TranscriptModal({ open, onClose, transcripts, accent = "listening" }: Readonly<TranscriptModalProps>) {
    const several = transcripts.length > 1;
    const [size, setSize] = useState<TranscriptTextSize>("base");
    const sectionRefs = useRef<(HTMLElement | null)[]>([]);
    const sizeIndex = SIZES.indexOf(size);
    const titleOf = (t: ExamTranscript, idx: number) => t.label?.trim() || `Text ${idx + 1}`;

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <DialogBackdrop transition className="fixed inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-200 data-closed:opacity-0" />

            <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6">
                <DialogPanel
                    transition
                    style={lessonThemeVars(accent)}
                    className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-card text-card-foreground shadow-2xl ring-1 ring-border transition duration-200 data-closed:translate-y-4 data-closed:scale-95 data-closed:opacity-0"
                >
                    <header className="relative shrink-0 overflow-hidden bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) px-5 py-4 text-white sm:px-8 sm:py-5">
                        <span aria-hidden="true" className="absolute -end-8 -top-10 size-36 rounded-full bg-white/10" />
                        <div className="relative flex items-center gap-3">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/20">
                                <Headphones className="size-6" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <DialogTitle className="text-lg font-extrabold leading-tight">Transkript</DialogTitle>
                                <p className="text-xs text-white/85">
                                    {several ? `${transcripts.length} Hörtexte zum Nachlesen` : "Lies mit, was du gehört hast"}
                                </p>
                            </div>
                            <div role="group" aria-label="Schriftgröße" className="flex shrink-0 items-center rounded-full bg-white/20 p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setSize(SIZES[Math.max(0, sizeIndex - 1)])}
                                    disabled={sizeIndex === 0}
                                    aria-label="Schrift kleiner"
                                    className="flex size-8 cursor-pointer items-center justify-center rounded-full transition hover:bg-white/25 disabled:cursor-default disabled:opacity-40"
                                >
                                    <Minus className="size-4" aria-hidden="true" />
                                </button>
                                <span aria-hidden="true" className="px-1 text-sm font-extrabold">Aa</span>
                                <button
                                    type="button"
                                    onClick={() => setSize(SIZES[Math.min(SIZES.length - 1, sizeIndex + 1)])}
                                    disabled={sizeIndex === SIZES.length - 1}
                                    aria-label="Schrift größer"
                                    className="flex size-8 cursor-pointer items-center justify-center rounded-full transition hover:bg-white/25 disabled:cursor-default disabled:opacity-40"
                                >
                                    <Plus className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Schließen"
                                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/20 transition hover:bg-white/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                <X className="size-5" aria-hidden="true" />
                            </button>
                        </div>
                    </header>

                    {several && (
                        <nav aria-label="Hörtexte" className="flex shrink-0 gap-2 overflow-x-auto border-b border-border bg-accent/40 px-5 py-2.5 sm:px-8">
                            {transcripts.map((t, idx) => {
                                const c = readingColorAt(idx);
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => sectionRefs.current[idx]?.scrollIntoView?.({ block: "start", behavior: "smooth" })}
                                        className={cn("shrink-0 cursor-pointer rounded-full px-3.5 py-1 text-xs font-bold transition hover:opacity-80", c.soft, c.text)}
                                    >
                                        {titleOf(t, idx)}
                                    </button>
                                );
                            })}
                        </nav>
                    )}

                    <div className="space-y-5 overflow-y-auto overscroll-contain bg-accent/20 px-4 py-5 sm:px-8 sm:py-7 [scrollbar-gutter:stable]">
                        {transcripts.map((t, idx) => {
                            const c = readingColorAt(idx);
                            return (
                                <section
                                    key={idx}
                                    ref={(el) => {
                                        sectionRefs.current[idx] = el;
                                    }}
                                    aria-label={titleOf(t, idx)}
                                    className="scroll-mt-2 overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-border/60"
                                >
                                    {several && (
                                        <div className={cn("flex items-center gap-3 px-5 py-2.5", c.soft)}>
                                            <span className={cn("flex size-7 items-center justify-center rounded-lg text-xs font-extrabold text-white", c.solid)}>{idx + 1}</span>
                                            <h3 className="font-bold text-foreground">{titleOf(t, idx)}</h3>
                                        </div>
                                    )}
                                    <article lang="de" className="mx-auto max-w-[68ch] px-5 py-5 text-foreground/90 hyphens-auto sm:px-8 sm:py-7">
                                        <TranscriptContent transcript={t.transcript} size={size} />
                                    </article>
                                </section>
                            );
                        })}
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
