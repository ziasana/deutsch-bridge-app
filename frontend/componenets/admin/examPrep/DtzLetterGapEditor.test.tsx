// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ExamQuestion } from "@/types/exam";
import DtzLetterGapEditor from "./DtzLetterGapEditor";
import { normalizeGaps } from "./dtzLetterGap";

let latest: ExamQuestion[] = [];

function Harness() {
    const [questions, setQuestions] = useState<ExamQuestion[]>(normalizeGaps([]));
    return (
        <DtzLetterGapEditor
            questions={questions}
            onChange={(next) => {
                latest = next;
                setQuestions(next);
            }}
        />
    );
}

afterEach(cleanup);

describe("DtzLetterGapEditor", () => {
    it("shows the six gaps 40-45 with three options each and nothing to add or remove", () => {
        render(<Harness />);
        for (const n of [40, 41, 42, 43, 44, 45]) {
            for (const key of ["a", "b", "c"]) expect(screen.getByLabelText(`Option ${key}, gap ${n}`)).toBeTruthy();
        }
        expect(screen.queryByLabelText(/Option d/)).toBeNull();
        expect(screen.queryByRole("button")).toBeNull();
    });

    it("keeps the correct answer in step with the edited option text", () => {
        render(<Harness />);
        fireEvent.change(screen.getByLabelText("Option b, gap 40"), { target: { value: "meinem" } });
        fireEvent.click(screen.getByLabelText("Option b is correct, gap 40"));
        expect(latest[0].correctAnswer).toBe("meinem");
        fireEvent.change(screen.getByLabelText("Option b, gap 40"), { target: { value: "meinen" } });
        expect(latest[0].correctAnswer).toBe("meinen");
        fireEvent.change(screen.getByLabelText("Explanation, gap 40"), { target: { value: "Dativ" } });
        expect(latest[0].explanation).toBe("Dativ");
    });

    it("lets the admin choose a correct option only once it has text", () => {
        render(<Harness />);
        expect((screen.getByLabelText("Option a is correct, gap 41") as HTMLInputElement).disabled).toBe(true);
        fireEvent.change(screen.getByLabelText("Option a, gap 41"), { target: { value: "denn" } });
        expect((screen.getByLabelText("Option a is correct, gap 41") as HTMLInputElement).disabled).toBe(false);
    });
});
