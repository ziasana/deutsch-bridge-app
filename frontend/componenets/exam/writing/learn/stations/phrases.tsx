import { WritingLearningResponse, WritingPhrase } from "@/types/writing";
import { PHRASE_CATEGORY_LABELS } from "../../writingMeta";
import Slide from "../Slide";
import ChoiceQuiz from "../games/ChoiceQuiz";
import FlashDeck from "../games/FlashDeck";
import { seededRandom, shuffled } from "../random";
import { LessonStep } from "../types";

const QUESTIONS = 5;
const OPTIONS = 4;

export function phraseSteps(data: WritingLearningResponse, seed: string): LessonStep[] {
    const phrases = data.phrases;
    if (phrases.length === 0) return [];
    const rand = seededRandom(seed);

    const steps: LessonStep[] = [
        {
            id: "phrases-intro",
            render: () => (
                <Slide emoji="💬" eyebrow="Redemittel" title="Sag es mit den richtigen Worten">
                    <p className="text-base text-foreground/85">
                        Redemittel sind feste Ausdrücke für eine bestimmte Funktion – zum Beispiel um eine Meinung zu äußern, etwas zu begründen oder höflich zu bitten.
                    </p>
                    <p>Zuerst übst du sie nach Funktion, dann testest du dich.</p>
                </Slide>
            ),
        },
        { id: "phrases-deck", render: (api) => <FlashDeck api={api} phrases={phrases} /> },
    ];

    const categories = Array.from(new Set(phrases.map((p) => p.category)));
    if (categories.length >= 3) {
        // One phrase per category first (varied questions), then fill up if there are fewer categories than questions.
        const byCategory = shuffled(categories, rand).map((c) => shuffled(phrases.filter((p) => p.category === c), rand)[0]);
        const picked: WritingPhrase[] = byCategory.slice(0, QUESTIONS);

        picked.forEach((p, i) => {
            const distractors = shuffled(categories.filter((c) => c !== p.category), rand).slice(0, OPTIONS - 1);
            const options = shuffled([p.category, ...distractors], rand).map((c) => ({ id: c, label: PHRASE_CATEGORY_LABELS[c] }));
            steps.push({
                id: `phrases-quiz-${p.id}`,
                gated: true,
                render: (api) => (
                    <ChoiceQuiz
                        api={api}
                        salt={i}
                        question="Wofür verwendest du dieses Redemittel?"
                        quote={p.phrase}
                        options={options}
                        correctId={p.category}
                        explanation={p.example ? `Zum Beispiel: ${p.example}` : null}
                    />
                ),
            });
        });
    }
    return steps;
}
