// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WritingLearningResponse } from "@/types/writing";
import { seededRandom, shuffledDifferent } from "./random";
import { buildStations } from "./stations";
import LessonShell from "./LessonShell";
import ChoiceQuiz from "./games/ChoiceQuiz";
import OrderGame from "./games/OrderGame";

afterEach(cleanup);

const item = (id: string, kind: string, title: string, content: string | null, data: unknown, sortOrder = 0) =>
    ({ id, kind, title, content, data, sortOrder }) as WritingLearningResponse["items"][number];

const data: WritingLearningResponse = {
    level: "B1",
    items: [
        item("f1", "FORMAT", "Was erwartet dich?", "Du schreibst eine E-Mail.", { time: "ca. 30 Minuten", requirements: ["Alle Leitpunkte beachten", "Passende Anrede"] }),
        ...["Lesen", "Markieren", "Sammeln", "Strukturieren"].map((t, i) => item(`s${i}`, "STRATEGY_STEP", t, "…", { tips: ["Tipp"] }, i)),
        item("p1", "STRUCTURE_PART", "Anrede", "Passend ansprechen", { examples: ["Liebe Anna,"] }, 0),
        item("p2", "STRUCTURE_PART", "Schluss", "Höflich enden", { examples: ["Liebe Grüße"] }, 1),
        item("m1", "MISTAKE", "Schluss fehlt", "Erklärung", { wrong: "Ohne Gruß", right: "Mit Gruß" }),
        item("sp1", "SENTENCE_PATTERN", "Ich komme, weil + Nebensatz", "Verb am Ende", { examples: ["Ich komme nicht, weil ich arbeiten muss."] }),
        item("c1", "CHECKLIST_ITEM", "Alle Leitpunkte?", null, null),
    ],
    phrases: [],
};

describe("buildStations", () => {
    it("creates stations only for content that exists, in learning order", () => {
        const stations = buildStations(data, "B1");
        expect(stations.map((s) => s.id)).toEqual(["format", "strategie", "aufbau", "satzbausteine", "fehler", "checkliste"]);
    });

    it("is deterministic for the same level and data", () => {
        const ids = (s: ReturnType<typeof buildStations>) => s.map((st) => st.steps.map((x) => x.id).join(","));
        expect(ids(buildStations(data, "B1"))).toEqual(ids(buildStations(data, "B1")));
    });

    it("gates quizzes and games but not plain slides", () => {
        const stations = buildStations(data, "B1");
        const strategy = stations.find((s) => s.id === "strategie")!;
        expect(strategy.steps[0].gated).toBeFalsy();
        expect(strategy.steps.at(-1)!.gated).toBe(true); // ordering game
        expect(stations.find((s) => s.id === "fehler")!.steps.every((s) => s.gated)).toBe(true);
    });
});

describe("random helpers", () => {
    it("seededRandom repeats for the same seed", () => {
        const a = seededRandom("x");
        const b = seededRandom("x");
        expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    });

    it("shuffledDifferent never returns the original order", () => {
        for (const seed of ["a", "b", "c", "d", "e"]) {
            expect(shuffledDifferent([1, 2, 3, 4], seededRandom(seed))).not.toEqual([1, 2, 3, 4]);
        }
    });
});

describe("ChoiceQuiz", () => {
    it("reports a correct first answer and shows the explanation", () => {
        const complete = vi.fn();
        render(
            <ChoiceQuiz api={{ solved: false, complete }} question="Q?" options={[{ id: "a", label: "Falsch" }, { id: "b", label: "Richtig" }]} correctId="b" explanation="Darum." />,
        );
        fireEvent.click(screen.getByText("Richtig"));
        expect(complete).toHaveBeenCalledWith(true);
        expect(screen.getByText("Darum.")).toBeTruthy();
    });

    it("counts a wrong first answer as not correct", () => {
        const complete = vi.fn();
        render(<ChoiceQuiz api={{ solved: false, complete }} question="Q?" options={[{ id: "a", label: "Falsch" }, { id: "b", label: "Richtig" }]} correctId="b" />);
        fireEvent.click(screen.getByText("Falsch"));
        expect(complete).toHaveBeenCalledWith(false);
    });
});

describe("OrderGame", () => {
    it("completes as correct when the items are placed in order", () => {
        const complete = vi.fn();
        render(<OrderGame api={{ solved: false, complete }} variant="list" seed="t" prompt="Ordne" items={["Eins", "Zwei", "Drei"]} />);
        for (const label of ["Eins", "Zwei", "Drei"]) fireEvent.click(screen.getByRole("button", { name: label }));
        fireEvent.click(screen.getByText("Prüfen"));
        expect(complete).toHaveBeenCalledWith(true);
    });

    it("does not complete on a wrong order and allows retrying", () => {
        const complete = vi.fn();
        render(<OrderGame api={{ solved: false, complete }} variant="list" seed="t" prompt="Ordne" items={["Eins", "Zwei", "Drei"]} />);
        for (const label of ["Zwei", "Eins", "Drei"]) fireEvent.click(screen.getByRole("button", { name: label }));
        fireEvent.click(screen.getByText("Prüfen"));
        expect(complete).not.toHaveBeenCalled();
        expect(screen.getByText(/orange markierten/)).toBeTruthy();
    });
});

describe("LessonShell", () => {
    it("blocks Weiter on a gated step until it is completed, then finishes with the score", () => {
        const onFinish = vi.fn();
        const steps = [
            { id: "slide", render: () => <p>Folie</p> },
            {
                id: "quiz",
                gated: true,
                render: (api: { complete: (c?: boolean) => void }) => <button onClick={() => api.complete(true)}>Antworten</button>,
            },
        ];
        render(<LessonShell emoji="🎯" title="Test" steps={steps} onExit={() => {}} onFinish={onFinish} />);

        fireEvent.click(screen.getByRole("button", { name: /Weiter/ }));
        const next = screen.getByRole("button", { name: /Abschließen/ }) as HTMLButtonElement;
        expect(next.disabled).toBe(true);

        act(() => {
            fireEvent.click(screen.getByText("Antworten"));
        });
        expect((screen.getByRole("button", { name: /Abschließen/ }) as HTMLButtonElement).disabled).toBe(false);
        fireEvent.click(screen.getByRole("button", { name: /Abschließen/ }));
        expect(onFinish).toHaveBeenCalledWith({ correct: 1, total: 1 });
    });
});
