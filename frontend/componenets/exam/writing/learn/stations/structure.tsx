import { WritingLearningResponse, WritingStructureData } from "@/types/writing";
import { itemsOfKind } from "../../writingMeta";
import Slide, { Chips } from "../Slide";
import ChoiceQuiz from "../games/ChoiceQuiz";
import { seededRandom, shuffled } from "../random";
import { LessonStep } from "../types";

const MAX_QUESTIONS = 4;
const MAX_EXAMPLE_LENGTH = 90;

export function structureSteps(data: WritingLearningResponse, seed: string): LessonStep[] {
    const parts = itemsOfKind<WritingStructureData>(data, "STRUCTURE_PART");
    if (parts.length === 0) return [];
    const rand = seededRandom(seed);

    const steps: LessonStep[] = [
        {
            id: "structure-intro",
            render: () => (
                <Slide emoji="🧱" eyebrow="Textaufbau" title="So ist ein guter Text gebaut">
                    <ol className="space-y-2">
                        {parts.map((p, i) => (
                            <li key={p.id} className="flex items-center gap-3 rounded-xl border-2 border-primary/20 bg-card px-4 py-3">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{i + 1}</span>
                                <span className="font-semibold text-foreground">{p.title}</span>
                            </li>
                        ))}
                    </ol>
                </Slide>
            ),
        },
    ];

    parts.forEach((p, i) => {
        steps.push({
            id: `structure-${p.id}`,
            render: () => (
                <Slide eyebrow={`Teil ${i + 1} von ${parts.length}`} title={p.title}>
                    {p.content && (
                        <p className="text-base text-foreground/85">
                            <span className="font-semibold text-foreground">Zweck: </span>
                            {p.content}
                        </p>
                    )}
                    {!!p.data?.examples?.length && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">Beispiele</p>
                            <ul className="space-y-1.5">
                                {p.data.examples.map((e) => (
                                    <li key={e} className="rounded-xl bg-accent/50 px-3 py-2 text-foreground/85">{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {!!p.data?.phrases?.length && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">Passende Redemittel</p>
                            <Chips items={p.data.phrases} />
                        </div>
                    )}
                </Slide>
            ),
        });
    });

    // Quiz: "which part does this sentence belong to?" - one example per part, so questions are varied.
    const candidates = shuffled(parts, rand)
        .map((p) => ({ part: p, example: (p.data?.examples ?? []).find((e) => e.length <= MAX_EXAMPLE_LENGTH) }))
        .filter((c): c is { part: (typeof parts)[number]; example: string } => !!c.example)
        .slice(0, MAX_QUESTIONS);

    if (parts.length >= 2) {
        candidates.forEach((c, i) => {
            steps.push({
                id: `structure-quiz-${c.part.id}`,
                gated: true,
                render: (api) => (
                    <ChoiceQuiz
                        api={api}
                        salt={i}
                        question="Zu welchem Teil des Textes gehört dieser Satz?"
                        quote={c.example}
                        options={parts.map((p) => ({ id: p.id, label: p.title }))}
                        correctId={c.part.id}
                        explanation={c.part.content}
                    />
                ),
            });
        });
    }
    return steps;
}
