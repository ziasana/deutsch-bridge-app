// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TEXT_SIZES, TextSizeControl, useTextSize } from "./TextSize";

const labels = { label: "Text size", smaller: "Smaller", larger: "Larger" };

function Demo({ storageKey }: Readonly<{ storageKey: string }>) {
    const [size, setSize] = useTextSize(storageKey);
    return (
        <div>
            <p data-testid="cls">{TEXT_SIZES[size]}</p>
            <TextSizeControl size={size} onChange={setSize} labels={labels} />
        </div>
    );
}

afterEach(() => {
    cleanup();
    window.localStorage.clear();
});

describe("TextSize", () => {
    it("starts at the default size, grows and shrinks, and stops at the ends", () => {
        render(<Demo storageKey="test.a" />);
        expect(screen.getByTestId("cls").textContent).toBe(TEXT_SIZES[1]);
        fireEvent.click(screen.getByRole("button", { name: "Larger" }));
        expect(screen.getByTestId("cls").textContent).toBe(TEXT_SIZES[2]);
        fireEvent.click(screen.getByRole("button", { name: "Larger" }));
        expect((screen.getByRole("button", { name: "Larger" }) as HTMLButtonElement).disabled).toBe(true);
        for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole("button", { name: "Smaller" }));
        expect(screen.getByTestId("cls").textContent).toBe(TEXT_SIZES[0]);
        expect((screen.getByRole("button", { name: "Smaller" }) as HTMLButtonElement).disabled).toBe(true);
    });

    it("remembers the choice for the next visit", () => {
        const first = render(<Demo storageKey="test.b" />);
        fireEvent.click(screen.getByRole("button", { name: "Larger" }));
        first.unmount();
        render(<Demo storageKey="test.b" />);
        expect(screen.getByTestId("cls").textContent).toBe(TEXT_SIZES[2]);
    });
});
