import { describe, expect, it } from "vitest";
import { ExamPassage, ExamQuestion } from "@/types/exam";
import {
    buildDirectoryQuestions,
    emptyDirectoryQuestion,
    normalizeDirectoryQuestions,
    updateDirectoryOption,
    updateDirectoryQuestion,
    validateDirectory,
} from "./dtzDirectory";

const source: ExamPassage = { id: "p", label: "Wegweiser", content: "<p>Amt</p>", imageUrl: null, audioUrl: null, transcript: null };

function complete(): ExamQuestion[] {
    let qs: ExamQuestion[] = [];
    for (let i = 0; i < 5; i++) {
        qs = updateDirectoryQuestion(qs, i, { prompt: `Situation ${i}`, options: ["1. OG", "2. OG", "3. OG"], correctAnswer: "2. OG" });
    }
    return qs;
}

describe("dtzDirectory", () => {
    it("always yields five numbered multiple-choice situations of three options", () => {
        const qs = normalizeDirectoryQuestions([]);
        expect(qs.map((q) => q.questionNumber)).toEqual([21, 22, 23, 24, 25]);
        expect(qs.every((q) => q.taskType === "MULTIPLE_CHOICE" && q.options?.length === 3 && q.sectionIndex === 0)).toBe(true);
        expect(emptyDirectoryQuestion(0).options).toEqual(["", "", ""]);
    });

    it("pads stored questions that have fewer options and drops extra questions", () => {
        const stored = Array.from({ length: 7 }, (_, i) => ({ ...emptyDirectoryQuestion(i), options: ["x"], questionNumber: 21 + i }));
        const qs = normalizeDirectoryQuestions(stored);
        expect(qs).toHaveLength(5);
        expect(qs[0].options).toEqual(["x", "", ""]);
    });

    it("keeps the correct answer in step when its option is edited", () => {
        const qs = updateDirectoryOption(complete(), 0, 1, "Zweiter Stock");
        expect(qs[0].options).toEqual(["1. OG", "Zweiter Stock", "3. OG"]);
        expect(qs[0].correctAnswer).toBe("Zweiter Stock");
        expect(updateDirectoryOption(complete(), 0, 0, "Erdgeschoss")[0].correctAnswer).toBe("2. OG");
    });

    it("accepts a complete exercise", () => {
        expect(validateDirectory([source], complete())).toBeNull();
    });

    it("reports a missing source, text, option, duplicate option and missing answer", () => {
        expect(validateDirectory([], complete())).toMatch(/information source/);
        expect(validateDirectory([{ ...source, content: "<p></p>" }], complete())).toMatch(/information source/);
        expect(validateDirectory([source], updateDirectoryQuestion(complete(), 1, { prompt: " " }))).toMatch(/Situation 22.*situation text/);
        expect(validateDirectory([source], updateDirectoryQuestion(complete(), 2, { options: ["a", "", "c"] }))).toMatch(/Situation 23.*three options/);
        expect(validateDirectory([source], updateDirectoryQuestion(complete(), 3, { options: ["a", "a", "c"], correctAnswer: "a" }))).toMatch(/Situation 24.*different/);
        expect(validateDirectory([source], updateDirectoryQuestion(complete(), 4, { correctAnswer: "" }))).toMatch(/Situation 25.*correct/);
    });

    it("builds trimmed questions numbered 21-25", () => {
        const built = buildDirectoryQuestions(updateDirectoryQuestion(complete(), 0, { prompt: "  Frage  " }));
        expect(built[0].prompt).toBe("Frage");
        expect(built.map((q) => q.questionNumber)).toEqual([21, 22, 23, 24, 25]);
    });
});
