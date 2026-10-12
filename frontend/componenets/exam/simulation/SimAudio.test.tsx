// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SimAudio from "./SimAudio";
import { playSimulationAudio } from "@/services/examSimulationService";

vi.mock("@/services/examSimulationService", () => ({ playSimulationAudio: vi.fn() }));
vi.mock("@/lib/toast", () => ({ toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() } }));

const play = vi.mocked(playSimulationAudio);
const props = { attemptId: "a", partKey: "HOEREN_1", passageId: "p", src: "/x.mp3", disabled: false };

describe("SimAudio", () => {
    afterEach(() => {
        cleanup();
        play.mockReset();
    });

    it("asks the server to count a play before starting a limited clip, and hides replay", async () => {
        play.mockResolvedValue({ data: { partKey: "HOEREN_1", passageId: "p", playsUsed: 1, playsRemaining: 0 } } as never);
        render(<SimAudio {...props} maxPlays={1} initialPlaysUsed={0} />);
        expect(screen.getByText(/einmal abgespielt/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Abspielen/ }));
        await waitFor(() => expect(screen.getByRole("button", { name: "Abspielen" })).toBeTruthy());
        expect(play).toHaveBeenCalledWith("a", "HOEREN_1", "p");
        expect(screen.queryByRole("button", { name: "Von vorne abspielen" })).toBeNull();
    });

    it("offers no play when the server-counted plays are used up (e.g. after a refresh)", () => {
        render(<SimAudio {...props} maxPlays={2} initialPlaysUsed={2} />);
        expect((screen.getByRole("button", { name: /Nochmal abspielen/ }) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByText(/nicht mehr abgespielt/)).toBeTruthy();
    });

    it("unlimited clips use the normal player without calling the server", () => {
        render(<SimAudio {...props} maxPlays={null} initialPlaysUsed={0} />);
        expect(screen.getByRole("button", { name: "Von vorne abspielen" })).toBeTruthy();
        expect(play).not.toHaveBeenCalled();
    });
});
