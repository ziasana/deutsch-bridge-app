"use client";

import { useState } from "react";
import { BookCheck, Check, Copy, Eye, EyeOff, Lightbulb } from "lucide-react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { htmlToPlainText } from "@/lib/richTextPlainText";
import { countWords } from "./writingMeta";
import { lessonThemeVars } from "../lessonTheme";

type View = "READ" | "COMPARE";

const VIEWS: { value: View; label: string }[] = [
    { value: "READ", label: "Lesen" },
    { value: "COMPARE", label: "Mit meinem Text vergleichen" },
];

/**
 * The possible solution of a writing task, revealed on request after the learner has submitted: read it on its own or
 * side by side with the learner's own text, copy it, and hide it again.
 */
export default function WritingModelSolution({ solution, ownText }: Readonly<{ solution: string; ownText: string }>) {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<View>("READ");
    const [copied, setCopied] = useState(false);
    const plain = htmlToPlainText(solution);
    const words = countWords(plain);
    const ownWords = countWords(ownText);

    const copy = () => {
        navigator.clipboard
            ?.writeText(plain)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => toast.error("Kopieren hat nicht geklappt."));
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                style={lessonThemeVars("writing")}
                className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-primary/50 bg-primary/[0.07] p-4 text-start transition hover:-translate-y-0.5 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition group-hover:scale-110">
                    <Lightbulb className="size-6" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-base font-bold text-foreground">Mögliche Lösung anzeigen</span>
                    <span className="block text-sm text-foreground/65">Vergleiche sie danach mit deinem eigenen Text.</span>
                </span>
                <Eye className="size-5 shrink-0 text-foreground/50" aria-hidden="true" />
            </button>
        );
    }

    return (
        <section aria-label="Mögliche Lösung" style={lessonThemeVars("writing")} className="anim-fade-up overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-primary/15">
            <header className="relative overflow-hidden bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) px-5 py-4 text-white">
                <span aria-hidden="true" className="absolute -end-6 -top-8 size-28 rounded-full bg-white/10" />
                <div className="relative flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                        <BookCheck className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold leading-tight">Mögliche Lösung</h3>
                        <p className="text-xs text-white/85">So könnte ein guter Text aussehen · {words} Wörter</p>
                    </div>
                    <button
                        type="button"
                        onClick={copy}
                        aria-label="Lösung kopieren"
                        className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                        {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="Lösung verbergen"
                        className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                        <EyeOff className="size-4" aria-hidden="true" />
                    </button>
                </div>
            </header>

            <div className="space-y-4 p-5 sm:p-6">
                <div role="group" aria-label="Ansicht" className="inline-flex flex-wrap gap-1 rounded-full bg-primary/10 p-1">
                    {VIEWS.map((v) => (
                        <button
                            key={v.value}
                            type="button"
                            aria-pressed={view === v.value}
                            onClick={() => setView(v.value)}
                            className={cn(
                                "cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                view === v.value ? "bg-primary text-primary-foreground shadow-sm" : "text-primary hover:bg-primary/10",
                            )}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>

                <div className={cn("grid gap-4", view === "COMPARE" && "md:grid-cols-2")}>
                    {view === "COMPARE" && (
                        <div className="rounded-2xl bg-foreground/[0.04] p-4 ring-1 ring-border/60">
                            <p className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-foreground/50">
                                <span>Dein Text</span>
                                <span className="font-semibold normal-case tracking-normal">{ownWords} Wörter</span>
                            </p>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{ownText}</p>
                        </div>
                    )}
                    <div className="rounded-2xl border-s-4 border-primary bg-primary/[0.05] p-4">
                        {view === "COMPARE" && <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">Lösung</p>}
                        <LessonMarkdown content={solution} className="text-sm leading-relaxed text-foreground/85 [&_p]:my-2" />
                    </div>
                </div>
            </div>
        </section>
    );
}
