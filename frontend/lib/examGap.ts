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
