// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SimQuestionField from "./SimQuestionField";
import type { ExercisePublic } from "@/types/examSimulation";
import type { ExamQuestionPublic } from "@/types/exam";

const exercise = (over: Partial<ExercisePublic> = {}): ExercisePublic => ({
    ordinal: 0,
    title: "t",
    taskType: "MULTIPLE_CHOICE",
    teilDescription: null,
    passages: [],
    questions: [],
    answerOptions: null,
    answerOptionLabels: null,
    requiresPlanning: false,
    leitpunkte: null,
    speaking: null,
    ...over,
});

const question = (over: Partial<ExamQuestionPublic> = {}): ExamQuestionPublic => ({ id: "q1", taskType: "MULTIPLE_CHOICE", prompt: "Wohin geht er?", sectionIndex: null, options: ["ins Kino", "nach Hause"], gapNumber: null, questionNumber: 1, ...over });

const mount = (ex: ExercisePublic, q: ExamQuestionPublic, over: Partial<React.ComponentProps<typeof SimQuestionField>> = {}) => {
    const onChange = vi.fn();
    const onToggleFlag = vi.fn();
    render(
        <ul>
            <SimQuestionField exercise={ex} question={q} number={1} value={null} flagged={false} disabled={false} onChange={onChange} onToggleFlag={onToggleFlag} {...over} />
        </ul>,
    );
    return { onChange, onToggleFlag };
};

describe("SimQuestionField", () => {
    afterEach(cleanup);

    it("multiple choice reports the chosen option and shows no feedback", () => {
        const { onChange } = mount(exercise(), question());
        fireEvent.click(screen.getByRole("radio", { name: /nach Hause/ }));
        expect(onChange).toHaveBeenCalledWith("nach Hause");
        expect(screen.queryByText(/richtig|falsch/i)).toBeNull();
    });

    it("clicking the selected option again clears the answer", () => {
        const { onChange } = mount(exercise(), question(), { value: "ins Kino" });
        fireEvent.click(screen.getByRole("radio", { name: /ins Kino/ }));
        expect(onChange).toHaveBeenCalledWith(null);
    });

    it("true/false/not given uses the backend answer vocabulary", () => {
        const { onChange } = mount(exercise({ taskType: "TRUE_FALSE_NOT_GIVEN" }), question({ taskType: "TRUE_FALSE_NOT_GIVEN", options: null }));
        fireEvent.click(screen.getByRole("radio", { name: "Nicht im Text" }));
        expect(onChange).toHaveBeenCalledWith("NICHT_IM_TEXT");
    });

    it("matching answers from the shared pool with letter labels", () => {
        const ex = exercise({ taskType: "MATCHING", answerOptions: ["Neue Wohnung", "Alter Hund"], answerOptionLabels: ["a", ""] });
        const { onChange } = mount(ex, question({ taskType: "MATCHING", options: null }));
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "Alter Hund" } });
        expect(onChange).toHaveBeenCalledWith("Alter Hund");
        expect(screen.getByRole("option", { name: "b – Alter Hund" })).toBeTruthy();
    });

    it("situation matching offers every ad plus 'no ad fits' = X", () => {
        const ex = exercise({
            taskType: "SITUATION_MATCHING",
            passages: [
                { id: "p1", label: "Anzeige A", content: "", imageUrl: null, audioUrl: null },
                { id: "p2", label: "Anzeige B", content: "", imageUrl: null, audioUrl: null },
            ],
        });
        const { onChange } = mount(ex, question({ taskType: "SITUATION_MATCHING", options: null }));
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "X" } });
        expect(onChange).toHaveBeenCalledWith("X");
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "p2" } });
        expect(onChange).toHaveBeenCalledWith("p2");
    });

    it("flag toggle works and a disabled question accepts no input", () => {
        const { onChange, onToggleFlag } = mount(exercise(), question());
        fireEvent.click(screen.getByRole("button", { name: /Markieren/ }));
        expect(onToggleFlag).toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
    });

    it("disabled questions are read-only", () => {
        const { onChange } = mount(exercise(), question(), { disabled: true });
        fireEvent.click(screen.getByRole("radio", { name: /ins Kino/ }));
        expect(onChange).not.toHaveBeenCalled();
    });
});
