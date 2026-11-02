import { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface LearningPageHeroProps {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    /** Small chips (level, learned ...) shown beside the title. */
    meta?: ReactNode;
    dir?: "ltr" | "rtl";
    /** Kept for existing call sites; the header no longer draws bubbles. */
    bubbles?: boolean;
    /** Buttons on the right edge of the header. */
    actions?: ReactNode;
    /** Put the actions on their own full-width line under the title instead of at the right edge. */
    actionsBelow?: boolean;
    /** Optional accent (e.g. the level colour): a thin stripe on the leading edge, nothing else. */
    accent?: string;
    /** Extra rows under the title block (level chips, progress bar ...). */
    children?: ReactNode;
    className?: string;
}

/**
 * Colours for everything placed inside the header: the panel is always Deep Navy, so the theme variables are
 * re-pointed here. Buttons and chips that use `primary` become amber with navy text, text becomes light, cards
 * become a lighter navy. That way existing components (saved-items button, level chip ...) work without changes.
 */
const HERO_THEME = {
    "--primary": "#f2b544",
    "--primary-foreground": "#16324f",
    "--foreground": "#f1f5f9",
    "--muted-foreground": "#b9c7d6",
    "--card": "#1e3f63",
    "--card-foreground": "#f1f5f9",
    "--secondary": "#254969",
    "--secondary-foreground": "#f1f5f9",
    "--muted": "#254969",
    "--accent": "#254969",
    "--accent-foreground": "#f2b544",
    "--border": "#2f5278",
    "--input": "#2f5278",
    "--ring": "#f2b544",
} as CSSProperties;

/** The header shared by every learning page: a restrained Deep Navy panel with an amber icon, a short amber rule under the title and a hairline before any extra rows. */
export default function LearningPageHero({ icon: Icon, title, subtitle, meta, dir, actions, actionsBelow = false, accent, children, className }: Readonly<LearningPageHeroProps>) {
    return (
        <header
            className={cn("relative overflow-hidden rounded-2xl bg-[#16324f] px-5 py-5 text-white shadow-card ring-1 ring-white/10 sm:px-7 sm:py-6", className)}
            style={HERO_THEME}
        >
            {accent && (
                <span
                    aria-hidden="true"
                    className="absolute inset-y-0 start-0 w-1.5 transition-colors duration-300"
                    // Lightened a little so the navy level colours (B1, B2) stay visible on the navy panel.
                    style={{ backgroundColor: `color-mix(in srgb, ${accent} 70%, white)` }}
                />
            )}

            <div className="flex w-full flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4" dir={dir}>
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-[#f2b544] ring-1 ring-white/10">
                        <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h1>
                            {meta}
                        </div>
                        <span aria-hidden="true" className="mt-1.5 block h-0.5 w-8 rounded-full bg-[#f2b544]" />
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#b9c7d6]">{subtitle}</p>
                    </div>
                </div>
                {actions && <div className={cn("flex items-center gap-2", actionsBelow ? "w-full" : "shrink-0")}>{actions}</div>}
            </div>

            {children && <div className="mt-5 border-t border-white/10 pt-4">{children}</div>}
        </header>
    );
}
