import { WritingExampleData, WritingLearningResponse } from "@/types/writing";
import { itemsOfKind } from "../../writingMeta";
import Slide from "../Slide";
import ChoiceQuiz from "../games/ChoiceQuiz";
import DiscoverText from "../games/DiscoverText";
import { seededRandom, shuffled } from "../random";
import { LessonStep } from "../types";

const QUIZ_PER_EXAMPLE = 2;

export function exampleSteps(data: WritingLearningResponse, seed: string): LessonStep[] {
    const steps: LessonStep[] = [];
    const rand = seededRandom(seed);

    for (const ex of itemsOfKind<WritingExampleData>(data, "EXAMPLE")) {
        const sections = ex.data?.sections ?? [];
        if (sections.length === 0) continue;

        steps.push({
            id: `example-read-${ex.id}`,
            render: () => (
                <Slide emoji="📖" eyebrow="Mustertext" title={ex.title}>
                    {ex.content && (
                        <details className="rounded-xl bg-accent/50 px-3 py-2 text-sm">
                            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-foreground/55">Aufgabenstellung anzeigen</summary>
                            <p className="mt-2">{ex.content}</p>
                        </details>
                    )}
                    <p className="whitespace-pre-line rounded-xl bg-card p-4 text-sm leading-relaxed text-foreground/90 shadow-card">
                        {sections.map((s) => s.text).join("\n\n")}
                    </p>
                </Slide>
            ),
        });

        steps.push({
            id: `example-discover-${ex.id}`,
            gated: true,
            render: (api) => <DiscoverText api={api} sections={sections} />,
        });

        // "Which part is this?" - labels must be unique so each question has exactly one right answer.
        const labels = Array.from(new Set(sections.map((s) => s.label)));
        if (labels.length >= 3) {
            shuffled(sections, rand)
                .slice(0, QUIZ_PER_EXAMPLE)
                .forEach((s, i) => {
                    steps.push({
                        id: `example-quiz-${ex.id}-${s.key}`,
                        gated: true,
                        render: (api) => (
                            <ChoiceQuiz
                                api={api}
                                salt={i}
                                question="Welcher Teil des Textes ist das?"
                                quote={s.text.replace(/\n+/g, " ")}
                                options={labels.map((l) => ({ id: l, label: l }))}
                                correctId={s.label}
                                explanation={s.why}
                            />
                        ),
                    });
                });
        }
    }
    return steps;
}
