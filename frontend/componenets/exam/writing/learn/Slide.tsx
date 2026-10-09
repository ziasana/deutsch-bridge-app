import { ReactNode } from "react";

interface SlideProps {
    emoji?: string;
    eyebrow?: string;
    title: ReactNode;
    children?: ReactNode;
}

/** One small, focused learning chunk - sized to fit a phone screen without scrolling. */
export default function Slide({ emoji, eyebrow, title, children }: SlideProps) {
    // Inside the lesson shell of Mündlicher Ausdruck (data-accent set) a slide becomes a card with an emoji tile and a badge.
    // The variants are written out in full so Tailwind can see them.
    return (
        <div className="space-y-4 group-data-[accent]/lesson:rounded-3xl group-data-[accent]/lesson:bg-card group-data-[accent]/lesson:p-5 group-data-[accent]/lesson:shadow-card group-data-[accent]/lesson:ring-1 group-data-[accent]/lesson:ring-primary/15 sm:group-data-[accent]/lesson:p-6">
            <div>
                {eyebrow && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary group-data-[accent]/lesson:inline-flex group-data-[accent]/lesson:rounded-full group-data-[accent]/lesson:bg-primary/15 group-data-[accent]/lesson:px-2.5 group-data-[accent]/lesson:py-0.5 group-data-[accent]/lesson:font-bold">
                        {eyebrow}
                    </p>
                )}
                <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-foreground group-data-[accent]/lesson:mt-3 group-data-[accent]/lesson:flex-col group-data-[accent]/lesson:items-start group-data-[accent]/lesson:gap-3 group-data-[accent]/lesson:text-2xl group-data-[accent]/lesson:font-extrabold">
                    {emoji && (
                        <span aria-hidden className="group-data-[accent]/lesson:flex group-data-[accent]/lesson:size-14 group-data-[accent]/lesson:items-center group-data-[accent]/lesson:justify-center group-data-[accent]/lesson:rounded-2xl group-data-[accent]/lesson:bg-gradient-to-br group-data-[accent]/lesson:from-primary/20 group-data-[accent]/lesson:to-primary/5 group-data-[accent]/lesson:text-3xl">
                            {emoji}
                        </span>
                    )}
                    {title}
                </h2>
            </div>
            {children && <div className="space-y-3 text-sm leading-relaxed text-foreground/80 group-data-[accent]/lesson:text-[15px]">{children}</div>}
        </div>
    );
}

export function Chips({ items, tone = "neutral" }: { items: string[]; tone?: "neutral" | "good" }) {
    return (
        <ul className="flex flex-wrap gap-2">
            {items.map((i) => (
                <li key={i} className={tone === "good" ? "rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm text-foreground" : "rounded-full bg-accent px-3 py-1.5 text-sm text-foreground group-data-[accent]/lesson:bg-primary/10"}>
                    {i}
                </li>
            ))}
        </ul>
    );
}
