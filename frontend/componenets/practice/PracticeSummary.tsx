import { ReactNode } from "react";
import CircularProgress from "@/componenets/CircularProgress";

interface PracticeSummaryProps {
    title: string;
    subtitle: string;
    rings: { value: number; label: string }[];
    actions: ReactNode;
}

/** End-of-session screen: a gradient header, one accuracy ring per metric, and the next actions. */
export default function PracticeSummary({ title, subtitle, rings, actions }: Readonly<PracticeSummaryProps>) {
    return (
        <div className="anim-fade-up overflow-hidden rounded-[10px] bg-card text-center shadow-card">
            <div className="bg-[linear-gradient(135deg,hsl(228_78%_44%),hsl(216_100%_62%))] px-6 py-8 text-white">
                <h1 className="text-2xl font-bold">{title} 🎉</h1>
                <p className="mt-1 text-sm text-white/80">{subtitle}</p>
            </div>
            <div className="px-6 py-8">
                <div className="flex flex-wrap items-start justify-center gap-8">
                    {rings.map((ring) => (
                        <div key={ring.label} className="flex flex-col items-center gap-2">
                            <CircularProgress value={ring.value} size={108} color="hsl(216 100% 62%)" trackColor="hsl(0 0% 50% / 0.15)" showLabel />
                            <span className="text-xs font-medium text-foreground/60">{ring.label}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
            </div>
        </div>
    );
}

export const practicePrimaryButton =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50";
export const practiceSecondaryButton =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";
