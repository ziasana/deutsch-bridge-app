import { WritingLearningResponse, WritingSentencePatternData } from "@/types/writing";
import { itemsOfKind } from "../../writingMeta";
import OrderGame from "../games/OrderGame";
import { LessonStep } from "../types";

const MIN_WORDS = 4;
const MAX_WORDS = 14;

/** The shortest example that is a sensible word-order puzzle (not too short, not unwieldy on a phone). */
function puzzleSentence(examples: string[]): string | null {
    const fit = examples
        .filter((e) => {
            const n = e.trim().split(/\s+/).length;
            return n >= MIN_WORDS && n <= MAX_WORDS && !e.includes("…");
        })
        .sort((a, b) => a.length - b.length);
    return fit[0] ?? null;
}

export function patternSteps(data: WritingLearningResponse, seed: string): LessonStep[] {
    const patterns = itemsOfKind<WritingSentencePatternData>(data, "SENTENCE_PATTERN");
    return patterns.map((p, i) => {
        const examples = p.data?.examples ?? [];
        const sentence = puzzleSentence(examples);
        const patternCard = (
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Satzbaustein {i + 1} von {patterns.length}</p>
                <p className="mt-1 text-lg font-bold text-foreground">{p.title}</p>
                {p.content && <p className="mt-1 text-sm text-foreground/70">{p.content}</p>}
            </div>
        );

        if (!sentence) {
            return {
                id: `pattern-${p.id}`,
                render: () => (
                    <div className="space-y-4">
                        {patternCard}
                        {examples.length > 0 && (
                            <ul className="space-y-1.5">
                                {examples.map((e) => (
                                    <li key={e} className="rounded-xl bg-accent/50 px-3 py-2 text-sm text-foreground/85">{e}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                ),
            };
        }

        return {
            id: `pattern-${p.id}`,
            gated: true,
            render: (api) => (
                <div className="space-y-5">
                    {patternCard}
                    <OrderGame
                        api={api}
                        variant="words"
                        seed={`${seed}-${p.id}`}
                        prompt="Baue den Beispielsatz:"
                        items={sentence.trim().split(/\s+/)}
                        explanation={p.content}
                    />
                </div>
            ),
        };
    });
}
