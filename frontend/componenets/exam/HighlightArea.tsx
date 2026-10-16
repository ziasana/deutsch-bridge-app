"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Eraser, Highlighter, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

/** Elements that are answer controls: a drag that starts or ends inside one is never a marking. */
const NOT_MARKABLE = "button, select, input, textarea, label, [data-no-highlight]";

/**
 * The marker for a reading text: a toolbar (four colours, eraser, "delete all") and the area whose text the learner can mark by
 * dragging with the mouse or the finger. The markings use the CSS Custom Highlight API, so the (React-managed) text is never changed and
 * they stay while the questions below change. Text inside buttons and form controls cannot be marked. Browsers without the API show
 * the content without the toolbar.
 *
 * `variant="panel"`: the toolbar is a strip inside a card (the Lesen Teil 2 text panel); `"floating"`: a rounded bar above the content
 * of a whole board (texts and tasks together).
 */
export default function HighlightArea({ children, variant = "floating", bodyClassName }: Readonly<{ children: ReactNode; variant?: "panel" | "floating"; bodyClassName?: string }>) {
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

    const markable = useCallback((range: Range) => {
        const body = bodyRef.current;
        if (!body || !body.contains(range.commonAncestorContainer)) return false;
        const node = range.commonAncestorContainer;
        const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
        return !!element && !element.closest(NOT_MARKABLE);
    }, []);

    const apply = useCallback(() => {
        const body = bodyRef.current;
        const selection = typeof window === "undefined" ? null : window.getSelection();
        if (!body || !selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const inside = markable(range);

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
    }, [markable, mode, paint]);

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

    const toolbar = (
        <>
            {canHighlight && <style>{HIGHLIGHT_CSS}</style>}
            {canHighlight && (
                <div role="toolbar" aria-label="Markierstift" className={cn("flex flex-wrap items-center gap-2 bg-accent/40 px-5 py-2.5", variant === "panel" ? "border-b border-border/60" : "rounded-2xl border border-border/60")}>
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

        </>
    );

    const body = (
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
                    if (typeof window === "undefined") return; // the page (or test environment) is already gone
                    if (mode === "eraser" && window.getSelection()?.isCollapsed) eraseAt(clientX, clientY);
                    else apply();
                }, 0);
            }}
            className={cn(bodyClassName, canHighlight && mode && "cursor-text")}
        >
            {children}
        </div>
    );

    return variant === "panel" ? (
        <>
            {toolbar}
            {body}
        </>
    ) : (
        <div className="space-y-4">
            {toolbar}
            {body}
        </div>
    );
}
