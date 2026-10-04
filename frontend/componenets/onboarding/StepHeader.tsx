import { LucideIcon } from "lucide-react";

interface StepHeaderProps {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
}

/** Tinted hero panel shared with the learning pages: faint circles, icon tile, title and subtitle. */
export default function StepHeader({ icon: Icon, title, subtitle }: Readonly<StepHeaderProps>) {
    return (
        <header className="relative mb-6 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.03] via-card to-card p-5 sm:p-6">
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-primary/[0.06]" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-1/4 size-36 rounded-full bg-primary/[0.04]" />
            <div className="relative flex items-center gap-3.5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <Icon className="size-6" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <h1 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
                    {subtitle && <p className="mt-0.5 text-sm text-foreground/60">{subtitle}</p>}
                </div>
            </div>
        </header>
    );
}
