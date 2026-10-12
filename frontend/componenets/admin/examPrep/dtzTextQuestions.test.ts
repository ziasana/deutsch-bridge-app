import { describe, expect, it } from "vitest";
import { ExamPassage, ExamQuestion } from "@/types/exam";
import {
    buildTextQuestions,
    emptyTextTask,
    removeTextTasks,
    taskNumber,
    updateChoiceOption,
    updateTextTask,
    validateTextQuestions,
} from "./dtzTextQuestions";

const passage = (label: string, content = "<p>Text</p>"): ExamPassage => ({ id: label, label, content, imageUrl: null, audioUrl: null, transcript: null });

function complete(textIndex: number): ExamQuestion[] {
    let qs: ExamQuestion[] = [];
    qs = updateTextTask(qs, textIndex, "TRUE_FALSE", { prompt: "Aussage", correctAnswer: "RICHTIG" });
    qs = updateTextTask(qs, textIndex, "MULTIPLE_CHOICE", { prompt: "Frage?" });
    qs = updateChoiceOption(qs, textIndex, 0, "A");
    qs = updateChoiceOption(qs, textIndex, 1, "B");
    qs = updateChoiceOption(qs, textIndex, 2, "C");
    return updateTextTask(qs, textIndex, "MULTIPLE_CHOICE", { correctAnswer: "B" });
}

describe("dtzTextQuestions", () => {
    it("creates a missing task with the right shape", () => {
        const [tf] = updateTextTask([], 1, "TRUE_FALSE", { prompt: "x" });
        expect(tf).toMatchObject({ taskType: "TRUE_FALSE", sectionIndex: 1, options: null, prompt: "x" });
        expect(emptyTextTask("MULTIPLE_CHOICE", 0).options).toEqual(["", "", ""]);
    });

    it("numbers tasks text by text, richtig/falsch first", () => {
        expect(taskNumber(31, 0, "TRUE_FALSE")).toBe(31);
        expect(taskNumber(31, 0, "MULTIPLE_CHOICE")).toBe(32);
        expect(taskNumber(31, 2, "MULTIPLE_CHOICE")).toBe(36);
    });

    it("keeps the correct answer in step when its option is reworded", () => {
        let qs = complete(0);
        qs = updateChoiceOption(qs, 0, 1, "B neu");
        expect(qs.find((q) => q.taskType === "MULTIPLE_CHOICE")?.correctAnswer).toBe("B neu");
    });

    it("leaves the correct answer alone when another option is edited", () => {
        let qs = complete(0);
        qs = updateChoiceOption(qs, 0, 0, "A neu");
        expect(qs.find((q) => q.taskType === "MULTIPLE_CHOICE")?.correctAnswer).toBe("B");
    });

    it("removes a text's tasks and shifts the later ones", () => {
        const qs = [...complete(0), ...complete(1)];
        const result = removeTextTasks(qs, 0);
        expect(result).toHaveLength(2);
        expect(result.every((q) => q.sectionIndex === 0)).toBe(true);
    });

    it("validates complete texts and reports the first problem otherwise", () => {
        const texts = [passage("Text 1"), passage("Text 2")];
        expect(validateTextQuestions(texts, [...complete(0), ...complete(1)])).toBeNull();
        expect(validateTextQuestions(texts, complete(0))).toMatch(/Text 2: the richtig\/falsch statement is missing/);
        expect(validateTextQuestions([], [])).toMatch(/at least one text/);
        const noAnswer = updateTextTask(complete(0), 0, "TRUE_FALSE", { correctAnswer: "" });
        expect(validateTextQuestions([passage("Text 1")], noAnswer)).toMatch(/richtig or falsch/);
        const noCorrect = updateTextTask(complete(0), 0, "MULTIPLE_CHOICE", { correctAnswer: "" });
        expect(validateTextQuestions([passage("Text 1")], noCorrect)).toMatch(/which option/);
    });

    it("ignores texts without content", () => {
        expect(validateTextQuestions([passage("Text 1"), passage("Text 2", "<p></p>")], complete(0))).toBeNull();
    });

    it("builds ordered, numbered questions for the kept texts only", () => {
        const qs = [...complete(1), ...complete(0), ...complete(2)];
        // text 1 was empty and dropped: 0 stays 0, 2 becomes 1
        const built = buildTextQuestions(qs, new Map([[0, 0], [2, 1]]), 31);
        expect(built.map((q) => [q.sectionIndex, q.taskType, q.questionNumber])).toEqual([
            [0, "TRUE_FALSE", 31],
            [0, "MULTIPLE_CHOICE", 32],
            [1, "TRUE_FALSE", 33],
            [1, "MULTIPLE_CHOICE", 34],
        ]);
    });
});
