import { describe, expect, it } from "vitest";
import { ExamPassage, ExamQuestion } from "@/types/exam";
import { buildTrueFalseQuestions, normalizeStatements, validateTrueFalseText } from "./dtzTrueFalseText";

const passage = (label: string, content = "<p>Text</p>"): ExamPassage => ({ id: label, label, content, imageUrl: null, audioUrl: null, transcript: null });

function complete(): ExamQuestion[] {
    const [a, b, c] = normalizeStatements([]);
    return [
        { ...a, prompt: "Aussage 1", correctAnswer: "RICHTIG" },
        { ...b, prompt: "Aussage 2", correctAnswer: "FALSCH" },
        { ...c, prompt: "Aussage 3", correctAnswer: "RICHTIG" },
    ];
}

describe("dtzTrueFalseText", () => {
    it("always has exactly three richtig/falsch statements numbered 37-39 for the one text", () => {
        const statements = normalizeStatements([]);
        expect(statements.map((q) => q.questionNumber)).toEqual([37, 38, 39]);
        expect(statements.every((q) => q.taskType === "TRUE_FALSE" && q.sectionIndex === 0 && q.options === null)).toBe(true);
        expect(normalizeStatements(complete().slice(0, 1))).toHaveLength(3);
        expect(normalizeStatements([...complete(), complete()[0]])).toHaveLength(3);
    });

    it("accepts one text with three complete statements", () => {
        expect(validateTrueFalseText([passage("Informationen")], complete())).toBeNull();
    });

    it("rejects a missing, empty or doubled text", () => {
        expect(validateTrueFalseText([], complete())).toMatch(/Exactly 1 text/);
        expect(validateTrueFalseText([passage("A", "<p> </p>")], complete())).toMatch(/Exactly 1 text/);
        expect(validateTrueFalseText([passage("A"), passage("B")], complete())).toMatch(/Exactly 1 text/);
        expect(validateTrueFalseText([passage("")], complete())).toMatch(/title/);
    });

    it("rejects an empty statement or a missing answer", () => {
        const noPrompt = complete();
        noPrompt[1] = { ...noPrompt[1], prompt: " " };
        expect(validateTrueFalseText([passage("A")], noPrompt)).toMatch(/Statement 38 is missing/);
        const noAnswer = complete();
        noAnswer[2] = { ...noAnswer[2], correctAnswer: "" };
        expect(validateTrueFalseText([passage("A")], noAnswer)).toMatch(/Statement 39/);
        const badAnswer = complete();
        badAnswer[0] = { ...badAnswer[0], correctAnswer: "NICHT_IM_TEXT" };
        expect(validateTrueFalseText([passage("A")], badAnswer)).toMatch(/Statement 37/);
    });

    it("builds the questions to save, trimmed and numbered 37-39", () => {
        const built = buildTrueFalseQuestions(complete().map((q) => ({ ...q, prompt: `  ${q.prompt}  `, questionNumber: null })));
        expect(built.map((q) => [q.questionNumber, q.prompt, q.correctAnswer])).toEqual([[37, "Aussage 1", "RICHTIG"], [38, "Aussage 2", "FALSCH"], [39, "Aussage 3", "RICHTIG"]]);
    });
});
