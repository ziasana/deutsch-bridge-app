import { WritingLearningResponse, WritingMistakeData } from "@/types/writing";
import { itemsOfKind } from "../../writingMeta";
import ChoiceQuiz from "../games/ChoiceQuiz";
import Slide from "../Slide";
import { seededRandom, shuffled } from "../random";
import { LessonStep } from "../types";

export function mistakeSteps(data: WritingLearningResponse, seed: string): LessonStep[] {
    const mistakes = itemsOfKind<WritingMistakeData>(data, "MISTAKE");
    const rand = seededRandom(seed);

    return mistakes.map((m, i) => {
        const { wrong, right } = m.data ?? {};
        if (!wrong || !right) {
            return {
                id: `mistake-${m.id}`,
                render: () => (
                    <Slide emoji="⚠️" eyebrow={`Fehler ${i + 1} von ${mistakes.length}`} title={m.title}>
                        {m.content && <p className="text-base text-foreground/85">{m.content}</p>}
                    </Slide>
                ),
            };
        }
        const options = shuffled([{ id: "wrong", label: wrong }, { id: "right", label: right }], rand);
        return {
            id: `mistake-${m.id}`,
            gated: true,
            render: (api) => (
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">⚠️ Fehler {i + 1} von {mistakes.length} – {m.title}</p>
                    <ChoiceQuiz api={api} salt={i} question="Welche Version ist besser?" options={options} correctId="right" explanation={m.content} />
                </div>
            ),
        };
    });
}
