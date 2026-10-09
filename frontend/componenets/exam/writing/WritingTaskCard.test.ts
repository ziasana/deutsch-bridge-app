// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { parseWritingTask } from "./WritingTaskCard";

describe("parseWritingTask", () => {
    it("splits a task into intro, e-mail, instruction, points and hint", () => {
        const task = parseWritingTask(
            "<p><em>Sie haben eine E-Mail erhalten:</em></p><blockquote><p>Guten Tag</p></blockquote><p>Antworten Sie.</p><ul><li>Punkt A</li><li>Punkt B</li></ul><p>Überlegen Sie.</p>",
        );
        expect(task?.intro).toHaveLength(1);
        expect(task?.email).toContain("Guten Tag");
        expect(task?.instruction).toHaveLength(1);
        expect(task?.points).toEqual(["Punkt A", "Punkt B"]);
        expect(task?.hint).toHaveLength(1);
    });

    it("returns null for plain text without an e-mail or points", () => {
        expect(parseWritingTask("<p>Schreiben Sie einen Text.</p>")).toBeNull();
    });
});
