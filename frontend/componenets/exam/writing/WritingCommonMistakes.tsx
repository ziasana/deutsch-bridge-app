import { Check, X } from "lucide-react";
import { WritingGuideItem, WritingMistakeData } from "@/types/writing";
import Expandable from "./Expandable";

export default function WritingCommonMistakes({ items }: { items: WritingGuideItem<WritingMistakeData>[] }) {
    return (
        <div className="space-y-2">
            {items.map((m, i) => (
                <Expandable key={m.id} title={`Fehler ${i + 1} – ${m.title}`}>
                    {m.content && <p className="leading-relaxed">{m.content}</p>}
                    {m.data?.wrong && (
                        <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-foreground/80">
                            <X className="mt-0.5 size-4 shrink-0 text-red-500" aria-label="Falsch" />
                            {m.data.wrong}
                        </p>
                    )}
                    {m.data?.right && (
                        <p className="mt-2 flex items-start gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-foreground/80">
                            <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-label="Richtig" />
                            {m.data.right}
                        </p>
                    )}
                </Expandable>
            ))}
        </div>
    );
}
