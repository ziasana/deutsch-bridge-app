import { describe, expect, it } from "vitest";
import { entryMatches, parseDirectorySource } from "./directorySource";

const HTML =
    "<p>Willkommen im Rathaus.</p>" +
    "<p><strong>4. OG – Umweltamt</strong><br>Sperrmüll &amp; Abfall<br>Mo–Fr 8–12 Uhr</p>" +
    "<p><strong>Information</strong><br>Auskunft für alle Fragen</p>";

describe("parseDirectorySource", () => {
    it("reads the introduction and the entries with plate, title and details", () => {
        const source = parseDirectorySource(HTML)!;
        expect(source.intro).toEqual(["Willkommen im Rathaus."]);
        expect(source.entries).toHaveLength(2);
        expect(source.entries[0]).toMatchObject({ plate: "4. OG", title: "Umweltamt", details: ["Sperrmüll & Abfall", "Mo–Fr 8–12 Uhr"] });
        expect(source.entries[1]).toMatchObject({ plate: null, title: "Information", details: ["Auskunft für alle Fragen"] });
    });

    it("returns null for content without entries or with other markup", () => {
        expect(parseDirectorySource("")).toBeNull();
        expect(parseDirectorySource("<p>Nur ein Text.</p>")).toBeNull();
        expect(parseDirectorySource("<p><strong>A</strong><br>x</p><div>y</div>")).toBeNull();
        expect(parseDirectorySource("<p><strong>A</strong><br><em>x</em></p>")).toBeNull();
    });
});

describe("entryMatches", () => {
    const entry = parseDirectorySource(HTML)!.entries[0];
    it("finds text in the plate, title and details, ignoring case", () => {
        expect(entryMatches(entry, "")).toBe(true);
        expect(entryMatches(entry, "umwelt")).toBe(true);
        expect(entryMatches(entry, "SPERRMÜLL")).toBe(true);
        expect(entryMatches(entry, "4. og")).toBe(true);
        expect(entryMatches(entry, "Bibliothek")).toBe(false);
    });
});
