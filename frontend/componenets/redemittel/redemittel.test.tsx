// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redemittel, RedemittelAnswer, RedemittelExercise as Exercise } from "@/types/redemittel";

const service = vi.hoisted(() => ({
    getRedemittelHub: vi.fn(),
    getRedemittelPage: vi.fn(),
    getRedemittel: vi.fn(),
    getTodaysRedemittel: vi.fn(),
    getRedemittelReviewSession: vi.fn(),
    getRedemittelPracticeSession: vi.fn(),
    learnRedemittel: vi.fn(),
    saveRedemittel: vi.fn(),
    unsaveRedemittel: vi.fn(),
    answerRedemittelPractice: vi.fn(),
    answerRedemittelReview: vi.fn(),
}));
vi.mock("@/services/redemittelService", () => service);

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push }),
    useSearchParams: () => new URLSearchParams("ids=a,b"),
}));
vi.mock("@/lib/toast", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("next/link", () => ({
    default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}));

import RedemittelDetailCard from "./RedemittelDetailCard";
import RedemittelExercise from "./RedemittelExercise";
import RedemittelSession from "./RedemittelSession";
import RedemittelPage from "@/app/(protected)/dashboard/redemittel/page";
import LearnPage from "@/app/(protected)/dashboard/redemittel/learn/page";
import ReviewPage from "@/app/(protected)/dashboard/redemittel/review/page";

beforeEach(() => {
    vi.clearAllMocks();
    // The hub shows a "Heute neu" strip; most tests do not care about it.
    service.getTodaysRedemittel.mockReturnValue(Promise.resolve({ data: [] }));
});
afterEach(cleanup);

const redemittel = (over: Partial<Redemittel> = {}): Redemittel => ({
    id: "r1",
    level: "B1",
    category: "OPINION",
    categoryLabel: "Meinung äußern",
    phrase: "Ich bin der Meinung, dass …",
    meaning: null,
    explanation: null,
    example: null,
    formality: null,
    usageNote: null,
    grammarPattern: null,
    commonMistake: null,
    similarExpressions: [],
    contexts: [],
    status: "NEW",
    nextReviewAt: null,
    saved: false,
    ...over,
});

function withClient(ui: React.ReactElement) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const ok = <T,>(data: T) => Promise.resolve({ data });

describe("RedemittelDetailCard", () => {
    it("renders only the sections that exist", () => {
        render(<RedemittelDetailCard redemittel={redemittel()} />);
        expect(screen.getByText("Ich bin der Meinung, dass …")).toBeTruthy();
        for (const absent of ["Bedeutung", "Beispiel", "Ähnliche Redemittel", "Grammatik / Struktur", "Häufiger Fehler", "Verwendung"]) {
            expect(screen.queryByText(absent)).toBeNull();
        }
    });

    it("renders every authored section", () => {
        render(
            <RedemittelDetailCard
                redemittel={redemittel({
                    meaning: "I am of the opinion that …",
                    example: "Ich bin der Meinung, dass Busse billiger sein sollten.",
                    similarExpressions: ["Meiner Meinung nach …", "Meines Erachtens …"],
                    grammarPattern: "Ich bin der Meinung, dass + Nebensatz",
                    commonMistake: "❌ Ich bin Meinung, dass …",
                    contexts: ["WRITING", "DISCUSSION", "EXAM"],
                })}
            />,
        );
        expect(screen.getByText("I am of the opinion that …")).toBeTruthy();
        expect(screen.getByText("Schreiben · Diskussion · Prüfung")).toBeTruthy();
        expect(screen.getByText("Ich bin der Meinung, dass + Nebensatz")).toBeTruthy();
        expect(screen.getByText(/Ich bin der Meinung, dass Busse/)).toBeTruthy();
    });

    it("hides Ähnliche Redemittel and Häufiger Fehler until asked, and can hide them again", () => {
        render(
            <RedemittelDetailCard
                redemittel={redemittel({
                    meaning: "I am of the opinion that …",
                    explanation: "Leitet die Meinung ein.",
                    example: "Ich bin der Meinung, dass Busse billiger sein sollten.",
                    similarExpressions: ["Meiner Meinung nach …", "Meines Erachtens …"],
                    commonMistake: "❌ Ich bin Meinung, dass …",
                })}
            />,
        );
        // Everything else is visible right away.
        for (const shown of ["I am of the opinion that …", "Leitet die Meinung ein.", "Bedeutung", "Erklärung", "Beispiel"]) {
            expect(screen.getByText(shown)).toBeTruthy();
        }
        expect(screen.getByText(/Busse billiger/)).toBeTruthy();
        // The function is shown once, as the badge - not repeated as a section.
        expect(screen.getAllByText("Meinung äußern")).toHaveLength(1);
        expect(screen.queryByText("Funktion")).toBeNull();
        // The two optional sections show only their title and a toggle.
        expect(screen.getByText("Ähnliche Redemittel")).toBeTruthy();
        expect(screen.getByText("Häufiger Fehler")).toBeTruthy();
        expect(screen.queryByText("Meines Erachtens …")).toBeNull();
        expect(screen.queryByText(/Ich bin Meinung, dass/)).toBeNull();

        const similar = screen.getByRole("button", { name: /Anzeigen – Ähnliche Redemittel/ });
        expect(similar.getAttribute("aria-expanded")).toBe("false");
        fireEvent.click(similar);
        expect(screen.getByText("Meines Erachtens …")).toBeTruthy();
        expect(screen.queryByText(/Ich bin Meinung, dass/)).toBeNull(); // the other one stays closed

        fireEvent.click(screen.getByRole("button", { name: /Anzeigen – Häufiger Fehler/ }));
        expect(screen.getByText(/Ich bin Meinung, dass/)).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: /Ausblenden – Ähnliche Redemittel/ }));
        expect(screen.queryByText("Meines Erachtens …")).toBeNull();
    });

    it("lists the sections in the intended order", () => {
        const { container } = render(
            <RedemittelDetailCard
                redemittel={redemittel({
                    meaning: "Gloss",
                    explanation: "Erklärung text",
                    example: "Ein Beispielsatz.",
                    usageNote: "Ein Hinweis.",
                    contexts: ["WRITING"],
                    grammarPattern: "Muster + Nebensatz",
                    similarExpressions: ["Ähnlich"],
                    commonMistake: "❌ falsch",
                })}
            />,
        );
        const titles = Array.from(container.querySelectorAll("h3")).map((h) => h.textContent);
        expect(titles).toEqual([
            "Bedeutung", "Erklärung", "Beispiel", "Hinweis", "Grammatik / Struktur", "Verwendung", "Ähnliche Redemittel", "Häufiger Fehler",
        ]);
    });

    it("shows no toggle for a section the admin has not filled in", () => {
        render(<RedemittelDetailCard redemittel={redemittel()} />);
        expect(screen.queryByRole("button", { name: /Anzeigen/ })).toBeNull();
    });

    it("shows the save toggle in both states and reports clicks", () => {
        const onToggle = vi.fn();
        const { rerender } = render(<RedemittelDetailCard redemittel={redemittel()} onToggleSave={onToggle} />);
        fireEvent.click(screen.getByRole("button", { name: "Zu meinen Redemitteln" }));
        expect(onToggle).toHaveBeenCalledTimes(1);
        rerender(<RedemittelDetailCard redemittel={redemittel({ saved: true })} onToggleSave={onToggle} />);
        expect(screen.getByRole("button", { name: "In meiner Sammlung" }).getAttribute("aria-pressed")).toBe("true");
    });
});

const meaningExercise: Exercise = {
    exerciseId: "e1",
    phraseId: "r1",
    type: "MEANING",
    prompt: "Was bedeutet: „Da bin ich ganz deiner Meinung.“",
    topic: null,
    phrase: null,
    options: [
        { id: "r1", text: "Ich stimme dir zu." },
        { id: "r2", text: "Ich habe dich nicht verstanden." },
        { id: "r3", text: "Ich möchte das Gespräch beenden." },
    ],
};

const answer = (over: Partial<RedemittelAnswer> = {}): RedemittelAnswer => ({
    correct: true,
    attempted: false,
    correctAnswer: "Ich stimme dir zu.",
    modelAnswer: null,
    status: "LEARNING",
    nextReviewAt: null,
    nextReviewInDays: null,
    ...over,
});

describe("RedemittelExercise", () => {
    it("grades a multiple-choice answer and shows when the next review is", async () => {
        const onAnswer = vi.fn().mockResolvedValue(answer({ nextReviewInDays: 7 }));
        render(<RedemittelExercise exercise={meaningExercise} onAnswer={onAnswer} onNext={vi.fn()} isLast={false} showSchedule />);
        fireEvent.click(screen.getByRole("button", { name: /Ich stimme dir zu/ }));
        expect(onAnswer).toHaveBeenCalledWith("r1");
        expect(await screen.findByText("✓ Richtig!")).toBeTruthy();
        expect(screen.getByText("Nächste Wiederholung: in 7 Tagen")).toBeTruthy();
    });

    it("gives gentle feedback and the right answer when wrong, and repeats tomorrow", async () => {
        const onAnswer = vi.fn().mockResolvedValue(answer({ correct: false, nextReviewInDays: 1 }));
        render(<RedemittelExercise exercise={meaningExercise} onAnswer={onAnswer} onNext={vi.fn()} isLast={false} showSchedule />);
        fireEvent.click(screen.getByRole("button", { name: /Ich habe dich nicht verstanden/ }));
        expect(await screen.findByText("✗ Noch einmal üben")).toBeTruthy();
        expect(screen.getByText(/Richtig wäre:/)).toBeTruthy();
        expect(screen.getByText("Dieses Redemittel wird morgen erneut wiederholt.")).toBeTruthy();
    });

    it("does not show a schedule outside of review", async () => {
        const onAnswer = vi.fn().mockResolvedValue(answer());
        render(<RedemittelExercise exercise={meaningExercise} onAnswer={onAnswer} onNext={vi.fn()} isLast />);
        fireEvent.click(screen.getByRole("button", { name: /Ich stimme dir zu/ }));
        await screen.findByText("✓ Richtig!");
        expect(screen.queryByText(/Nächste Wiederholung/)).toBeNull();
        expect(screen.getByRole("button", { name: /Fertig/ })).toBeTruthy();
    });

    it("lets the learner write their own sentence and shows the model afterwards", async () => {
        const onAnswer = vi.fn().mockResolvedValue(answer({ attempted: true, modelAnswer: "Ich bin der Meinung, dass Sport wichtig ist." }));
        render(
            <RedemittelExercise
                exercise={{ exerciseId: "e2", phraseId: "r1", type: "PRODUCTION", prompt: "Schreibe einen eigenen Satz.", topic: "Ist Sport wichtig?", phrase: "Ich bin der Meinung, dass", options: null }}
                onAnswer={onAnswer}
                onNext={vi.fn()}
                isLast={false}
            />,
        );
        const submit = screen.getByRole("button", { name: "Abschicken" }) as HTMLButtonElement;
        expect(submit.disabled).toBe(true);
        fireEvent.change(screen.getByLabelText("Dein Satz"), { target: { value: "Ich bin der Meinung, dass Sport gesund ist." } });
        fireEvent.click(submit);
        expect(await screen.findByText(/du hast das Redemittel selbst verwendet/)).toBeTruthy();
        expect(screen.getByText(/So kann es klingen/)).toBeTruthy();
        expect(onAnswer).toHaveBeenCalledWith("Ich bin der Meinung, dass Sport gesund ist.");
    });

    it("submits a typed fill-in-the-blank answer", async () => {
        const onAnswer = vi.fn().mockResolvedValue(answer({ correctAnswer: "Meinung" }));
        render(
            <RedemittelExercise
                exercise={{ exerciseId: "e3", phraseId: "r1", type: "FILL_BLANK", prompt: "Ergänze:\n\nIch bin der ________, dass …", topic: null, phrase: null, options: null }}
                onAnswer={onAnswer}
                onNext={vi.fn()}
                isLast={false}
            />,
        );
        fireEvent.change(screen.getByLabelText("Fehlendes Wort"), { target: { value: "Meinung" } });
        fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));
        await screen.findByText("✓ Richtig!");
        expect(onAnswer).toHaveBeenCalledWith("Meinung");
    });
});

describe("derived exercise types", () => {
    it("rebuilds a sentence from shuffled words and submits the order the learner chose", async () => {
        const onAnswer = vi.fn().mockResolvedValue(answer({ correctAnswer: "Ich bin hier." }));
        render(
            <RedemittelExercise
                exercise={{
                    exerciseId: "auto:WORD_ORDER", phraseId: "r1", type: "WORD_ORDER", prompt: "Bringe die Wörter in die richtige Reihenfolge.", topic: null, phrase: null,
                    options: [{ id: "0", text: "hier." }, { id: "1", text: "Ich" }, { id: "2", text: "bin" }],
                }}
                onAnswer={onAnswer}
                onNext={vi.fn()}
                isLast={false}
            />,
        );
        const check = screen.getByRole("button", { name: "Prüfen" }) as HTMLButtonElement;
        expect(check.disabled).toBe(true);
        for (const word of ["Ich", "bin", "hier."]) fireEvent.click(screen.getByRole("button", { name: word }));
        expect(check.disabled).toBe(false);
        fireEvent.click(check);
        await screen.findByText("✓ Richtig!");
        expect(onAnswer).toHaveBeenCalledWith("Ich bin hier.");
    });

    it("lets a placed word be taken back and the puzzle reset", () => {
        render(
            <RedemittelExercise
                exercise={{
                    exerciseId: "auto:WORD_ORDER", phraseId: "r1", type: "WORD_ORDER", prompt: "p", topic: null, phrase: null,
                    options: [{ id: "0", text: "A" }, { id: "1", text: "B" }],
                }}
                onAnswer={vi.fn()}
                onNext={vi.fn()}
                isLast={false}
            />,
        );
        fireEvent.click(screen.getByRole("button", { name: "A" }));
        fireEvent.click(screen.getByRole("button", { name: "B" }));
        expect(screen.getByRole("group", { name: "Wörter" }).textContent).toBe("");
        fireEvent.click(screen.getByRole("button", { name: "Zurücksetzen" }));
        expect(screen.getByRole("group", { name: "Wörter" }).textContent).toBe("AB");
    });

    it("cloze is typed like a fill-in and the function quiz is a normal choice", async () => {
        const onAnswer = vi.fn().mockResolvedValue(answer({ correctAnswer: "Meinung äußern" }));
        const { rerender } = render(
            <RedemittelExercise
                exercise={{ exerciseId: "auto:CLOZE", phraseId: "r1", type: "CLOZE", prompt: "Ergänze den Satz:\n\n________ Busse.", topic: null, phrase: null, options: null }}
                onAnswer={onAnswer} onNext={vi.fn()} isLast={false}
            />,
        );
        fireEvent.change(screen.getByLabelText("Fehlendes Redemittel"), { target: { value: "Ich bin der Meinung, dass" } });
        fireEvent.click(screen.getByRole("button", { name: "Prüfen" }));
        await screen.findByText("✓ Richtig!");
        expect(onAnswer).toHaveBeenCalledWith("Ich bin der Meinung, dass");

        rerender(
            <RedemittelExercise
                key="f"
                exercise={{ exerciseId: "auto:FUNCTION", phraseId: "r1", type: "FUNCTION", prompt: "Wofür verwendest du: „X“", topic: null, phrase: null,
                    options: [{ id: "Meinung äußern", text: "Meinung äußern" }, { id: "Begründen", text: "Begründen" }] }}
                onAnswer={onAnswer} onNext={vi.fn()} isLast={false}
            />,
        );
        expect(screen.getByText("Funktion")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Meinung äußern/ }));
        expect(onAnswer).toHaveBeenLastCalledWith("Meinung äußern");
    });
});

describe("RedemittelSession", () => {
    const two: Exercise[] = [meaningExercise, { ...meaningExercise, exerciseId: "e4", phraseId: "r2" }];

    it("uses the review endpoint in review mode, advances, and ends with a summary", async () => {
        service.answerRedemittelReview.mockResolvedValue({ data: answer({ nextReviewInDays: 3 }) });
        withClient(<RedemittelSession mode="review" title="Wiederholung" exercises={two} backHref="/dashboard/redemittel" />);
        expect(screen.getByText("0 / 2")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: /Ich stimme dir zu/ }));
        await screen.findByText("✓ Richtig!");
        expect(service.answerRedemittelReview).toHaveBeenCalledWith("r1", "e1", "r1");
        expect(screen.getByText("1 / 2")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Weiter/ }));

        fireEvent.click(await screen.findByRole("button", { name: /Ich stimme dir zu/ }));
        await screen.findByText("✓ Richtig!");
        fireEvent.click(screen.getByRole("button", { name: /Fertig/ }));

        expect(await screen.findByText("Gut gemacht!")).toBeTruthy();
        expect(screen.getByText("2 von 2 Antworten waren richtig.")).toBeTruthy();
        expect(service.answerRedemittelPractice).not.toHaveBeenCalled();
    });

    it("uses the practice endpoint in practice mode", async () => {
        service.answerRedemittelPractice.mockResolvedValue({ data: answer() });
        withClient(<RedemittelSession mode="practice" title="Üben" exercises={two} backHref="/dashboard/redemittel" />);
        fireEvent.click(screen.getByRole("button", { name: /Ich stimme dir zu/ }));
        await screen.findByText("✓ Richtig!");
        expect(service.answerRedemittelPractice).toHaveBeenCalledWith("r1", "e1", "r1");
        expect(service.answerRedemittelReview).not.toHaveBeenCalled();
    });
});

const hub = (over: Record<string, unknown> = {}) => ({
    dueCount: 0,
    newToday: 0,
    dailyTarget: 3,
    learnedToday: 3,
    savedCount: 0,
    summary: { learned: 42, mastered: 18, review: 12, learning: 7, fresh: 5 },
    categories: [
        { key: "AGREEMENT", label: "Zustimmen", count: 12 },
        { key: "APOLOGY", label: "Entschuldigen", count: 8 },
    ],
    ...over,
});

const emptyPage = { items: [], page: 0, size: 12, totalElements: 0, totalPages: 0 };

describe("Redemittel hub", () => {
    it("recommends the review when some are due and offers all four actions", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub({ dueCount: 8, newToday: 3 })));
        service.getRedemittelPage.mockReturnValue(ok(emptyPage));
        withClient(<RedemittelPage />);
        expect(await screen.findByText("8 Redemittel warten auf dich")).toBeTruthy();
        expect(screen.getByText("8 zur Wiederholung")).toBeTruthy();
        expect(screen.getByText("3 neue Redemittel")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Wiederholen – 8 fällig" }));
        expect(push).toHaveBeenLastCalledWith("/dashboard/redemittel/review");
        fireEvent.click(screen.getByRole("button", { name: "Lernen – 3 neue" }));
        expect(push).toHaveBeenLastCalledWith("/dashboard/redemittel/learn");
        fireEvent.click(screen.getByRole("button", { name: "Üben" }));
        expect(push).toHaveBeenLastCalledWith("/dashboard/redemittel/practice");
        expect(screen.getByRole("button", { name: "Entdecken" })).toBeTruthy();
    });

    it("recommends learning when nothing is due", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub({ dueCount: 0, newToday: 1, learnedToday: 2 })));
        service.getRedemittelPage.mockReturnValue(ok(emptyPage));
        withClient(<RedemittelPage />);
        expect(await screen.findByText("1 neues Redemittel wartet auf dich")).toBeTruthy();
        expect((screen.getByRole("button", { name: "Wiederholen – 0 fällig" }) as HTMLButtonElement).disabled).toBe(true);
    });

    it("shows the empty states when nothing is due and today's quota is learned", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub()));
        service.getRedemittelPage.mockReturnValue(ok(emptyPage));
        withClient(<RedemittelPage />);
        expect(await screen.findByText("Alles erledigt für heute")).toBeTruthy();
        expect(screen.getByText("Keine Wiederholungen")).toBeTruthy();
        expect(screen.getByText("Heute alles gelernt")).toBeTruthy();
    });

    it("is one continuous card: hero, progress, today's cards and Entdecken share one container", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub({ newToday: 2, learnedToday: 1 })));
        service.getRedemittelPage.mockReturnValue(ok({ ...emptyPage, items: [redemittel()], totalElements: 1, totalPages: 1 }));
        service.getTodaysRedemittel.mockReturnValue(ok([redemittel({ id: "t1", phrase: "Heute neu 1" })]));
        withClient(<RedemittelPage />);
        const panel = await screen.findByRole("region", { name: "Dein Lernstand" });
        const today = await screen.findByRole("region", { name: "Heute neu" });
        const explore = screen.getByRole("region", { name: "Entdecken" });
        const card = panel.closest(".rounded-3xl");
        expect(card).not.toBeNull();
        expect(card!.contains(today)).toBe(true);
        expect(card!.contains(explore)).toBe(true);
        // only one bordered card holds them all; Entdecken has its title inside it and no card chrome of its own
        expect(within(explore).getByRole("heading", { level: 2, name: "Entdecken" })).toBeTruthy();
        expect(explore.className).not.toMatch(/shadow-card/);
        expect(explore.querySelector(".bg-gradient-to-b")).toBeNull(); // plain white filter area, no blue tint
    });

    it("is one clean white surface: no tinted background zones", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub({ newToday: 2, learnedToday: 1 })));
        service.getRedemittelPage.mockReturnValue(ok({ ...emptyPage, items: [redemittel()], totalElements: 1, totalPages: 1 }));
        withClient(<RedemittelPage />);
        await screen.findByRole("img", { name: /Tagesziel/ });
        const card = screen.getByRole("region", { name: "Dein Lernstand" }).closest(".rounded-3xl") as HTMLElement;
        expect(card.querySelector("[class*='bg-gradient']")).toBeNull();
        expect(card.querySelector("[class*='bg-accent/30']")).toBeNull();
        expect(card.querySelector("[class*='bg-accent/20']")).toBeNull();
    });

    it("the goal ring is a button that continues with the next step", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub({ newToday: 2, learnedToday: 1 })));
        service.getRedemittelPage.mockReturnValue(ok(emptyPage));
        const { unmount } = withClient(<RedemittelPage />);
        fireEvent.click(await screen.findByRole("button", { name: /Tagesziel.*Jetzt neue Redemittel lernen/ }));
        expect(push).toHaveBeenLastCalledWith("/dashboard/redemittel/learn");
        unmount();

        service.getRedemittelHub.mockReturnValue(ok(hub({ newToday: 0 })));
        withClient(<RedemittelPage />);
        fireEvent.click(await screen.findByRole("button", { name: /Tagesziel.*Jetzt üben/ }));
        expect(push).toHaveBeenLastCalledWith("/dashboard/redemittel/practice");
    });

    it("puts title, goal ring, actions and the progress tiles into one container", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub({ newToday: 2, learnedToday: 1 })));
        service.getRedemittelPage.mockReturnValue(ok({ ...emptyPage, items: [redemittel()], totalElements: 1, totalPages: 1 }));
        withClient(<RedemittelPage />);
        const panel = await screen.findByRole("region", { name: "Dein Lernstand" });
        expect(within(panel).getByRole("heading", { level: 1, name: "Redemittel" })).toBeTruthy();
        expect(await within(panel).findByRole("img", { name: /Tagesziel/ })).toBeTruthy();
        expect(within(panel).getByRole("group", { name: "Aktionen" })).toBeTruthy();
        expect(within(panel).getByRole("button", { name: /Überrasch mich/ })).toBeTruthy();
        expect(within(panel).getByRole("group", { name: "Nach Lernstatus filtern" })).toBeTruthy();
        // no separate hero banner any more: exactly one level-1 heading on the page
        expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    });

    it("shows placeholders instead of zeros while the numbers load", async () => {
        service.getRedemittelHub.mockReturnValue(new Promise(() => {}));
        service.getRedemittelPage.mockReturnValue(ok(emptyPage));
        withClient(<RedemittelPage />);
        const panel = await screen.findByRole("region", { name: "Dein Lernstand" });
        expect(within(panel).queryByRole("group", { name: "Nach Lernstatus filtern" })).toBeNull();
        expect(within(panel).queryByText("Alles erledigt für heute")).toBeNull();
        expect((within(panel).getByRole("button", { name: "Üben" }) as HTMLButtonElement).disabled).toBe(true);
    });

    it("shows the daily goal and a progress bar from the real numbers", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub({ newToday: 1, learnedToday: 2, dailyTarget: 3 })));
        service.getRedemittelPage.mockReturnValue(ok(emptyPage));
        withClient(<RedemittelPage />);
        expect(await screen.findByRole("img", { name: "Tagesziel: 2 von 3 neuen Redemitteln gelernt" })).toBeTruthy();
        expect(screen.getByText("42 von 47 gelernt · 89%")).toBeTruthy();
        expect(screen.getByRole("progressbar", { name: "Gelernte Redemittel" }).getAttribute("aria-valuenow")).toBe("89");
    });

    it("shows the real progress numbers as filter chips, and the categories come from the backend", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub()));
        service.getRedemittelPage.mockReturnValue(ok(emptyPage));
        withClient(<RedemittelPage />);
        await screen.findByText("Meine Redemittel");
        const chips = screen.getByRole("group", { name: "Nach Lernstatus filtern" });
        const text = (label: string) => Array.from(chips.querySelectorAll("button")).find((b) => b.textContent?.includes(label))?.textContent;
        const order = Array.from(chips.querySelectorAll("button")).map((b) => b.textContent);
        expect(order).toEqual(["Neu5 Redemittel", "Lernen7 Redemittel", "Wiederholen12 Redemittel", "Sicher18 Redemittel"]); // the learning journey, in order
        expect(text("Sicher")).toBe("Sicher18 Redemittel");
        expect(text("Wiederholen")).toBe("Wiederholen12 Redemittel");
        expect(text("Lernen")).toBe("Lernen7 Redemittel");
        expect(text("Neu")).toBe("Neu5 Redemittel");
        expect(screen.queryByText("Kategorien")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: /Funktion wählen/ }));
        const panel = screen.getByRole("group", { name: "Funktion" });
        expect(within(panel).getByRole("button", { name: /Zustimmen/ })).toBeTruthy();
        expect(within(panel).getByRole("button", { name: /Entschuldigen/ })).toBeTruthy();
    });

    it("lists Redemittel and filters by status, level and the personal collection", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub({ savedCount: 2 })));
        service.getRedemittelPage.mockImplementation((_page: number, _size: number, params: { saved?: boolean }) =>
            ok(params.saved ? emptyPage : { ...emptyPage, items: [redemittel()], totalElements: 1, totalPages: 1 }),
        );
        withClient(<RedemittelPage />);
        expect(await screen.findByText("Ich bin der Meinung, dass …")).toBeTruthy();

        const chips = screen.getByRole("group", { name: "Nach Lernstatus filtern" });
        const chip = (label: string) => Array.from(chips.querySelectorAll("button")).find((b) => b.textContent?.includes(label)) as HTMLButtonElement;
        fireEvent.click(chip("Sicher"));
        expect(chip("Sicher").getAttribute("aria-pressed")).toBe("true");
        await waitFor(() =>
            expect(service.getRedemittelPage).toHaveBeenLastCalledWith(0, 12, expect.objectContaining({ status: "MASTERED" })),
        );

        fireEvent.click(within(screen.getByRole("group", { name: "Niveau" })).getByRole("button", { name: "B2" }));
        await waitFor(() =>
            expect(service.getRedemittelPage).toHaveBeenLastCalledWith(0, 12, expect.objectContaining({ level: "B2", status: "MASTERED" })),
        );

        fireEvent.click(screen.getByRole("button", { name: "Filter Sicher entfernen" }));
        fireEvent.click(within(screen.getByRole("group", { name: "Niveau" })).getByRole("button", { name: "Alle" }));
        fireEvent.click(screen.getByRole("button", { name: /Meine Sammlung/ }));
        expect(await screen.findByText("Deine Sammlung ist noch leer.")).toBeTruthy();
    });

    it("searches by what the learner types (debounced) and sends it to the server", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub()));
        service.getRedemittelPage.mockReturnValue(ok(emptyPage));
        withClient(<RedemittelPage />);
        await screen.findByText("Meine Redemittel");
        fireEvent.change(screen.getByLabelText("Redemittel suchen"), { target: { value: "zustimmen" } });
        await waitFor(() => expect(service.getRedemittelPage).toHaveBeenLastCalledWith(0, 12, expect.objectContaining({ search: "zustimmen" })));
    });

    it("saves a Redemittel from the list", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub()));
        service.getRedemittelPage.mockReturnValue(ok({ ...emptyPage, items: [redemittel()], totalElements: 1, totalPages: 1 }));
        service.saveRedemittel.mockReturnValue(ok(redemittel({ saved: true })));
        withClient(<RedemittelPage />);
        fireEvent.click(await screen.findByRole("button", { name: "Zu meinen Redemitteln hinzufügen" }));
        await waitFor(() => expect(service.saveRedemittel).toHaveBeenCalledWith("r1"));
    });
});

describe("visual hub elements", () => {
    it("flip cards show the expression first and the meaning and example after a tap", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub({ newToday: 2, learnedToday: 1 })));
        service.getRedemittelPage.mockReturnValue(ok(emptyPage));
        service.getTodaysRedemittel.mockReturnValue(ok([redemittel({ meaning: "I think that …", example: "Ich denke, dass das gut ist." })]));
        withClient(<RedemittelPage />);

        const card = await screen.findByRole("button", { name: /Ich bin der Meinung, dass … – Bedeutung zeigen/ });
        expect(card.getAttribute("aria-pressed")).toBe("false");
        fireEvent.click(card);
        expect(card.getAttribute("aria-pressed")).toBe("true");
        expect(card.getAttribute("aria-label")).toMatch(/Vorderseite zeigen/);
        expect(within(card).getByText("I think that …")).toBeTruthy();
        expect(within(card).getByText(/Ich denke, dass das gut ist/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Lernen starten/ }));
        expect(push).toHaveBeenLastCalledWith("/dashboard/redemittel/learn");
    });

    it("hides the strip when nothing new is left today", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub()));
        service.getRedemittelPage.mockReturnValue(ok(emptyPage));
        withClient(<RedemittelPage />);
        await screen.findByText("Alles erledigt für heute");
        expect(screen.queryByText("Heute neu für dich")).toBeNull();
    });

    it("level pills filter the list and mark the active level", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub()));
        service.getRedemittelPage.mockReturnValue(ok(emptyPage));
        withClient(<RedemittelPage />);
        const pills = await screen.findByRole("group", { name: "Niveau" });
        expect(within(pills).getByRole("button", { name: "Alle" }).getAttribute("aria-pressed")).toBe("true");
        fireEvent.click(within(pills).getByRole("button", { name: "C1" }));
        expect(within(pills).getByRole("button", { name: "C1" }).getAttribute("aria-pressed")).toBe("true");
        await waitFor(() => expect(service.getRedemittelPage).toHaveBeenLastCalledWith(0, 12, expect.objectContaining({ level: "C1" })));
    });

    it("cards show the function, level and a status you can read in words", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub()));
        service.getRedemittelPage.mockReturnValue(ok({ ...emptyPage, items: [redemittel({ status: "REVIEW" })], totalElements: 1, totalPages: 1 }));
        withClient(<RedemittelPage />);
        await screen.findByRole("heading", { name: "Ich bin der Meinung, dass …" });
        expect(screen.getByRole("img", { name: "Status: Wiederholen" })).toBeTruthy();
        expect(screen.getAllByText("Meinung äußern").length).toBeGreaterThan(0);
        expect(screen.getAllByText("B1").length).toBeGreaterThan(0);
    });

    it("'Überrasch mich' opens a random Redemittel from the list", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub()));
        service.getRedemittelPage.mockReturnValue(ok({ ...emptyPage, items: [redemittel({ id: "only" })], totalElements: 1, totalPages: 1 }));
        service.getRedemittel.mockReturnValue(ok(redemittel({ id: "only" })));
        withClient(<RedemittelPage />);
        const surprise = await screen.findByRole("button", { name: /Überrasch mich/ });
        await waitFor(() => expect((surprise as HTMLButtonElement).disabled).toBe(false));
        fireEvent.click(surprise);
        await waitFor(() => expect(service.getRedemittel).toHaveBeenCalledWith("only"));
    });
});

describe("explorer toolbar", () => {
    const withItems = (items = [redemittel()]) => {
        service.getRedemittelHub.mockReturnValue(ok(hub({ savedCount: 2 })));
        service.getRedemittelPage.mockReturnValue(ok({ ...emptyPage, items, totalElements: items.length, totalPages: 1 }));
    };

    it("picks a function from the grid, shows it as a removable tag and closes the panel", async () => {
        withItems();
        withClient(<RedemittelPage />);
        expect(await screen.findAllByRole("listitem")).toHaveLength(1);
        const trigger = await screen.findByRole("button", { name: "Funktion wählen, aktuell: Alle Funktionen" });
        expect(trigger.getAttribute("aria-expanded")).toBe("false");
        expect(screen.queryByRole("group", { name: "Funktion" })).toBeNull();

        fireEvent.click(trigger);
        const panel = screen.getByRole("group", { name: "Funktion" });
        expect(within(panel).getByRole("button", { name: /Alle Funktionen/ }).getAttribute("aria-pressed")).toBe("true");
        expect(within(panel).getByText("12 Redemittel")).toBeTruthy(); // counts per function

        fireEvent.click(within(panel).getByRole("button", { name: /Zustimmen/ }));
        await waitFor(() => expect(service.getRedemittelPage).toHaveBeenLastCalledWith(0, 12, expect.objectContaining({ category: "AGREEMENT" })));
        expect(screen.queryByRole("group", { name: "Funktion" })).toBeNull();
        expect(screen.getByRole("button", { name: "Funktion wählen, aktuell: Zustimmen" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Filter Zustimmen entfernen" })).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Filter Zustimmen entfernen" }));
        await waitFor(() => expect(service.getRedemittelPage).toHaveBeenLastCalledWith(0, 12, expect.objectContaining({ category: undefined })));
        expect(screen.queryByRole("button", { name: "Filter Zustimmen entfernen" })).toBeNull();
    });

    it("closes the function panel with Escape and with a click outside", async () => {
        withItems();
        withClient(<RedemittelPage />);
        const trigger = await screen.findByRole("button", { name: /Funktion wählen/ });
        fireEvent.click(trigger);
        expect(screen.getByRole("group", { name: "Funktion" })).toBeTruthy();
        fireEvent.keyDown(document, { key: "Escape" });
        expect(screen.queryByRole("group", { name: "Funktion" })).toBeNull();

        fireEvent.click(trigger);
        expect(screen.getByRole("group", { name: "Funktion" })).toBeTruthy();
        fireEvent.mouseDown(document.body);
        expect(screen.queryByRole("group", { name: "Funktion" })).toBeNull();
    });

    it("keeps search, filters and the Redemittel list in one container as rows", async () => {
        withItems([redemittel(), redemittel({ id: "r2", phrase: "Da bin ich ganz deiner Meinung." })]);
        withClient(<RedemittelPage />);
        const search = await screen.findByLabelText("Redemittel suchen");
        const rows = await screen.findAllByRole("listitem");
        expect(rows).toHaveLength(2);
        // one shared container holds the search box and every row
        const container = search.closest(".rounded-3xl");
        expect(container).not.toBeNull();
        rows.forEach((row) => expect(container!.contains(row)).toBe(true));
        expect(within(rows[1]).getByRole("heading", { name: "Da bin ich ganz deiner Meinung." })).toBeTruthy();
    });

    it("does not show a total count, and the filter strip only appears while a filter is active", async () => {
        withItems();
        withClient(<RedemittelPage />);
        await screen.findAllByRole("listitem");
        expect(within(screen.getByRole("region", { name: "Entdecken" })).queryByText(/^\d+ Redemittel$/)).toBeNull();
        expect(screen.queryByText("Aktive Filter:")).toBeNull();
        fireEvent.click(within(screen.getByRole("group", { name: "Niveau" })).getByRole("button", { name: "A2" }));
        expect(await screen.findByText("Aktive Filter:")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Alle zurücksetzen" }));
        await waitFor(() => expect(screen.queryByText("Aktive Filter:")).toBeNull());
    });

    it("combines filters as tags and clears them all at once", async () => {
        withItems();
        withClient(<RedemittelPage />);
        await screen.findAllByRole("listitem");
        fireEvent.click(within(screen.getByRole("group", { name: "Niveau" })).getByRole("button", { name: "B1" }));
        fireEvent.click(await screen.findByRole("button", { name: /Funktion wählen/ }));
        fireEvent.click(within(screen.getByRole("group", { name: "Funktion" })).getByRole("button", { name: /Entschuldigen/ }));
        fireEvent.click(screen.getByRole("button", { name: /Meine Sammlung/ }));

        expect(screen.getByRole("button", { name: "Filter B1 entfernen" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Filter Entschuldigen entfernen" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Filter Meine Sammlung entfernen" })).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Alle zurücksetzen" }));
        await waitFor(() =>
            expect(service.getRedemittelPage).toHaveBeenLastCalledWith(0, 12, expect.objectContaining({ level: undefined, category: undefined, saved: false })),
        );
        expect(screen.queryByRole("button", { name: /Filter .* entfernen/ })).toBeNull();
    });

    it("the collection switch shows its count and the search becomes a tag", async () => {
        withItems();
        withClient(<RedemittelPage />);
        const saved = await screen.findByRole("button", { name: "Meine Sammlung (2)" });
        expect(saved.getAttribute("aria-pressed")).toBe("false");
        fireEvent.click(saved);
        expect(saved.getAttribute("aria-pressed")).toBe("true");

        fireEvent.change(screen.getByLabelText("Redemittel suchen"), { target: { value: "dank" } });
        expect(await screen.findByRole("button", { name: "Filter „dank“ entfernen" })).toBeTruthy();
    });

    it("level pills carry the level icons and colors", async () => {
        withItems();
        withClient(<RedemittelPage />);
        const pills = await screen.findByRole("group", { name: "Niveau" });
        const b2 = within(pills).getByRole("button", { name: "B2" });
        expect(b2.querySelector("svg")).not.toBeNull();
        expect(b2.style.color).not.toBe("");
        fireEvent.click(b2);
        expect(b2.style.backgroundColor).not.toBe("");
    });
});

describe("learning flow", () => {
    it("walks through today's Redemittel one at a time, learns each, and ends with the completion screen", async () => {
        service.getTodaysRedemittel.mockReturnValue(ok([redemittel(), redemittel({ id: "r2", phrase: "Da bin ich ganz deiner Meinung." })]));
        service.learnRedemittel.mockImplementation((id: string) => ok(redemittel({ id, status: "LEARNING" })));
        withClient(<LearnPage />);

        expect(await screen.findByText("Redemittel 1 von 2")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Verstanden – weiter/ }));
        expect(await screen.findByText("Redemittel 2 von 2")).toBeTruthy();
        expect(screen.getByText("Da bin ich ganz deiner Meinung.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /Verstanden – abschließen/ }));

        expect(await screen.findByText("Du hast heute 2 Redemittel gelernt.")).toBeTruthy();
        expect(service.learnRedemittel).toHaveBeenCalledTimes(2);
        fireEvent.click(screen.getByRole("button", { name: "Jetzt üben" }));
        expect(push).toHaveBeenCalledWith("/dashboard/redemittel/practice?ids=r1,r2");
        expect(screen.getByRole("link", { name: "Später wiederholen" })).toBeTruthy();
    });

    it("shows the empty state when everything for today is learned", async () => {
        service.getTodaysRedemittel.mockReturnValue(ok([]));
        withClient(<LearnPage />);
        expect(await screen.findByText(/Du hast alle neuen Redemittel für heute gelernt/)).toBeTruthy();
    });
});

describe("review page", () => {
    it("shows the empty state when nothing is due", async () => {
        service.getRedemittelReviewSession.mockReturnValue(ok({ exercises: [], total: 0 }));
        withClient(<ReviewPage />);
        expect(await screen.findByText("✓ Keine Wiederholungen")).toBeTruthy();
    });

    it("shows how many are waiting and starts at 0 progress", async () => {
        service.getRedemittelReviewSession.mockReturnValue(ok({ exercises: [meaningExercise, { ...meaningExercise, exerciseId: "e4", phraseId: "r2" }], total: 8 }));
        withClient(<ReviewPage />);
        expect(await screen.findByText(/8 Redemittel warten auf dich/)).toBeTruthy();
        expect(screen.getByText("0 / 2")).toBeTruthy();
    });
});

import RedemittelDashboardCard from "@/componenets/dashboard/RedemittelDashboardCard";
import WritingPhraseList from "@/componenets/exam/writing/WritingPhraseList";

describe("integration", () => {
    it("dashboard card links to review when due, to learning when only new, and hides when idle", async () => {
        service.getRedemittelHub.mockReturnValue(ok(hub({ dueCount: 5, newToday: 3 })));
        const { unmount } = withClient(<RedemittelDashboardCard />);
        expect(await screen.findByText("5 zur Wiederholung")).toBeTruthy();
        expect(screen.getByText("3 neue")).toBeTruthy();
        expect(screen.getByRole("link", { name: /Jetzt üben/ }).getAttribute("href")).toBe("/dashboard/redemittel/review");
        unmount();

        service.getRedemittelHub.mockReturnValue(ok(hub({ dueCount: 0, newToday: 3 })));
        const second = withClient(<RedemittelDashboardCard />);
        expect((await screen.findByRole("link", { name: /Jetzt lernen/ })).getAttribute("href")).toBe("/dashboard/redemittel/learn");
        second.unmount();

        service.getRedemittelHub.mockReturnValue(ok(hub()));
        const idle = withClient(<RedemittelDashboardCard />);
        await waitFor(() => expect(service.getRedemittelHub).toHaveBeenCalledTimes(3));
        expect(idle.container.textContent).toBe("");
    });

    it("Schreiben phrases open the shared Redemittel record and can be learned from there", async () => {
        service.getRedemittel.mockReturnValue(ok(redemittel({ id: "w1" })));
        service.learnRedemittel.mockReturnValue(ok(redemittel({ id: "w1", status: "LEARNING" })));
        withClient(
            <WritingPhraseList
                phrases={[{ id: "w1", category: "OPINION", phrase: "Ich bin der Meinung, dass …", explanation: null, example: null, formality: null, usageNote: null, sortOrder: 0 }]}
            />,
        );
        fireEvent.click(screen.getByRole("button", { name: /Details, lernen oder speichern/ }));
        await waitFor(() => expect(service.getRedemittel).toHaveBeenCalledWith("w1"));
        fireEvent.click(await screen.findByRole("button", { name: "Lernen" }));
        await waitFor(() => expect(service.learnRedemittel).toHaveBeenCalledWith("w1"));
        fireEvent.click(screen.getByRole("button", { name: "Zu meinen Redemitteln" }));
        await waitFor(() => expect(service.saveRedemittel).toHaveBeenCalledWith("w1"));
    });
});
