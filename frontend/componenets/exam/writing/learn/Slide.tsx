import { ReactNode } from "react";

interface SlideProps {
    emoji?: string;
    eyebrow?: string;
    title: ReactNode;
    children?: ReactNode;
}

/** One small, focused learning chunk - sized to fit a phone screen without scrolling. */
export default function Slide({ emoji, eyebrow, title, children }: SlideProps) {
    return (
        <div className="space-y-4">
            <div>
                {eyebrow && <p className="text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>}
                <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-foreground">
                    {emoji && <span aria-hidden>{emoji}</span>}
                    {title}
                </h2>
            </div>
            {children && <div className="space-y-3 text-sm leading-relaxed text-foreground/80">{children}</div>}
        </div>
    );
}

export function Chips({ items, tone = "neutral" }: { items: string[]; tone?: "neutral" | "good" }) {
    return (
        <ul className="flex flex-wrap gap-2">
            {items.map((i) => (
                <li key={i} className={tone === "good" ? "rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm text-foreground" : "rounded-full bg-accent px-3 py-1.5 text-sm text-foreground"}>
                    {i}
                </li>
            ))}
        </ul>
    );
}
