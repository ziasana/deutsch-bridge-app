// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ContentGenerator from "./ContentGenerator";
import { resetTopicApi } from "./topicsTestApi";

const generate = vi.fn();
vi.mock("@/services/adminExamContentService", async () => ({
    ...(await import("./topicsTestApi")).topicApiMock,
    getExamContentOptions: () =>
        Promise.resolve({
            data: {
                specs: [
                    {
                        exam: "DTZ", level: "B1", section: "SCHREIBEN", sectionLabel: "Schreiben", part: "TEIL_1", headingCount: 0, textCount: 0,
                        label: "DTZ B1 · Schreiben · Teil 1", taskType: "WRITING_TASK_CHOICE", questionCount: 8, optionCount: 0,
                    },
                ],
                exams: ["DTZ"], topics: [], difficulties: [], statuses: [], schemaVersion: "1.0",
            },
        }),
    generateExamContentPrompt: (request: unknown) => generate(request),
    getSpeakingStarter: vi.fn(),
}));
vi.mock("@/store/useAuthStore", () => ({
    default: () => ({ userProfile: { role: "ADMIN" }, hasHydrated: true }),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/admin/exam-prep/content-generator", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type Request = { topics?: string[]; count?: number; difficulty?: string; textType?: string; communicationType?: string; pairPreference?: string; part?: string };
const lastRequest = () => generate.mock.calls.at(-1)?.[0] as Request;
const promptText = () => (screen.getByLabelText("Generated AI prompt") as HTMLTextAreaElement).value;

function renderGenerator() {
    window.history.replaceState(null, "", "/admin/exam-prep/content-generator?exam=DTZ&section=SCHREIBEN&part=TEIL_1");
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={client}>
            <ContentGenerator />
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    resetTopicApi();
    generate.mockReset();
    generate.mockImplementation((r: Request) =>
        Promise.resolve({
            data: {
                prompt: `PROMPT topic=${r.topics?.join("+") || "RANDOM"} purpose=${r.textType} format=${r.communicationType} level=${r.difficulty} pair=${r.pairPreference} sets=${r.count}`,
                promptVersion: "1.0", schemaVersion: "1.0", jsonExample: "{}", existingCount: 0, firstExternalId: "DTZ-B1-S1-001",
            },
        }),
    );
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});
afterEach(cleanup);

describe("DTZ Schreiben content generator", () => {
    it("is reachable for DTZ · Schreiben and offers topic, purpose, format, difficulty and pair preference", async () => {
        renderGenerator();
        await screen.findByLabelText("Pair-generation preference");
        const options = (label: string) => Array.from((screen.getByLabelText(label) as HTMLSelectElement).options).map((o) => o.textContent);
        for (const topic of ["Housing and neighbours", "Courses and education", "Work and employment", "Family and everyday life",
            "Appointments", "Health services", "Public services", "Shopping and complaints", "Invitations and events", "Travel and accommodation"]) {
            expect(screen.getByRole("button", { name: topic })).toBeTruthy();
        }
        expect(options("Communication purpose")).toEqual(["Mixed", "Enquiry or request", "Complaint", "Invitation or reply", "Appointment change", "Application",
            "Explanation of a problem", "Request for assistance"]);
        expect(options("Communication format")).toEqual(["Mixed", "Formal email or letter", "Informal email", "Semi-formal email or letter"]);
        expect(options("Difficulty")).toEqual(["A2", "A2–B1", "B1"]);
        expect(options("Pair-generation preference")).toEqual(["Random balanced pair", "Two different topics", "Two different communication purposes",
            "One formal and one informal/semi-formal task"]);
        expect(screen.getByText(/two alternative tasks \(Aufgabe A and Aufgabe B\) with exactly 4 content points each/)).toBeTruthy();
    });

    it("shows the AI Content Generation Prompt panel, which updates when the settings change", async () => {
        renderGenerator();
        expect(await screen.findByText("AI Content Generation Prompt")).toBeTruthy();
        await waitFor(() => expect(screen.getByLabelText("Generated AI prompt")).toBeTruthy());
        expect(promptText()).toBe("PROMPT topic=RANDOM purpose=MIXED format=MIXED level=A2_B1 pair=RANDOM_BALANCED sets=1");

        fireEvent.click(screen.getByRole("button", { name: "Housing and neighbours" }));
        fireEvent.change(screen.getByLabelText("Communication purpose"), { target: { value: "COMPLAINT" } });
        fireEvent.change(screen.getByLabelText("Communication format"), { target: { value: "SEMI_FORMAL" } });
        fireEvent.change(screen.getByLabelText("Difficulty"), { target: { value: "B1" } });
        fireEvent.change(screen.getByLabelText("Pair-generation preference"), { target: { value: "DIFFERENT_TOPICS" } });
        fireEvent.change(screen.getByLabelText("Number of exercise sets"), { target: { value: "3" } });
        await waitFor(() =>
            expect(promptText()).toBe("PROMPT topic=HOUSING_NEIGHBOURS purpose=COMPLAINT format=SEMI_FORMAL level=B1 pair=DIFFERENT_TOPICS sets=3"),
        );
        // Several A/B sets come back as one batch file.
        expect(lastRequest()).toMatchObject({ part: "TEIL_1", count: 3, topics: ["HOUSING_NEIGHBOURS"] });
    });

    it("shows the German usage hint and copies the prompt", async () => {
        renderGenerator();
        await screen.findByLabelText("Generated AI prompt");
        expect(screen.getByText(/Lassen Sie ein vollständiges JSON mit Aufgabe A und\s+Aufgabe B erstellen/)).toBeTruthy();
        expect(screen.getByText(/Prüfen Sie beide Aufgaben und alle acht Inhaltspunkte vor der Veröffentlichung/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Copy prompt/ }));
        await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("PROMPT topic=RANDOM purpose=MIXED")));
    });
});
