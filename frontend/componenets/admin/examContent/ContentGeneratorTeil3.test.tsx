// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ContentGenerator from "./ContentGenerator";

const generate = vi.fn();
vi.mock("@/services/adminExamContentService", () => ({
    getExamContentOptions: () =>
        Promise.resolve({
            data: {
                specs: [
                    {
                        exam: "DTZ", level: "B1", section: "LESEN", sectionLabel: "Lesen", part: "TEIL_3", headingCount: 0, textCount: 3,
                        label: "DTZ B1 · Lesen · Teil 3", taskType: "TEXT_QUESTIONS", questionCount: 6, optionCount: 3,
                    },
                ],
                exams: ["DTZ"], topics: [], difficulties: [], statuses: [], schemaVersion: "1.0",
                directoryLevels: ["A2_B1", "A2", "B1"], directoryVariations: ["RANDOM", "NEW_SCENARIO", "AVOID_KNOWN_TOPICS"],
                lesenTextTopics: ["RANDOM", "TRANSPORT", "WORK"],
                lesenTextMixes: ["RANDOM_MIX", "PRESS_EMAIL_NOTICE", "THREE_PRESS", "CUSTOM"],
                lesenTextTypes: ["PRESS_TEXT", "EMAIL", "FORMAL_NOTICE"],
                lesenTextLengths: ["MEDIUM", "SHORT", "LONG"],
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

function renderGenerator() {
    window.history.replaceState(null, "", "/admin/exam-prep/content-generator?exam=DTZ&section=LESEN&part=TEIL_3");
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={client}>
            <ContentGenerator />
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    generate.mockReset();
    generate.mockImplementation((request: { textMix?: string; textLength?: string }) =>
        Promise.resolve({
            data: {
                prompt: `PROMPT mix=${request.textMix} length=${request.textLength}`,
                promptVersion: "1.0", schemaVersion: "1.0", jsonExample: "{}", existingCount: 0, firstExternalId: "DTZ-B1-L3-001",
            },
        }),
    );
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});
afterEach(cleanup);

describe("DTZ Lesen Teil 3 content generator", () => {
    it("shows the AI Content Generation Prompt panel with the settings reflected in the prompt", async () => {
        renderGenerator();
        expect(await screen.findByText("AI Content Generation Prompt")).toBeTruthy();
        await waitFor(() => expect(screen.getByLabelText("Generated AI prompt")).toBeTruthy());
        expect((screen.getByLabelText("Generated AI prompt") as HTMLTextAreaElement).value).toBe("PROMPT mix=RANDOM_MIX length=MEDIUM");

        fireEvent.change(screen.getByLabelText("Text types"), { target: { value: "THREE_PRESS" } });
        fireEvent.change(screen.getByLabelText("Text length"), { target: { value: "SHORT" } });
        fireEvent.click(screen.getByRole("button", { name: "Work and employment" }));
        await waitFor(() => expect((screen.getByLabelText("Generated AI prompt") as HTMLTextAreaElement).value).toBe("PROMPT mix=THREE_PRESS length=SHORT"));
        expect(lastRequest()).toMatchObject({ part: "TEIL_3", textMix: "THREE_PRESS", textLength: "SHORT", topics: ["WORK"], includeDatesTimes: true });
    });

    it("offers three selectable text types for a custom mix and sends them", async () => {
        renderGenerator();
        await screen.findByLabelText("Text types");
        fireEvent.change(screen.getByLabelText("Text types"), { target: { value: "CUSTOM" } });
        fireEvent.change(screen.getByLabelText("Text 2"), { target: { value: "FORMAL_NOTICE" } });
        await waitFor(() => expect(lastRequest()).toMatchObject({ textMix: "CUSTOM", customTextTypes: ["PRESS_TEXT", "FORMAL_NOTICE", "FORMAL_NOTICE"] }));
    });

    it("explains how to use the prompt and copies it", async () => {
        renderGenerator();
        await screen.findByLabelText("Generated AI prompt");
        expect(screen.getByText(/Prüfen Sie Texte, Antworten und Erklärungen vor der Veröffentlichung/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Copy prompt/ }));
        await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith("PROMPT mix=RANDOM_MIX length=MEDIUM"));
    });
});
