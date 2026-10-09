import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Contract shared between the rich-text editor's "insert blank" button, the admin page's
 * gap-question auto-sync, and the student-facing renderer: a Sprachbausteine gap is embedded
 * directly in passage HTML as <span data-exam-gap="N">N</span>.
 */
export const GAP_ATTR = "data-exam-gap";

export function extractGapNumbers(html: string): number[] {
    return [...html.matchAll(/data-exam-gap="(\d+)"/g)].map((m) => Number(m[1]));
}

// Gaps in content written before the gap badge existed: the number underlined (and usually bold), e.g. <u>21 </u> or <strong><u>21</u></strong>.
const LEGACY_GAP =
    /<(u|ins)>\s*(?:\*\*|<(strong|b)>)?\s*(\d{1,3})\s*(?:\*\*|<\/\2>)?\s*<\/\1>|<(strong|b)>\s*<(u|ins)>\s*(\d{1,3})\s*<\/\5>\s*<\/\4>/gi;

/** Turns legacy underlined-number gaps into the gap badge markup; content that already has badges is returned as is. */
export function withGapMarkers(html: string | null | undefined): string {
    if (!html || html.includes(GAP_ATTR)) return html ?? "";
    return html.replace(LEGACY_GAP, (_m, _u, _s, n1, _s2, _u2, n2) => {
        const n = n1 ?? n2;
        return `<span ${GAP_ATTR}="${n}" class="exam-gap-marker">${n}</span> `;
    });
}

export const hasGapMarkers = (html: string | null | undefined): boolean => withGapMarkers(html).includes(GAP_ATTR);

export const ExamGap = Node.create({
    name: "examGap",
    group: "inline",
    inline: true,
    atom: true,
    selectable: true,

    addAttributes() {
        return {
            number: { default: 1 },
        };
    },

    parseHTML() {
        return [
            {
                tag: `span[${GAP_ATTR}]`,
                getAttrs: (el) => ({ number: Number((el as HTMLElement).getAttribute(GAP_ATTR)) }),
            },
        ];
    },

    renderHTML({ node }) {
        return [
            "span",
            mergeAttributes({ [GAP_ATTR]: node.attrs.number, class: "exam-gap-marker" }),
            String(node.attrs.number),
        ];
    },
});
