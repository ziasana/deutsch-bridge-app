import { ReactNode } from "react"
import Link from "next/link"
import { ArrowRight, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressPanelProps {
    title: string
    icon: LucideIcon
    /** Tailwind text and background classes for the icon chip, in the learning area's color. */
    iconClass: string
    iconBgClass: string
    ctaLabel: string
    ctaHref: string
    children: ReactNode
}

/** Shared frame for the grammar / reading / exam panels so they read as one family. */
export function ProgressPanel({ title, icon: Icon, iconClass, iconBgClass, ctaLabel, ctaHref, children }: Readonly<ProgressPanelProps>) {
    return (
        <section className="flex h-full flex-col rounded-2xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-3">
                <span className={cn("flex size-9 items-center justify-center rounded-xl", iconBgClass)}>
                    <Icon className={cn("size-5", iconClass)} aria-hidden="true" />
                </span>
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            </div>
            <div className="mt-5 flex-1">{children}</div>
            <Link href={ctaHref} className={cn("group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold", iconClass)}>
                {ctaLabel}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
        </section>
    )
}

/** Labelled bar: "label ........ x/y" over a colored progress track. */
export function LabeledBar({ label, learned, total, barClass }: Readonly<{ label: string; learned: number; total: number; barClass: string }>) {
    const percent = total > 0 ? Math.round((learned / total) * 100) : 0
    return (
        <div>
            <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/70">{label}</span>
                <span className="font-semibold text-foreground">
                    {learned}/{total}
                </span>
            </div>
            <div
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={label}
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-foreground/10"
            >
                <div className={cn("h-full rounded-full transition-all duration-700", barClass)} style={{ width: `${percent}%` }} />
            </div>
        </div>
    )
}
