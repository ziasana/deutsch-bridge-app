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
                        exam: "DTZ", level: "B1", section: "LESEN", sectionLabel: "Lesen", part: "TEIL_5", headingCount: 0, textCount: 1,
                        label: "DTZ B1 · Lesen · Teil 5", taskType: "LETTER_GAP_FILL", questionCount: 6, optionCount: 3,
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

type Request = {
    topics?: string[]; count?: number; difficulty?: string; textType?: string; grammarCategories?: string[];
    communicationType?: string; includeExample?: boolean; variation?: string;
};
const lastRequest = () => generate.mock.calls.at(-1)?.[0] as Request;
const promptText = () => (screen.getByLabelText("Generated AI prompt") as HTMLTextAreaElement).value;

function renderGenerator() {
    window.history.replaceState(null, "", "/admin/exam-prep/content-generator?exam=DTZ&section=LESEN&part=TEIL_5");
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
                prompt: `PROMPT topic=${r.topics?.join("+") || "RANDOM"} sets=${r.count} type=${r.textType ?? "RANDOM"} level=${r.difficulty} grammar=${r.grammarCategories?.join("+")} example=${r.includeExample} register=${r.communicationType ?? "AUTO"} variation=${r.variation}`,
                promptVersion: "1.0", schemaVersion: "1.0", jsonExample: "{}", existingCount: 0, firstExternalId: "DTZ-B1-L5-001",
            },
        }),
    );
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});
afterEach(cleanup);

describe("DTZ Lesen Teil 5 content generator", () => {
    it("offers the topic, text type, difficulty, grammar focus, register and option checkboxes", async () => {
        renderGenerator();
        await screen.findByLabelText("Number of exercise sets");
        const options = (label: string) => Array.from((screen.getByLabelText(label) as HTMLSelectElement).options).map((o) => o.textContent);
        for (const topic of ["Travel and accommodation", "Work and applications", "School and education", "Family and friends",
            "Health and appointments", "Housing", "Courses and leisure", "Public services", "Shopping and complaints", "Everyday communication"]) {
            expect(screen.getByRole("button", { name: topic })).toBeTruthy();
        }
        expect(options("Text type")).toEqual(["Random", "Formal letter", "Formal email", "Informal email", "Complaint", "Request for information", "Invitation or reply"]);
        expect(options("Difficulty")).toEqual(["A2", "A2–B1", "B1"]);
        expect(options("Grammar focus")).toEqual(["Mixed grammar and vocabulary", "Connectors", "Pronouns", "Articles and endings", "Prepositions",
            "Verb forms", "Word order", "Everyday expressions", "Random mix"]);
        expect(screen.getByLabelText("Include example gap (0)")).toBeTruthy();
        expect(screen.getByLabelText("Avoid recently used topics")).toBeTruthy();
        expect(screen.getByLabelText("Generate a different scenario from existing exercises")).toBeTruthy();
    });

    it("shows the AI Content Generation Prompt panel, which follows the settings and never changes the six-gap structure", async () => {
        renderGenerator();
        expect(await screen.findByText("AI Content Generation Prompt")).toBeTruthy();
        await waitFor(() => expect(screen.getByLabelText("Generated AI prompt")).toBeTruthy());
        expect(promptText()).toBe("PROMPT topic=RANDOM sets=1 type=RANDOM level=A2_B1 grammar=MIXED example=true register=AUTO variation=NEW_SCENARIO");

        fireEvent.click(screen.getByRole("button", { name: "Travel and accommodation" }));
        fireEvent.click(screen.getByRole("button", { name: "Housing" }));
        fireEvent.change(screen.getByLabelText("Number of exercise sets"), { target: { value: "3" } });
        fireEvent.change(screen.getByLabelText("Text type"), { target: { value: "COMPLAINT" } });
        fireEvent.change(screen.getByLabelText("Difficulty"), { target: { value: "B1" } });
        fireEvent.change(screen.getByLabelText("Grammar focus"), { target: { value: "CONNECTORS" } });
        fireEvent.change(screen.getByLabelText("Register"), { target: { value: "FORMAL" } });
        fireEvent.click(screen.getByLabelText("Include example gap (0)"));
        fireEvent.click(screen.getByLabelText("Avoid recently used topics"));
        await waitFor(() =>
            expect(promptText()).toBe("PROMPT topic=TRAVEL_ACCOMMODATION+HOUSING sets=3 type=COMPLAINT level=B1 grammar=CONNECTORS example=false register=FORMAL variation=AVOID_KNOWN_TOPICS"),
        );
        expect(lastRequest()).toMatchObject({ part: "TEIL_5", count: 3, topics: ["TRAVEL_ACCOMMODATION", "HOUSING"] });
    });

    it("shows the German usage hint and copies the prompt", async () => {
        renderGenerator();
        await screen.findByLabelText("Generated AI prompt");
        expect(screen.getByText(/Prüfen Sie vor der Veröffentlichung alle sechs Lösungen und die grammatische Eindeutigkeit/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Copy prompt/ }));
        await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("PROMPT topic=RANDOM sets=1")));
    });
});
