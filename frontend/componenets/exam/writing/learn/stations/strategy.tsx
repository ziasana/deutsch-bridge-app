import { ArrowRight, Check } from "lucide-react";
import { WritingGuideItem, WritingLearningResponse, WritingStrategyData } from "@/types/writing";
import { itemsOfKind } from "../../writingMeta";
import Slide from "../Slide";
import OrderGame from "../games/OrderGame";
import { LessonStep } from "../types";

export function strategySteps(data: WritingLearningResponse, seed: string): LessonStep[] {
    const items: WritingGuideItem<WritingStrategyData>[] = itemsOfKind<WritingStrategyData>(data, "STRATEGY_STEP");
    if (items.length === 0) return [];

    const steps: LessonStep[] = [
        {
            id: "strategy-intro",
            render: () => (
                <Slide emoji="🧠" eyebrow="Schreibstrategie" title={`${items.length} Schritte zu einem guten Text`}>
                    <p className="text-base text-foreground/85">Mit diesem Ablauf löst du jede Schreibaufgabe – immer in derselben Reihenfolge.</p>
                    <ol className="flex flex-wrap items-center gap-1.5">
                        {items.map((s, i) => (
                            <li key={s.id} className="flex items-center gap-1.5">
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{s.title}</span>
                                {i < items.length - 1 && <ArrowRight className="size-3.5 text-foreground/30" aria-hidden />}
                            </li>
                        ))}
                    </ol>
                </Slide>
            ),
        },
    ];

    items.forEach((s, i) => {
        steps.push({
            id: `strategy-${s.id}`,
            render: () => (
                <Slide eyebrow={`Schritt ${i + 1} von ${items.length}`} title={s.title}>
                    {s.content && <p className="text-base text-foreground/85">{s.content}</p>}
                    {!!s.data?.tips?.length && (
                        <ul className="space-y-2">
                            {s.data.tips.map((t) => (
                                <li key={t} className="flex items-start gap-2 rounded-xl bg-accent/50 px-3 py-2">
                                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                    {t}
                                </li>
                            ))}
                        </ul>
                    )}
                </Slide>
            ),
        });
    });

    if (items.length >= 3) {
        steps.push({
            id: "strategy-order",
            gated: true,
            render: (api) => (
                <OrderGame
                    api={api}
                    variant="list"
                    seed={`${seed}-order`}
                    prompt="Bring die Schritte in die richtige Reihenfolge."
                    items={items.map((s) => s.title)}
                    explanation="So gehst du bei jeder Schreibaufgabe vor."
                />
            ),
        });
    }
    return steps;
}
