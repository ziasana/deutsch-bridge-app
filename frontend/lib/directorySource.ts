/**
 * The information source of DTZ Lesen Teil 1 is stored as HTML: an optional introduction paragraph, then one paragraph per entry
 * (`<p><strong>heading</strong><br>detail<br>detail</p>`), all text escaped. This reads it back into entries so the learner screen can
 * draw a signboard with a sign plate per entry. Content that does not have this shape (hand-made exercises) returns null and is shown
 * as it is.
 */
export interface DirectoryEntry {
    id: string;
    heading: string;
    /** The short plate in front of the title ("4. OG", "Raum 12"), when the heading has the form "plate – title". */
    plate: string | null;
    title: string;
    details: string[];
}

export interface DirectorySource {
    intro: string[];
    entries: DirectoryEntry[];
}

const unescapeHtml = (text: string) =>
    text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

const PLATE = /^(.{1,14}?)\s[–—-]\s(.+)$/;

export function parseDirectorySource(html: string | null | undefined): DirectorySource | null {
    if (!html) return null;
    const blocks = html.match(/<p>[\s\S]*?<\/p>/g);
    if (!blocks || blocks.join("") !== html.trim()) return null;
    const intro: string[] = [];
    const entries: DirectoryEntry[] = [];
    for (const block of blocks) {
        const inner = block.slice(3, -4);
        const strong = /^<strong>([\s\S]*?)<\/strong>(?:<br\s*\/?>)?([\s\S]*)$/.exec(inner);
        if (!strong || /<[^>]+>/.test(strong[1])) {
            const text = unescapeHtml(inner.replace(/<br\s*\/?>/g, " ").trim());
            if (entries.length === 0 && text && !/<[^>]+>/.test(text)) intro.push(text);
            else return null;
            continue;
        }
        const heading = unescapeHtml(strong[1].trim());
        const details = strong[2].split(/<br\s*\/?>/).map((d) => unescapeHtml(d.trim())).filter(Boolean);
        if (details.some((d) => /<[^>]+>/.test(d))) return null;
        const plate = PLATE.exec(heading);
        entries.push({ id: `entry-${entries.length}`, heading, plate: plate ? plate[1] : null, title: plate ? plate[2] : heading, details });
    }
    return entries.length > 0 ? { intro, entries } : null;
}

const normalize = (text: string) => text.toLocaleLowerCase("de-DE");

/** Whether an entry contains the search text anywhere (plate, title or details). */
export function entryMatches(entry: DirectoryEntry, query: string): boolean {
    const q = normalize(query.trim());
    return q === "" || normalize([entry.plate ?? "", entry.title, ...entry.details].join(" ")).includes(q);
}
