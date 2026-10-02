import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import RisingBubbles from "./RisingBubbles";

interface LearningPageHeroProps {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    /** Small chips (level, learned ...) shown beside the title. */
    meta?: ReactNode;
    dir?: "ltr" | "rtl";
    /** Taller panel with rising bubbles on the right (hidden on small screens). */
    bubbles?: boolean;
    /** Buttons on the right edge of the hero (above the bubbles). */
    actions?: ReactNode;
}

/** The title block shared by the learning pages: soft tinted panel, two faint circles, icon tile, title and subtitle. */
export default function LearningPageHero({ icon: Icon, title, subtitle, meta, dir, bubbles = false, actions }: Readonly<LearningPageHeroProps>) {
    return (
        <header className={cn("relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.03] via-card to-card p-5 sm:p-6", bubbles && "sm:py-9 md:min-h-40 md:flex md:items-center")}>
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-primary/[0.06]" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-1/4 size-36 rounded-full bg-primary/[0.04]" />

            {bubbles && <RisingBubbles />}

            <div className="relative flex w-full flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5" dir={dir}>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <Icon className="size-6" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
                        {meta}
                    </div>
                    <p className="mt-0.5 text-sm text-foreground/60">{subtitle}</p>
                </div>
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
        </header>
    );
}
