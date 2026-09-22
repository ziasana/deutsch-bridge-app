"use client";

import { useEffect, useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { useI18n } from "@/componenets/I18nProvider";
import type { TextSelectionState } from "./useTextSelection";

interface SelectionActionButtonProps {
    selection: TextSelectionState;
    saving?: boolean;
    onSave: () => void;
}

const BUTTON_WIDTH = 160;
const BUTTON_HEIGHT = 40;
const GAP = 8;
const VIEWPORT_MARGIN = 8;

/** Floating "Save word"/"Save expression" pill, positioned just above the selection and clamped
 *  so it never renders outside the viewport (spec requirement - must stay reachable on mobile too). */
export default function SelectionActionButton({ selection, saving, onSave }: Readonly<SelectionActionButtonProps>) {
    const { t } = useI18n();
    const [style, setStyle] = useState<{ top: number; left: number } | null>(null);

    const isWord = selection.text.trim().split(/\s+/).length <= 1;

    useEffect(() => {
        const { rect } = selection;
        let top = rect.top - BUTTON_HEIGHT - GAP;
        if (top < VIEWPORT_MARGIN) {
            top = rect.bottom + GAP;
        }
        let left = rect.left + rect.width / 2 - BUTTON_WIDTH / 2;
        left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - BUTTON_WIDTH - VIEWPORT_MARGIN));
        setStyle({ top, left });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selection.rect.top, selection.rect.left, selection.rect.width, selection.rect.bottom]);

    if (!style) return null;

    return (
        <button
            type="button"
            disabled={saving}
            style={{ top: style.top, left: style.left, width: BUTTON_WIDTH }}
            className="fixed z-40 flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-80"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onSave}
        >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Bookmark className="size-4" />}
            {saving ? t.chat.selection.saving : isWord ? t.chat.selection.saveWord : t.chat.selection.saveExpression}
        </button>
    );
}
