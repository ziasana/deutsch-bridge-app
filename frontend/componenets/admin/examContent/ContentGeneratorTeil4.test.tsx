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
                        exam: "DTZ", level: "B1", section: "LESEN", sectionLabel: "Lesen", part: "TEIL_4", headingCount: 0, textCount: 1,
                        label: "DTZ B1 · Lesen · Teil 4", taskType: "TEXT_TRUE_FALSE", questionCount: 3, optionCount: 0,
                    },
                ],
                exams: ["DTZ"], topics: [], difficulties: [], statuses: [], schemaVersion: "1.0",
                directoryLevels: ["A2_B1", "A2", "B1"], directoryVariations: ["RANDOM"],
                lesenTextTopics: [], lesenTextMixes: [], lesenTextTypes: [], lesenTextLengths: [],
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

const lastRequest = () => generate.mock.calls.at(-1)?.[0];
const promptText = () => (screen.getByLabelText("Generated AI prompt") as HTMLTextAreaElement).value;

function renderGenerator() {
    window.history.replaceState(null, "", "/admin/exam-prep/content-generator?exam=DTZ&section=LESEN&part=TEIL_4");
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
    generate.mockImplementation((r: { topics?: string[]; count?: number; difficulty?: string; textLength?: string; textType?: string }) =>
        Promise.resolve({
            data: {
                prompt: `PROMPT topic=${r.topics?.length ? r.topics.join("+") : "RANDOM"} sets=${r.count} level=${r.difficulty} length=${r.textLength} style=${r.textType ?? "RANDOM"}`,
                promptVersion: "1.0", schemaVersion: "1.0", jsonExample: "{}", existingCount: 0, firstExternalId: "DTZ-B1-L4-001",
            },
        }),
    );
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});
afterEach(cleanup);

describe("DTZ Lesen Teil 4 content generator", () => {
    it("offers the topic, difficulty, text length and text style settings", async () => {
        renderGenerator();
        await screen.findByLabelText("Number of exercise sets");
        const options = (label: string) => Array.from((screen.getByLabelText(label) as HTMLSelectElement).options).map((o) => o.textContent);
        for (const topic of ["School and childcare", "Public services", "Housing", "Education and courses", "Work and employment",
            "Health and appointments", "Leisure and community", "Public transport", "Everyday rules and services"]) {
            expect(screen.getByRole("button", { name: topic })).toBeTruthy();
        }
        expect(options("Difficulty")).toEqual(["A2", "A2–B1", "B1"]);
        expect(options("Text length")).toHaveLength(3);
        expect(options("Text style")).toEqual(["Random", "Information sheet", "Formal notice", "Institutional announcement", "Rules and conditions", "Public information text"]);
    });

    it("shows the AI Content Generation Prompt panel, which follows the settings", async () => {
        renderGenerator();
        expect(await screen.findByText("AI Content Generation Prompt")).toBeTruthy();
        await waitFor(() => expect(screen.getByLabelText("Generated AI prompt")).toBeTruthy());
        expect(promptText()).toBe("PROMPT topic=RANDOM sets=1 level=A2_B1 length=MEDIUM style=RANDOM");

        fireEvent.click(screen.getByRole("button", { name: "Housing" }));
        fireEvent.click(screen.getByRole("button", { name: "Work and employment" }));
        fireEvent.change(screen.getByLabelText("Number of exercise sets"), { target: { value: "3" } });
        fireEvent.change(screen.getByLabelText("Difficulty"), { target: { value: "B1" } });
        fireEvent.change(screen.getByLabelText("Text length"), { target: { value: "LONG" } });
        fireEvent.change(screen.getByLabelText("Text style"), { target: { value: "RULES_AND_CONDITIONS" } });
        await waitFor(() => expect(promptText()).toBe("PROMPT topic=HOUSING+WORK_EMPLOYMENT sets=3 level=B1 length=LONG style=RULES_AND_CONDITIONS"));
        expect(lastRequest()).toMatchObject({ part: "TEIL_4", count: 3, topics: ["HOUSING", "WORK_EMPLOYMENT"], difficulty: "B1", textLength: "LONG", textType: "RULES_AND_CONDITIONS" });
    });

    it("shows the German usage hint and copies the prompt", async () => {
        renderGenerator();
        await screen.findByLabelText("Generated AI prompt");
        expect(screen.getByText(/Prüfen Sie den Text und alle drei Aussagen vor der Veröffentlichung/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Copy prompt/ }));
        await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith("PROMPT topic=RANDOM sets=1 level=A2_B1 length=MEDIUM style=RANDOM"));
    });

    it("saves topics the admin adds or removes: the list is the same after a reload", async () => {
        const first = renderGenerator();
        const input = await screen.findByLabelText("Add your own topic");
        fireEvent.click(screen.getByRole("button", { name: "Housing" }));
        fireEvent.change(input, { target: { value: "  Schwimmbad   und Sport " } });
        fireEvent.keyDown(input, { key: "Enter" });
        // added topics are selected right away and listed with the others
        await waitFor(() => expect(lastRequest().topics).toEqual(["HOUSING", "Schwimmbad und Sport"]));
        expect((input as HTMLInputElement).value).toBe("");
        fireEvent.change(input, { target: { value: "schwimmbad und sport" } });
        fireEvent.click(screen.getByRole("button", { name: "Add topic" }));
        await waitFor(() => expect(screen.getAllByRole("button", { name: "Schwimmbad und Sport" })).toHaveLength(1));

        // an offered topic can be removed as well
        fireEvent.click(screen.getByLabelText("Remove topic Public transport"));
        await waitFor(() => expect(screen.queryByRole("button", { name: "Public transport" })).toBeNull());
        expect(screen.getByRole("button", { name: /Restore removed topics \(1\)/ })).toBeTruthy();

        // "reload": a fresh page shows the saved list
        first.unmount();
        cleanup();
        renderGenerator();
        expect(await screen.findByRole("button", { name: "Schwimmbad und Sport" })).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Public transport" })).toBeNull();

        // removing a topic removes it from the list and from the selection
        fireEvent.click(screen.getByRole("button", { name: "Schwimmbad und Sport" }));
        await waitFor(() => expect(lastRequest().topics).toEqual(["Schwimmbad und Sport"]));
        fireEvent.click(screen.getByLabelText("Remove topic Schwimmbad und Sport"));
        await waitFor(() => expect(screen.queryByRole("button", { name: "Schwimmbad und Sport" })).toBeNull());
        await waitFor(() => expect(lastRequest().topics).toEqual([]));

        fireEvent.click(screen.getByRole("button", { name: /Restore removed topics/ }));
        expect(await screen.findByRole("button", { name: "Public transport" })).toBeTruthy();
    });
});
