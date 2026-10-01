import { WritingLearningResponse } from "@/types/writing";
import { itemsOfKind } from "../../writingMeta";
import Slide from "../Slide";
import TapChecklist from "../games/TapChecklist";
import { LessonStep, StepApi } from "../types";

/** Short pages keep every step on one phone screen. */
const CHUNK_SIZE = 5;

export function checklistSteps(data: WritingLearningResponse): LessonStep[] {
    const items = itemsOfKind(data, "CHECKLIST_ITEM");
    if (items.length === 0) return [];
    const titles = items.map((i) => i.title);
    const chunks: string[][] = [];
    for (let i = 0; i < titles.length; i += CHUNK_SIZE) chunks.push(titles.slice(i, i + CHUNK_SIZE));
    return [
        {
            id: "checklist-intro",
            render: () => (
                <Slide emoji="✅" eyebrow="Checkliste" title="Dein Check vor dem Abgeben">
                    <p className="text-base text-foreground/85">Gehe diese Fragen bei jedem Text durch. Du kannst sie später auch in der Schreibaufgabe im Kopf abhaken.</p>
                </Slide>
            ),
        },
        ...chunks.map((chunk, i) => ({
            id: `checklist-tap-${i}`,
            render: (api: StepApi) => (
                <TapChecklist
                    api={api}
                    prompt={chunks.length > 1 ? `Meine Schreib-Checkliste (${i + 1}/${chunks.length})` : "Meine Schreib-Checkliste"}
                    items={chunk}
                    requireAll={false}
                />
            ),
        })),
    ];
}
