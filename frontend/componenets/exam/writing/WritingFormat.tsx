import { Check, Clock } from "lucide-react";
import { WritingFormatData, WritingGuideItem } from "@/types/writing";

export default function WritingFormat({ items }: { items: WritingGuideItem<WritingFormatData>[] }) {
    return (
        <div className="space-y-5">
            {items.map((item) => (
                <div key={item.id}>
                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                    {item.content && <p className="mt-1 text-sm leading-relaxed text-foreground/75">{item.content}</p>}
                    {item.data?.time && (
                        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-foreground/70">
                            <Clock className="size-3.5" /> Schreibzeit: {item.data.time}
                        </p>
                    )}
                    {!!item.data?.requirements?.length && (
                        <>
                            <p className="mt-4 text-sm font-semibold text-foreground">Wichtig:</p>
                            <ul className="mt-2 space-y-1.5">
                                {item.data.requirements.map((r) => (
                                    <li key={r} className="flex items-start gap-2 text-sm text-foreground/75">
                                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                                        {r}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}
