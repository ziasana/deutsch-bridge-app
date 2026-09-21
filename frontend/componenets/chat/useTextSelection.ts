"use client";

import { RefObject, useEffect, useState } from "react";

export interface TextSelectionState {
    text: string;
    /** Viewport-relative rect of the selection, for positioning a floating action near it. */
    rect: DOMRect;
}

/** Tracks the current text selection, but only while it falls entirely inside `containerRef`.
 *  Selections elsewhere on the page (or with no container match) are ignored, so this never
 *  interferes with normal browser selection outside AI Tutor messages. */
export function useTextSelection(containerRef: RefObject<HTMLElement | null>): TextSelectionState | null {
    const [selection, setSelection] = useState<TextSelectionState | null>(null);

    useEffect(() => {
        const clear = () => setSelection(null);

        const handleSelectionChange = () => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
                clear();
                return;
            }

            const text = sel.toString().trim();
            if (!text) {
                clear();
                return;
            }

            const container = containerRef.current;
            const anchorNode = sel.anchorNode;
            const focusNode = sel.focusNode;
            if (!container || !anchorNode || !focusNode || !container.contains(anchorNode) || !container.contains(focusNode)) {
                clear();
                return;
            }

            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) {
                clear();
                return;
            }

            setSelection({ text, rect });
        };

        document.addEventListener("selectionchange", handleSelectionChange);
        window.addEventListener("scroll", clear, true);
        window.addEventListener("resize", clear);

        return () => {
            document.removeEventListener("selectionchange", handleSelectionChange);
            window.removeEventListener("scroll", clear, true);
            window.removeEventListener("resize", clear);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return selection;
}
