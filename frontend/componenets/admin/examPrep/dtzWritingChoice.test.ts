import { describe, expect, it } from "vitest";
import { emptyForm, formFromStored, toBody, validateWritingForm } from "./dtzWritingChoice";

const filled = () => {
    const form = emptyForm();
    form.title = "Alltag schreiben";
    form.tasks.forEach((t) => {
        t.title = `Titel ${t.taskLabel}`;
        t.situation = `Situation ${t.taskLabel}`;
        t.writingInstruction = "Schreiben Sie eine E-Mail.";
        t.points = ["Eins", "Zwei", "Drei", "Vier"];
    });
    return form;
};

describe("DTZ Schreiben editor model", () => {
    it("starts with exactly two tasks (A, B) and four empty points each", () => {
        const form = emptyForm();
        expect(form.tasks.map((t) => t.taskLabel)).toEqual(["A", "B"]);
        expect(form.tasks.every((t) => t.points.length === 4 && t.points.every((p) => p === ""))).toBe(true);
    });

    it("accepts a complete form and builds the import-shaped body", () => {
        const form = filled();
        form.tasks[0].recipientName = " Herr Schmidt ";
        form.tasks[0].recipientRole = "Mitarbeiter";
        expect(validateWritingForm(form)).toBeNull();
        const body = toBody(form);
        expect(body.tasks).toHaveLength(2);
        expect(body.tasks[0].recipient).toEqual({ name: "Herr Schmidt", role: "Mitarbeiter" });
        expect(body.tasks[1].recipient).toBeNull();
        expect(body.tasks[0].points.map((p) => p.number)).toEqual([1, 2, 3, 4]);
    });

    it("reports the first missing field, including an empty content point", () => {
        const form = filled();
        form.tasks[1].points[2] = "  ";
        expect(validateWritingForm(form)).toBe("Aufgabe B: content point 3 is empty.");
        form.tasks[0].situation = "";
        expect(validateWritingForm(form)).toBe("Aufgabe A: describe the situation.");
        form.title = "";
        expect(validateWritingForm(form)).toBe("Enter a title.");
    });

    it("restores a stored exercise with all eight points, whatever order they were saved in", () => {
        const form = formFromStored("Titel", {
            writingChoice: {
                tasks: [
                    { taskLabel: "B", title: "B-Titel", communicationType: "INFORMAL_EMAIL", situation: "s", writingInstruction: "w", recipient: null,
                      points: [{ number: 2, text: "b2" }, { number: 1, text: "b1" }, { number: 3, text: "b3" }, { number: 4, text: "b4" }] },
                    { taskLabel: "A", title: "A-Titel", situation: "s", writingInstruction: "w", recipient: { name: "Frau X", role: "Leiterin" },
                      points: [{ number: 1, text: "a1" }, { number: 2, text: "a2" }, { number: 3, text: "a3" }, { number: 4, text: "a4" }] },
                ],
            },
        });
        expect(form.tasks.map((t) => t.taskLabel)).toEqual(["A", "B"]);
        expect(form.tasks[0].points).toEqual(["a1", "a2", "a3", "a4"]);
        expect(form.tasks[1].points).toEqual(["b1", "b2", "b3", "b4"]);
        expect(form.tasks[0].recipientName).toBe("Frau X");
        expect(form.tasks[1].communicationType).toBe("INFORMAL_EMAIL");
    });

    it("always offers two tasks with four point slots even if nothing was stored", () => {
        const form = formFromStored("Leer", null);
        expect(form.tasks).toHaveLength(2);
        expect(form.tasks[0].points).toHaveLength(4);
    });
});
