"use client";

import { BookOpen, Clock } from "lucide-react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import HighlightArea from "./HighlightArea";
import { ExamPassagePublic } from "@/types/exam";

export { supportsHighlighting } from "./HighlightArea";

const wordCount = (html: string) => html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

/**
 * Lesen Teil 2: the text as a "magazine page" with a marker toolbar. The learner marks passages in four colours (mouse
 * drag or finger selection) to think about them while answering; the markings stay while the questions below change.
 */
export default function LesenTextPanel({ passages }: Readonly<{ passages: ExamPassagePublic[] }>) {
    const words = passages.reduce((sum, p) => sum + wordCount(p.content ?? ""), 0);
    return (
        <article aria-label="Lesetext" className="overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-primary/15">
            <header className="relative overflow-hidden bg-gradient-to-br from-(--lesson-from) to-(--lesson-to) px-5 py-4 text-white">
                <span aria-hidden="true" className="absolute -end-6 -top-8 size-28 rounded-full bg-white/10" />
                <div className="relative flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                        <BookOpen className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <p className="font-bold leading-tight">Lies den Text</p>
                        {words > 0 && (
                            <p className="flex items-center gap-1 text-xs text-white/85">
                                <Clock className="size-3" aria-hidden="true" />
                                {words} Wörter · ca. {Math.max(1, Math.round(words / 150))} Min.
                            </p>
                        )}
                    </div>
                </div>
            </header>

            <HighlightArea variant="panel" bodyClassName="space-y-4 px-5 py-5 sm:px-6">
                {passages.map((p) => {
                    const image = resolveUploadUrl(p.imageUrl);
                    return (
                        <div key={p.id} className="space-y-3">
                            {image && <img src={image} alt="" className="max-h-56 w-full rounded-2xl object-cover" />}
                            {p.content && <LessonMarkdown content={p.content} className="text-base leading-loose text-foreground/90" />}
                        </div>
                    );
                })}
            </HighlightArea>
        </article>
    );
}
