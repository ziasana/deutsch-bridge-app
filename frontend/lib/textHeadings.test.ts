import { describe, expect, it } from "vitest";
import { formatTextHeadings } from "./textHeadings";

describe("formatTextHeadings", () => {
    it("turns the subtitle line in front of a paragraph into a heading", () => {
        expect(formatTextHeadings("<p>Einleitung ist ein langer Satz mit Punkt.</p><p>Öffnungszeiten<br>Das Zentrum ist geöffnet.<br>Sonntags geschlossen.</p>")).toBe(
            "<p>Einleitung ist ein langer Satz mit Punkt.</p><h3>Öffnungszeiten</h3><p>Das Zentrum ist geöffnet.<br>Sonntags geschlossen.</p>",
        );
    });

    it("turns a paragraph that is only a short title into a heading when more text follows", () => {
        expect(formatTextHeadings("<p>Mitgliedschaft und Gebühren</p><p>Die Mitgliedschaft kostet 12 Euro.</p>")).toBe(
            "<h3>Mitgliedschaft und Gebühren</h3><p>Die Mitgliedschaft kostet 12 Euro.</p>",
        );
    });

    it("leaves sentences, long lines, lines ending in punctuation and a last short paragraph alone", () => {
        const html = "<p>Das Zentrum ist offen.<br>Kontakt</p><p>Bitte melden Sie sich rechtzeitig an, damit wir planen können</p><p>Telefon:<br>030 555</p><p>Ende</p>";
        expect(formatTextHeadings(html)).toBe(html);
    });

    it("leaves markup it does not understand untouched", () => {
        const html = "<p><em>Von: Max</em></p><div>Titel</div>";
        expect(formatTextHeadings(html)).toBe(html);
    });
});
