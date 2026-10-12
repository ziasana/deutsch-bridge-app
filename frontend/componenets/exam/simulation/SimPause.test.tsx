// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SimExitDialog from "./SimExitDialog";
import SimPauseScreen from "./SimPauseScreen";

describe("exam pause", () => {
    afterEach(cleanup);

    it("the exit dialog offers a pause and ending the exam as two separate choices", () => {
        const onPause = vi.fn();
        const onFinish = vi.fn();
        render(<SimExitDialog busy={false} onPause={onPause} onFinish={onFinish} onCancel={vi.fn()} />);
        fireEvent.click(screen.getByRole("button", { name: /Pause machen/ }));
        expect(onPause).toHaveBeenCalledTimes(1);
        expect(onFinish).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole("button", { name: /Prüfung beenden/ }));
        expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it("the pause screen shows the frozen time and lets the learner continue", () => {
        const onContinue = vi.fn();
        render(<SimPauseScreen stageLabel="Lesen" remainingSeconds={3600} busy={false} onContinue={onContinue} onFinish={vi.fn()} onLeave={vi.fn()} />);
        expect(screen.getByRole("timer").textContent).toContain("60:00");
        fireEvent.click(screen.getByRole("button", { name: /Prüfung fortsetzen/ }));
        expect(onContinue).toHaveBeenCalledTimes(1);
    });
});
