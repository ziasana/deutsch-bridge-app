// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SimBottomBar from "./SimBottomBar";

describe("SimBottomBar", () => {
    afterEach(cleanup);

    it("shows progress and moves between parts; the last part shows the finish actions instead of 'next'", () => {
        const onNext = vi.fn();
        const { rerender } = render(<SimBottomBar answered={3} total={10} prevLabel={null} nextLabel="Teil 2" onPrev={vi.fn()} onNext={onNext} finish={<button>Prüfung abgeben</button>} />);
        expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("3");
        fireEvent.click(screen.getByRole("button", { name: /Teil 2/ }));
        expect(onNext).toHaveBeenCalledTimes(1);
        expect(screen.queryByText("Prüfung abgeben")).toBeNull();

        rerender(<SimBottomBar answered={10} total={10} prevLabel="Teil 1" nextLabel={null} onPrev={vi.fn()} onNext={onNext} finish={<button>Prüfung abgeben</button>} />);
        expect(screen.getByText("Prüfung abgeben")).toBeTruthy();
    });
});
