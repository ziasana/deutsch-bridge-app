/**
 * ReadingArticle.content is stored as plain text - the reading page's click-to-define and
 * annotation-highlight engine (buildRenderSegments) locates words/phrases by raw character offset
 * into it, so it can never contain markup. These helpers let the admin form use a full HTML rich
 * text editor for a nicer authoring experience while only ever persisting plain text:
 * htmlToPlainText flattens the editor's HTML down to plain text (paragraph/list/heading breaks
 * become blank lines, inline formatting and images are dropped), and plainTextToHtml is its
 * (one-way, best-effort) inverse, used only to seed the editor's initial content from an existing
 * article - never during live editing, which stays in pure HTML round-trip to avoid fighting the
 * editor's own cursor/selection state.
 */
export function htmlToPlainText(html: string): string {
    if (typeof window === "undefined" || !html) return html;
    const doc = new DOMParser().parseFromString(html, "text/html");
    const parts: string[] = [];

    const walk = (node: ChildNode) => {
        if (node.nodeType === Node.TEXT_NODE) {
            parts.push(node.textContent ?? "");
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (tag === "br") {
            parts.push("\n");
            return;
        }

        el.childNodes.forEach(walk);
        if (tag === "p" || tag === "li" || tag === "div" || /^h[1-6]$/.test(tag)) {
            parts.push("\n\n");
        }
    };

    doc.body.childNodes.forEach(walk);
    return parts
        .join("")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function plainTextToHtml(text: string): string {
    if (!text.trim()) return "";
    return text
        .split(/\n{2,}/)
        .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
        .join("");
}
