// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuideLearnView } from "./SpeakingContentView";
import { SpeakingGuideContent } from "@/types/exam";

vi.mock("@/lib/backendOrigin", () => ({ resolveUploadUrl: (u: string | null) => u }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

const base = { intro: "Willkommen im Lernbereich.", tips: [{ title: "Tipp eins", text: "Sprechen Sie in ganzen Sätzen." }], steps: [], commonMistakes: ["Zu kurze Antworten."], selfAssessment: ["Ich habe alles gesagt."] };

describe("GuideLearnView", () => {
    afterEach(cleanup);

    it("renders Teil 2 with an anchor per goal", () => {
        const guide: SpeakingGuideContent = {
            ...base,
            goals: [{ id: "REPORT_OPINION", title: "Meinung wiedergeben", description: "Berichten Sie.", usefulPhrases: ["... findet, dass ..."] }],
        };
        const { container } = render(<GuideLearnView guide={guide} part={2} />);
        expect(container.querySelector("#goal-REPORT_OPINION")).not.toBeNull();
        expect(container.querySelector("#tipps")).not.toBeNull();
        expect(screen.getByText("... findet, dass ...")).toBeTruthy();
        expect(screen.getByText("Zu kurze Antworten.")).toBeTruthy();
        expect(screen.getByText("Ich habe alles gesagt.")).toBeTruthy();
    });

    it("renders Teil 1 topics and Teil 3 functions, each only for its own Teil", () => {
        const guide: SpeakingGuideContent = {
            ...base,
            topics: [{ id: "name", title: "Name", questions: ["Wie heißen Sie?"], followUpQuestions: ["Spitzname?"], usefulPhrases: ["Mein Name ist ..."] }],
            functions: [{ function: "SUGGEST", title: "Vorschläge machen", usefulPhrases: ["Wie wäre es ...?"] }],
        };
        const one = render(<GuideLearnView guide={guide} part={1} />);
        expect(one.container.querySelector("#topic-name")).not.toBeNull();
        expect(one.container.querySelector("#function-SUGGEST")).toBeNull();
        cleanup();
        const three = render(<GuideLearnView guide={guide} part={3} />);
        expect(three.container.querySelector("#function-SUGGEST")).not.toBeNull();
        expect(three.container.querySelector("#topic-name")).toBeNull();
    });
});
