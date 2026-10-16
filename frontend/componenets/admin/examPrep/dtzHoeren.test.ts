import { describe, expect, it } from "vitest";
import { ExamPassage, ExamQuestion } from "@/types/exam";
import { updateChoiceOption, updateTextTask } from "./dtzTextQuestions";
import { DTZ_HOEREN_PARTS, buildDtzHoerenQuestions, normalizeDtzHoerenQuestions, removeStatement, renameStatement, seedDtzHoeren, validateDtzHoeren } from "./dtzHoeren";

const makePassage = (index: number, label: string): ExamPassage => ({ id: `p${index}`, label, content: "", imageUrl: null, audioUrl: null, transcript: null });
const withAudio = (passages: ExamPassage[]) => passages.map((p) => ({ ...p, audioUrl: `/uploads/exam-audio/${p.id}.mp3` }));

function filledChoices(part: number) {
    const seed = seedDtzHoeren(part, makePassage);
    let questions = seed.questions;
    seed.passages.forEach((_, i) => {
        questions = updateTextTask(questions, i, "MULTIPLE_CHOICE", { prompt: `Frage ${i + 1}?` });
        ["A", "B", "C"].forEach((o, k) => (questions = updateChoiceOption(questions, i, k, o)));
        questions = updateTextTask(questions, i, "MULTIPLE_CHOICE", { correctAnswer: "B" });
    });
    return { passages: withAudio(seed.passages), questions };
}

describe("dtzHoeren", () => {
    it("seeds every part with the recordings and tasks of the exam format", () => {
        expect(seedDtzHoeren(1, makePassage)).toMatchObject({ taskType: "MULTIPLE_CHOICE", firstTaskNumber: 1 });
        expect(seedDtzHoeren(1, makePassage).passages.map((p) => p.label)).toEqual(["Ansage 1", "Ansage 2", "Ansage 3", "Ansage 4"]);
        expect(seedDtzHoeren(2, makePassage).questions).toHaveLength(5);
        expect(seedDtzHoeren(3, makePassage)).toMatchObject({ taskType: "TEXT_QUESTIONS", firstTaskNumber: 10 });
        expect(seedDtzHoeren(3, makePassage).passages).toHaveLength(4);
        const teil4 = seedDtzHoeren(4, makePassage);
        expect(teil4).toMatchObject({ taskType: "STATEMENT_MATCHING", firstTaskNumber: 18 });
        expect(teil4.passages.map((p) => p.label)).toEqual(["Diskussion"]);
        expect(teil4.questions.map((q) => q.prompt)).toEqual(["Person 1", "Person 2", "Person 3"]);
        expect(teil4.answerOptions).toHaveLength(5);
    });

    it("numbers the 20 tasks of the paper without gaps", () => {
        const counts = [4, 5, 8, 3];
        let next = 1;
        for (const part of [1, 2, 3, 4]) {
            expect(DTZ_HOEREN_PARTS[part].firstNumber).toBe(next);
            next += counts[part - 1];
        }
        expect(next).toBe(21);
    });

    it("accepts complete Teil 1 and 2 exercises and names the first problem otherwise", () => {
        for (const part of [1, 2]) {
            const { passages, questions } = filledChoices(part);
            expect(validateDtzHoeren(part, passages, questions, [])).toBeNull();
        }
        const { passages, questions } = filledChoices(1);
        expect(validateDtzHoeren(1, passages.map((p, i) => (i === 2 ? { ...p, audioUrl: null } : p)), questions, [])).toMatch(/Exactly 4 recordings/);
        expect(validateDtzHoeren(1, passages, updateTextTask(questions, 1, "MULTIPLE_CHOICE", { correctAnswer: "Z" }), [])).toMatch(/Ansage 2: choose which option/);
        expect(validateDtzHoeren(1, passages, updateTextTask(questions, 0, "MULTIPLE_CHOICE", { prompt: " " }), [])).toMatch(/Ansage 1: the question is missing/);
    });

    it("builds Teil 1 questions numbered from the first task, following dropped recordings", () => {
        const { questions } = filledChoices(1);
        const built = buildDtzHoerenQuestions(1, questions, new Map([[0, 0], [1, 1], [3, 2]]), 1);
        expect(built.map((q) => [q.sectionIndex, q.questionNumber])).toEqual([[0, 1], [1, 2], [2, 3]]);
    });

    it("validates Teil 4: distinct statements, one per person, at least as many statements as persons", () => {
        const seed = seedDtzHoeren(4, makePassage);
        const passages = withAudio(seed.passages);
        const statements = ["Aussage a", "Aussage b", "Aussage c", "Aussage d"];
        const person = (i: number, answer: string): ExamQuestion => ({ ...seed.questions[i], correctAnswer: answer });
        const ok = [person(0, "Aussage c"), person(1, "Aussage a"), person(2, "Aussage d")];
        expect(validateDtzHoeren(4, passages, ok, statements)).toBeNull();
        expect(validateDtzHoeren(4, passages, [person(0, "Aussage c"), person(1, "Aussage c"), person(2, "Aussage d")], statements)).toMatch(/only be the correct answer for one person/);
        expect(validateDtzHoeren(4, passages, ok, ["Aussage a", "", "Aussage c", "Aussage d"])).toMatch(/empty statements/);
        expect(validateDtzHoeren(4, passages, ok, ["Aussage a", "Aussage a", "Aussage c", "Aussage d"])).toMatch(/must be different/);
        expect(validateDtzHoeren(4, passages, [person(0, "Aussage c"), person(1, ""), person(2, "Aussage d")], statements)).toMatch(/Person 2: choose the matching statement/);
        expect(validateDtzHoeren(4, passages, ok, ["Aussage a", "Aussage c"])).toMatch(/At least 3 statements/);
    });

    it("keeps a person's answer in step with a reworded statement and clears it when the statement is removed", () => {
        const seed = seedDtzHoeren(4, makePassage);
        const questions = seed.questions.map((q, i) => ({ ...q, correctAnswer: ["x", "y", "z"][i] }));
        const renamed = renameStatement(["x", "y", "z"], questions, 1, "y neu");
        expect(renamed.answerOptions).toEqual(["x", "y neu", "z"]);
        expect(renamed.questions.map((q) => q.correctAnswer)).toEqual(["x", "y neu", "z"]);
        const removed = removeStatement(renamed.answerOptions, renamed.questions, 0);
        expect(removed.answerOptions).toEqual(["y neu", "z"]);
        expect(removed.questions.map((q) => q.correctAnswer)).toEqual(["", "y neu", "z"]);
    });

    it("fills up a saved exercise that lacks tasks, but leaves other task types alone", () => {
        expect(normalizeDtzHoerenQuestions(1, "MULTIPLE_CHOICE", [])).toHaveLength(4);
        expect(normalizeDtzHoerenQuestions(4, "STATEMENT_MATCHING", [])).toHaveLength(3);
        const loose: ExamQuestion[] = [];
        expect(normalizeDtzHoerenQuestions(3, "TEXT_QUESTIONS", loose)).toBe(loose);
    });
});
