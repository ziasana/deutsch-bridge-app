"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Clock, Eraser, Highlighter, Trash2 } from "lucide-react";
import LessonMarkdown from "@/componenets/LessonMarkdown";
import { resolveUploadUrl } from "@/lib/backendOrigin";
import { cn } from "@/lib/utils";
import { ExamPassagePublic } from "@/types/exam";

const wordCount = (html: string) => html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

/** Marker colours; each has a `::highlight(hl-<id>)` rule in HIGHLIGHT_CSS. */
const PENS = [
    { id: "yellow", label: "Gelb", swatch: "bg-yellow-300" },
    { id: "green", label: "Grün", swatch: "bg-green-400" },
    { id: "pink", label: "Rosa", swatch: "bg-pink-400" },
    { id: "blue", label: "Blau", swatch: "bg-sky-400" },
] as const;
type PenId = (typeof PENS)[number]["id"];
type Mode = PenId | "eraser" | null;

/**
 * Injected as a runtime <style> instead of living in globals.css: the CSS build pipeline (lightningcss) does not know
 * the `::highlight()` pseudo-element yet and fails the build on it.
 */
const HIGHLIGHT_CSS = `
::highlight(hl-yellow) { background-color: rgb(250 204 21 / 0.55); color: inherit; }
::highlight(hl-green) { background-color: rgb(74 222 128 / 0.5); color: inherit; }
::highlight(hl-pink) { background-color: rgb(244 114 182 / 0.5); color: inherit; }
::highlight(hl-blue) { background-color: rgb(56 189 248 / 0.5); color: inherit; }
`;

// The CSS Custom Highlight API paints ranges without touching the (React-managed) DOM.
type HighlightRegistry = Map<string, unknown>;
const registry = (): HighlightRegistry | null =>
    typeof CSS !== "undefined" ? ((CSS as unknown as { highlights?: HighlightRegistry }).highlights ?? null) : null;
const highlightCtor = (): (new (...ranges: Range[]) => unknown) | null =>
    typeof window !== "undefined" ? ((window as unknown as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight ?? null) : null;
export const supportsHighlighting = () => registry() !== null && highlightCtor() !== null;

/** The text position under a point, for erasing a marking by clicking it. */
function caretAt(x: number, y: number): { node: Node; offset: number } | null {
    const doc = document as Document & {
        caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
        caretRangeFromPoint?: (x: number, y: number) => Range | null;
    };
    const pos = doc.caretPositionFromPoint?.(x, y);
    if (pos) return { node: pos.offsetNode, offset: pos.offset };
    const range = doc.caretRangeFromPoint?.(x, y);
    return range ? { node: range.startContainer, offset: range.startOffset } : null;
}

/**
 * Lesen Teil 2: the text as a "magazine page" with a marker toolbar. The learner marks passages in four colours (mouse
 * drag or finger selection) to think about them while answering; the markings stay while the questions below change.
 */
export default function LesenTextPanel({ passages }: Readonly<{ passages: ExamPassagePublic[] }>) {
    const words = passages.reduce((sum, p) => sum + wordCount(p.content ?? ""), 0);
    const bodyRef = useRef<HTMLDivElement>(null);
    const ranges = useRef<Record<PenId, Range[]>>({ yellow: [], green: [], pink: [], blue: [] });
    const pointerType = useRef<string>("mouse");
    const [mode, setMode] = useState<Mode>("yellow");
    const [count, setCount] = useState(0);
    const canHighlight = typeof window !== "undefined" && supportsHighlighting();

    const paint = useCallback(() => {
        const reg = registry();
        const Highlight = highlightCtor();
        if (!reg || !Highlight) return;
        for (const pen of PENS) {
            if (ranges.current[pen.id].length > 0) reg.set(`hl-${pen.id}`, new Highlight(...ranges.current[pen.id]));
            else reg.delete(`hl-${pen.id}`);
        }
        setCount(PENS.reduce((n, pen) => n + ranges.current[pen.id].length, 0));
    }, []);

    useEffect(
        () => () => {
            const reg = registry();
            for (const pen of PENS) reg?.delete(`hl-${pen.id}`);
        },
        [],
    );

    const apply = useCallback(() => {
        const body = bodyRef.current;
        const selection = window.getSelection();
        if (!body || !selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const inside = body.contains(range.commonAncestorContainer);

        if (mode === "eraser") {
            let changed = false;
            const hit = (r: Range) => {
                if (range.collapsed) return false;
                return r.compareBoundaryPoints(Range.END_TO_START, range) < 0 && r.compareBoundaryPoints(Range.START_TO_END, range) > 0;
            };
            if (inside && !range.collapsed) {
                for (const pen of PENS) {
                    const kept = ranges.current[pen.id].filter((r) => !hit(r));
                    if (kept.length !== ranges.current[pen.id].length) changed = true;
                    ranges.current[pen.id] = kept;
                }
            }
            if (changed) {
                paint();
                selection.removeAllRanges();
            }
            return;
        }

        if (!mode || !inside || range.collapsed || !range.toString().trim()) return;
        ranges.current[mode].push(range.cloneRange());
        paint();
        selection.removeAllRanges();
    }, [mode, paint]);

    // A click (not a drag) on a marking erases it while the eraser is active.
    const eraseAt = (x: number, y: number) => {
        const caret = caretAt(x, y);
        if (!caret) return;
        let changed = false;
        for (const pen of PENS) {
            const kept = ranges.current[pen.id].filter((r) => !r.isPointInRange(caret.node, caret.offset));
            if (kept.length !== ranges.current[pen.id].length) changed = true;
            ranges.current[pen.id] = kept;
        }
        if (changed) paint();
    };

    // Finger selections are only final a moment after the touch ends (the handles can still move).
    useEffect(() => {
        if (!canHighlight || !mode) return;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const onChange = () => {
            if (pointerType.current !== "touch") return;
            clearTimeout(timer);
            timer = setTimeout(apply, 700);
        };
        document.addEventListener("selectionchange", onChange);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("selectionchange", onChange);
        };
    }, [apply, canHighlight, mode]);

    const clearAll = () => {
        for (const pen of PENS) ranges.current[pen.id] = [];
        paint();
    };

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

            {canHighlight && <style>{HIGHLIGHT_CSS}</style>}
            {canHighlight && (
                <div role="toolbar" aria-label="Markierstift" className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-accent/40 px-5 py-2.5">
                    <Highlighter className="size-4 text-primary" aria-hidden="true" />
                    <div className="flex items-center gap-1.5">
                        {PENS.map((pen) => (
                            <button
                                key={pen.id}
                                type="button"
                                aria-pressed={mode === pen.id}
                                aria-label={`Markieren: ${pen.label}`}
                                onClick={() => setMode(mode === pen.id ? null : pen.id)}
                                className={cn(
                                    "size-7 cursor-pointer rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    pen.swatch,
                                    mode === pen.id ? "scale-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-card" : "opacity-70 hover:opacity-100",
                                )}
                            />
                        ))}
                        <button
                            type="button"
                            aria-pressed={mode === "eraser"}
                            aria-label="Radierer"
                            onClick={() => setMode(mode === "eraser" ? null : "eraser")}
                            className={cn(
                                "flex size-7 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground/70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                mode === "eraser" && "scale-110 ring-2 ring-foreground/70 ring-offset-2 ring-offset-card",
                            )}
                        >
                            <Eraser className="size-4" aria-hidden="true" />
                        </button>
                    </div>
                    <p className="min-w-0 flex-1 basis-40 text-xs text-foreground/60">
                        {mode === "eraser"
                            ? "Tippe auf eine Markierung oder ziehe darüber, um sie zu löschen."
                            : mode
                                ? "Ziehe über eine Textstelle, um sie zu markieren."
                                : "Wähle eine Farbe, um wichtige Stellen zu markieren."}
                    </p>
                    {count > 0 && (
                        <button
                            type="button"
                            onClick={clearAll}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-foreground/60 transition hover:bg-card hover:text-foreground"
                        >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            Alle löschen ({count})
                        </button>
                    )}
                </div>
            )}

            <div
                ref={bodyRef}
                onPointerDown={(e) => {
                    pointerType.current = e.pointerType;
                }}
                onPointerUp={(e) => {
                    if (!canHighlight || e.pointerType === "touch") return;
                    const { clientX, clientY } = e;
                    // Let the browser finalise the selection first.
                    setTimeout(() => {
                        if (mode === "eraser" && window.getSelection()?.isCollapsed) eraseAt(clientX, clientY);
                        else apply();
                    }, 0);
                }}
                className={cn("space-y-4 px-5 py-5 sm:px-6", canHighlight && mode && "cursor-text")}
            >
                {passages.map((p) => {
                    const image = resolveUploadUrl(p.imageUrl);
                    return (
                        <div key={p.id} className="space-y-3">
                            {image && <img src={image} alt="" className="max-h-56 w-full rounded-2xl object-cover" />}
                            {p.content && <LessonMarkdown content={p.content} className="text-base leading-loose text-foreground/90" />}
                        </div>
                    );
                })}
            </div>
        </article>
    );
}
