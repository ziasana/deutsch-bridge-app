import { describe, expect, it } from "vitest";
import { hasGapMarkers, withGapMarkers } from "./examGap";

describe("withGapMarkers", () => {
    it("converts legacy underlined numbers into gap badges", () => {
        for (const legacy of ["<u>21 </u>", "<u><strong>21</strong> </u>", "<strong><u>21 </u></strong>", "<u>**21** </u>"]) {
            const out = withGapMarkers(`gut, ${legacy}leider`);
            expect(out).toContain('data-exam-gap="21"');
            expect(out).not.toContain("<u>");
        }
    });

    it("leaves content with badges and plain bold numbers alone", () => {
        const badge = '<span data-exam-gap="3">3</span>';
        expect(withGapMarkers(badge)).toBe(badge);
        expect(hasGapMarkers("<strong>21</strong>")).toBe(false);
    });
});
