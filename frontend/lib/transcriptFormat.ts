/**
 * Turns a raw audio transcript into readable paragraphs.
 *
 * - Text an admin already structured is respected: blank lines separate paragraphs and single
 *   line breaks are kept inside a paragraph.
 * - A transcript pasted as one unbroken block (typical speech-to-text output) is split into
 *   sentences and regrouped into short paragraphs, so it reads like a document, not a wall of text.
 */
export type TranscriptParagraph = string[]; // lines within one paragraph

/** Transcripts written in the admin rich text editor are HTML; older ones are plain text. */
export function isHtmlTranscript(raw: string): boolean {
    return /<\/?(p|br|h[1-6]|ul|ol|li|strong|em|b|i|u|s|blockquote|div|span|img)\b[^>]*>/i.test(raw);
}

/** True for null, whitespace, or an editor that only contains empty paragraphs ("<p></p>"). */
export function isEmptyTranscript(raw: string | null | undefined): boolean {
    if (!raw) return true;
    return raw.replace(/<img\b/gi, "x").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";
}

const MAX_SENTENCES_PER_PARAGRAPH = 4;
const MAX_CHARS_PER_PARAGRAPH = 420;
const LONG_BLOCK_CHARS = 500;

// A sentence ends at . ! ? … (optionally followed by a closing quote) and the next one starts
// with an uppercase letter, digit or opening quote - avoids splitting "z. B. etwas" or "3.5".
const SENTENCE_BOUNDARY = /(?<=[.!?…]["“”»«']?)\s+(?=["„“»«']?[A-ZÄÖÜ0-9])/u;

function splitIntoParagraphs(block: string): TranscriptParagraph[] {
    const sentences = block.split(SENTENCE_BOUNDARY).map((s) => s.trim()).filter(Boolean);
    const paragraphs: TranscriptParagraph[] = [];
    let current: string[] = [];
    let length = 0;
    for (const sentence of sentences) {
        if (current.length > 0 && (current.length >= MAX_SENTENCES_PER_PARAGRAPH || length + sentence.length > MAX_CHARS_PER_PARAGRAPH)) {
            paragraphs.push([current.join(" ")]);
            current = [];
            length = 0;
        }
        current.push(sentence);
        length += sentence.length + 1;
    }
    if (current.length > 0) paragraphs.push([current.join(" ")]);
    return paragraphs;
}

export function formatTranscript(raw: string): TranscriptParagraph[] {
    const normalized = raw.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim();
    if (!normalized) return [];

    return normalized.split(/\n\s*\n/).flatMap((block) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        // An unstructured long block gets automatic paragraphs; structured text keeps its lines.
        if (lines.length === 1 && lines[0].length > LONG_BLOCK_CHARS) {
            return splitIntoParagraphs(lines[0]);
        }
        return [lines];
    });
}
