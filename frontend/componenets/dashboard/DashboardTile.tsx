import { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardTileProps {
    href: string;
    icon: LucideIcon;
    title: string;
    /** Tailwind classes for the tint: background gradient, icon color and icon background. */
    tone: { surface: string; icon: string; iconBg: string };
    cta: string;
    children: ReactNode;
}

/** One tinted, fully clickable "what to do next" tile. Shared by review, Redemittel and focus so they read as one family. */
export default function DashboardTile({ href, icon: Icon, title, tone, cta, children }: Readonly<DashboardTileProps>) {
    return (
        <Link
            href={href}
            className={cn(
                "group flex h-full flex-col rounded-2xl p-5 transition duration-200",
                "hover:-translate-y-1 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                tone.surface,
            )}
        >
            <div className="flex items-center gap-3">
                <span className={cn("flex size-10 items-center justify-center rounded-xl", tone.iconBg)}>
                    <Icon className={cn("size-5", tone.icon)} aria-hidden="true" />
                </span>
                <h2 className="text-base font-semibold text-foreground">{title}</h2>
            </div>
            <div className="mt-4 flex-1">{children}</div>
            <span className={cn("mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5", tone.icon)}>
                {cta}
                <ArrowRight className="size-4" aria-hidden="true" />
            </span>
        </Link>
    );
}
