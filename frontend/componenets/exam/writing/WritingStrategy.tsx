import { ArrowDown } from "lucide-react";
import { WritingGuideItem, WritingStrategyData } from "@/types/writing";
import Expandable from "./Expandable";

export default function WritingStrategy({ items }: { items: WritingGuideItem<WritingStrategyData>[] }) {
    return (
        <ol className="space-y-1">
            {items.map((step, i) => (
                <li key={step.id}>
                    <Expandable
                        defaultOpen={i === 0}
                        title={
                            <span className="flex items-center gap-3">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                    {i + 1}
                                </span>
                                {step.title}
                            </span>
                        }
                    >
                        {step.content && <p className="leading-relaxed">{step.content}</p>}
                        {!!step.data?.tips?.length && (
                            <ul className="mt-3 list-disc space-y-1.5 pl-5">
                                {step.data.tips.map((t) => (
                                    <li key={t}>{t}</li>
                                ))}
                            </ul>
                        )}
                    </Expandable>
                    {i < items.length - 1 && <ArrowDown className="mx-auto my-1 size-3.5 text-foreground/25" aria-hidden />}
                </li>
            ))}
        </ol>
    );
}
