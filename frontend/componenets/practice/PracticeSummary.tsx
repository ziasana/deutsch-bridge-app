import { ReactNode } from "react";
import CircularProgress from "@/componenets/CircularProgress";

interface PracticeSummaryProps {
    /** Ring colour; the default is the app blue. */
    accent?: string;
    title: string;
    subtitle: string;
    rings: { value: number; label: string }[];
    actions: ReactNode;
}

/** End-of-session screen: a gradient header, one accuracy ring per metric, and the next actions. */
export default function PracticeSummary({ title, subtitle, rings, actions, accent }: Readonly<PracticeSummaryProps>) {
    return (
        <div className="anim-fade-up overflow-hidden rounded-3xl bg-card text-center shadow-card">
            <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/70 px-6 py-8 text-white">
                <span aria-hidden="true" className="absolute -end-8 -top-10 size-36 rounded-full bg-white/10" />
                <h1 className="relative text-2xl font-extrabold">{title} 🎉</h1>
                <p className="relative mt-1 text-sm text-white/85">{subtitle}</p>
            </div>
            <div className="px-6 py-8">
                <div className="flex flex-wrap items-start justify-center gap-8">
                    {rings.map((ring) => (
                        <div key={ring.label} className="flex flex-col items-center gap-2">
                            <CircularProgress value={ring.value} size={108} color={accent ?? "hsl(216 100% 62%)"} trackColor="hsl(0 0% 50% / 0.15)" showLabel />
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
