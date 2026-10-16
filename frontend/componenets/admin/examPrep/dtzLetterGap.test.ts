import { describe, expect, it } from "vitest";
import { ExamPassage, ExamQuestion } from "@/types/exam";
import { buildLetterQuestions, normalizeGaps, validateLetterGap } from "./dtzLetterGap";

const gap = (n: number) => `<span data-exam-gap="${n}" class="exam-gap-marker">${n}</span>`;
const passage = (label: string, content: string): ExamPassage => ({ id: label, label, content, imageUrl: null, audioUrl: null, transcript: null });
const letter = (...numbers: number[]) => passage("Brief", `<p>Sehr geehrte Damen und Herren, ${numbers.map((n) => `Satz ${gap(n)}.`).join(" ")}</p>`);

function complete(): ExamQuestion[] {
    return normalizeGaps([]).map((q, i) => ({ ...q, options: [`a${i}`, `b${i}`, `c${i}`], correctAnswer: `b${i}`, explanation: `Erklärung ${i}` }));
}

describe("dtzLetterGap", () => {
    it("always has exactly six gap questions 40-45 with three option slots", () => {
        const gaps = normalizeGaps([]);
        expect(gaps.map((q) => q.questionNumber)).toEqual([40, 41, 42, 43, 44, 45]);
        expect(gaps.map((q) => q.gapNumber)).toEqual([40, 41, 42, 43, 44, 45]);
        expect(gaps.every((q) => q.taskType === "MULTIPLE_CHOICE" && q.options?.length === 3)).toBe(true);
        expect(normalizeGaps(complete().slice(0, 2))).toHaveLength(6);
        expect(normalizeGaps([...complete(), complete()[0]])).toHaveLength(6);
    });

    it("accepts one letter with the gaps 40-45 once each, in order, and complete questions", () => {
        expect(validateLetterGap([letter(40, 41, 42, 43, 44, 45)], complete())).toBeNull();
        expect(validateLetterGap([passage("Beispiel", "<p>Sehr geehrte</p>"), letter(40, 41, 42, 43, 44, 45)], complete())).toBeNull();
    });

    it("rejects missing, duplicate, unexpected or misordered gaps", () => {
        expect(validateLetterGap([letter(40, 41, 42, 43, 44)], complete())).toMatch(/no gap 45/);
        expect(validateLetterGap([letter(40, 41, 42, 42, 43, 44, 45)], complete())).toMatch(/Gap 42 appears 2 times/);
        expect(validateLetterGap([letter(40, 41, 42, 43, 44, 45, 46)], complete())).toMatch(/only contain the gaps 40–45/);
        expect(validateLetterGap([letter(41, 40, 42, 43, 44, 45)], complete())).toMatch(/ascending order/);
        expect(validateLetterGap([passage("Brief", "<p>Kein Marker</p>")], complete())).toMatch(/Exactly 1 letter/);
        expect(validateLetterGap([letter(40, 41, 42, 43, 44, 45), letter(40, 41, 42, 43, 44, 45)], complete())).toMatch(/Exactly 1 letter/);
    });

    it("rejects incomplete options and a missing correct answer", () => {
        const blank = complete();
        blank[1] = { ...blank[1], options: ["a", "", "c"] };
        expect(validateLetterGap([letter(40, 41, 42, 43, 44, 45)], blank)).toMatch(/Gap 41: all three options/);
        const same = complete();
        same[2] = { ...same[2], options: ["mit", "Mit", "bei"], correctAnswer: "bei" };
        expect(validateLetterGap([letter(40, 41, 42, 43, 44, 45)], same)).toMatch(/Gap 42: two options are identical/);
        const noAnswer = complete();
        noAnswer[3] = { ...noAnswer[3], correctAnswer: "" };
        expect(validateLetterGap([letter(40, 41, 42, 43, 44, 45)], noAnswer)).toMatch(/Gap 43: choose the correct option/);
    });

    it("builds the questions to save, pointing at the letter passage after empty passages are dropped", () => {
        const passages = [passage("leer", ""), letter(40, 41, 42, 43, 44, 45)];
        const remap = new Map([[1, 0]]);
        const built = buildLetterQuestions(complete().map((q) => ({ ...q, explanation: `  ${q.explanation}  ` })), remap, passages);
        expect(built.map((q) => [q.questionNumber, q.gapNumber, q.sectionIndex, q.correctAnswer])).toEqual([
            [40, 40, 0, "b0"], [41, 41, 0, "b1"], [42, 42, 0, "b2"], [43, 43, 0, "b3"], [44, 44, 0, "b4"], [45, 45, 0, "b5"],
        ]);
        expect(built[0].explanation).toBe("Erklärung 0");
    });
});
