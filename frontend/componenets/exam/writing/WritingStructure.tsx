import { WritingGuideItem, WritingStructureData } from "@/types/writing";
import Expandable from "./Expandable";

export default function WritingStructure({ items }: { items: WritingGuideItem<WritingStructureData>[] }) {
    return (
        <div className="space-y-2">
            {items.map((part, i) => (
                <Expandable
                    key={part.id}
                    defaultOpen={i === 0}
                    title={
                        <span className="flex items-center gap-3">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {i + 1}
                            </span>
                            {part.title}
                        </span>
                    }
                >
                    {part.content && (
                        <p className="leading-relaxed">
                            <span className="font-semibold text-foreground">Zweck: </span>
                            {part.content}
                        </p>
                    )}
                    {!!part.data?.examples?.length && (
                        <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">Beispiele</p>
                            <ul className="mt-1.5 space-y-1">
                                {part.data.examples.map((e) => (
                                    <li key={e} className="rounded-lg bg-accent/50 px-3 py-1.5 text-foreground/80">
                                        {e}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {!!part.data?.phrases?.length && (
                        <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">Passende Redemittel</p>
                            <ul className="mt-1.5 list-disc space-y-1 pl-5">
                                {part.data.phrases.map((p) => (
                                    <li key={p}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Expandable>
            ))}
        </div>
    );
}
