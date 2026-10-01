import { describe, expect, it } from "vitest";
import { diffWords } from "./wordDiff";

describe("diffWords", () => {
    it("marks unchanged text as same", () => {
        expect(diffWords("Liebe Anna", "Liebe Anna")).toEqual([{ kind: "same", text: "Liebe Anna" }]);
    });

    it("marks replaced words as removed and added", () => {
        const parts = diffWords("Ich kann nicht kommen", "Ich kann leider nicht kommen");
        expect(parts.filter((p) => p.kind === "added").map((p) => p.text.trim())).toEqual(["leider"]);
        expect(parts.some((p) => p.kind === "removed" && p.text.trim() !== "")).toBe(false);
    });

    it("reconstructs both texts from the parts", () => {
        const a = "Ich komme morgen. Ich habe Zeit.";
        const b = "Ich komme am Samstag. Ich habe keine Zeit.";
        const parts = diffWords(a, b);
        expect(parts.filter((p) => p.kind !== "added").map((p) => p.text).join("")).toBe(a);
        expect(parts.filter((p) => p.kind !== "removed").map((p) => p.text).join("")).toBe(b);
    });
});
