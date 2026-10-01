import { Clock } from "lucide-react";
import { WritingFormatData, WritingLearningResponse } from "@/types/writing";
import { itemsOfKind } from "../../writingMeta";
import Slide from "../Slide";
import TapChecklist from "../games/TapChecklist";
import { LessonStep } from "../types";

export function formatSteps(data: WritingLearningResponse): LessonStep[] {
    const steps: LessonStep[] = [];
    for (const item of itemsOfKind<WritingFormatData>(data, "FORMAT")) {
        steps.push({
            id: `format-${item.id}`,
            render: () => (
                <Slide emoji="🎯" eyebrow="Prüfungsformat" title={item.title}>
                    {item.content && <p className="text-base leading-relaxed text-foreground/85">{item.content}</p>}
                    {item.data?.time && (
                        <p className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-foreground/75">
                            <Clock className="size-4" /> Schreibzeit: {item.data.time}
                        </p>
                    )}
                </Slide>
            ),
        });
        const reqs = item.data?.requirements ?? [];
        if (reqs.length > 0) {
            steps.push({
                id: `format-req-${item.id}`,
                gated: true,
                render: (api) => <TapChecklist api={api} prompt="Das musst du beachten – tippe jeden Punkt an, wenn du ihn verstanden hast." items={reqs} />,
            });
        }
    }
    return steps;
}
