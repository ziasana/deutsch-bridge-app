/**
 * Some lessons (bulk-imported from JSON/AI output) were saved as markdown with the
 * line breaks stripped out, so headings, lists and tables all run together on one line.
 * This best-effort normalizer reintroduces line breaks so react-markdown can render
 * them as real headings/lists/tables. Content that already has real formatting
 * (proper newlines, or HTML from the rich text editor) is left untouched.
 */

function looksFlattened(text: string): boolean {
    if (/<\/?[a-z][\s\S]*>/i.test(text)) return false;
    const newlineCount = (text.match(/\n/g) || []).length;
    return newlineCount < 2 && text.length > 200;
}

function reconstructTables(text: string): string {
    return text.replace(/\|(?:[^|\n]*\|)+/g, (blob) => {
        const cells = blob.split("|").map((c) => c.trim());
        const inner = cells.slice(1, -1);
        const dashIndex = inner.findIndex((c) => /^:?-{2,}:?$/.test(c));
        const columnCount = dashIndex - 1;
        if (columnCount < 1) return blob;

        const rows: string[][] = [];
        let i = 0;
        while (i + columnCount <= inner.length) {
            rows.push(inner.slice(i, i + columnCount));
            i += columnCount;
            if (inner[i] === "") i += 1;
        }
        if (rows.length < 2) return blob;

        const table = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
        return `\n\n${table}\n\n`;
    });
}

export function normalizeLessonMarkdown(text: string): string {
    if (!text || !looksFlattened(text)) return text;

    let out = reconstructTables(text);
    out = out.replace(/\s+(#{1,6}\s)/g, "\n\n$1");
    out = out.replace(/\s+(>\s)/g, "\n\n$1");
    out = out.replace(/\s+(\*\*\d+\.\s)/g, "\n\n$1");
    out = out.replace(/\s+(-\s\*\*)/g, "\n$1");

    return out;
}
