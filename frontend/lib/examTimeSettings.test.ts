import { describe, expect, it } from "vitest";
import { checkTotal, DraftRow, parseMinutes, rowError, sumTowardsTotal } from "./examTimeSettings";
import { ExamSection } from "@/types/exam";

const row = (section: ExamSection, teil: number, minutes: string, opts: { enabled?: boolean; id?: string | null } = {}): DraftRow => ({
    entry: { id: opts.id === undefined ? "x" : opts.id, section, teil, recommendedMinutes: null, enabled: true },
    minutes,
    enabled: opts.enabled ?? true,
});

describe("parseMinutes", () => {
    it.each(["15", "20", "1", "180"])("accepts %s", (v) => {
        expect(parseMinutes(v, 1, 180).kind).toBe("ok");
    });

    it.each(["0", "-5", "20.5", "abc", "181", "1e2"])("rejects %s", (v) => {
        expect(parseMinutes(v, 1, 180).kind).toBe("invalid");
    });

    it("treats empty input as blank", () => {
        expect(parseMinutes("  ", 1, 180).kind).toBe("blank");
    });
});

describe("rowError", () => {
    it("requires a value for parts that already exist", () => {
        expect(rowError(row("LESEVERSTEHEN", 1, ""), 1, 180)).toBe("Please enter a whole number between 1 and 180 minutes.");
    });

    it("lets a never-configured part stay blank", () => {
        expect(rowError(row("LESEVERSTEHEN", 1, "", { id: null }), 1, 180)).toBeNull();
    });
});

describe("total check", () => {
    const b1 = [
        row("LESEVERSTEHEN", 1, "15"),
        row("LESEVERSTEHEN", 2, "20"),
        row("LESEVERSTEHEN", 3, "20"),
        row("SPRACHBAUSTEINE", 1, "15"),
        row("SPRACHBAUSTEINE", 2, "15"),
        row("SCHRIFTLICHER_AUSDRUCK", 1, "30"),
    ];

    it("sums the Teil times and leaves Schriftlicher Ausdruck out", () => {
        expect(sumTowardsTotal(b1, 1, 180)).toBe(85);
    });

    it("skips disabled rows", () => {
        expect(sumTowardsTotal([...b1.slice(0, 2), row("LESEVERSTEHEN", 3, "99", { enabled: false })], 1, 180)).toBe(35);
    });

    it("reports review time when within the duration", () => {
        expect(checkTotal(85, 90)).toEqual({ kind: "review", minutes: 5 });
    });

    it("reports the overshoot when beyond the duration", () => {
        expect(checkTotal(98, 90)).toEqual({ kind: "over", minutes: 8 });
    });

    it("has nothing to check without a configured duration", () => {
        expect(checkTotal(85, null).kind).toBe("none");
    });
});
