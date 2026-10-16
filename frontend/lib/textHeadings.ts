/**
 * Information texts (DTZ Lesen Teil 4) have subtitles such as "Öffnungszeiten" or "Mitgliedschaft und Gebühren" as short lines in front of
 * their paragraph. Stored as plain lines they look like body text; this turns them into real headings (like a Word document) when the
 * text is shown to the learner. A line is a subtitle when it is short, starts with a capital, has no sentence punctuation at the end and
 * is followed by more text. Anything else is left untouched.
 */
const MAX_WORDS = 7;
const MAX_LENGTH = 60;

function isSubtitle(line: string): boolean {
    const text = line.trim();
    if (!text || text.length > MAX_LENGTH || text.includes("<")) return false;
    if (!/^\p{Lu}/u.test(text)) return false;
    if (/[.!?:;,]$/.test(text)) return false;
    return text.split(/\s+/).length <= MAX_WORDS;
}

export function formatTextHeadings(html: string): string {
    const blocks = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)];
    if (blocks.length === 0 || blocks.map((b) => b[0]).join("") !== html) return html;
    const out: string[] = [];
    blocks.forEach((block, index) => {
        const lines = block[1].split(/<br\s*\/?>/);
        // leading subtitle lines of a paragraph ("Öffnungszeiten<br>Das Zentrum ...")
        let i = 0;
        while (i < lines.length - 1 && isSubtitle(lines[i])) {
            out.push(`<h3>${lines[i].trim()}</h3>`);
            i++;
        }
        const rest = lines.slice(i);
        // a paragraph that is only a subtitle, followed by another paragraph
        if (rest.length === 1 && i === 0 && isSubtitle(rest[0]) && index < blocks.length - 1) {
            out.push(`<h3>${rest[0].trim()}</h3>`);
        } else if (rest.length > 0) {
            out.push(`<p>${rest.join("<br>")}</p>`);
        }
    });
    return out.join("");
}
