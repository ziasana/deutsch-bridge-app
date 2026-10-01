import { WritingGuideItem, WritingSentencePatternData } from "@/types/writing";

export default function WritingSentencePatterns({ items }: { items: WritingGuideItem<WritingSentencePatternData>[] }) {
    return (
        <ul className="space-y-3">
            {items.map((item) => (
                <li key={item.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">Muster</p>
                    <p className="mt-0.5 font-medium text-foreground">{item.title}</p>
                    {item.content && <p className="mt-1 text-sm text-foreground/65">{item.content}</p>}
                    {!!item.data?.examples?.length && (
                        <>
                            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-foreground/45">Beispiel</p>
                            <ul className="mt-1 space-y-1">
                                {item.data.examples.map((e) => (
                                    <li key={e} className="rounded-lg bg-accent/50 px-3 py-1.5 text-sm text-foreground/80">
                                        {e}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </li>
            ))}
        </ul>
    );
}
