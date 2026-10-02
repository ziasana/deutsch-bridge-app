import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ProgressStatTileProps {
    title: string
    learned: number
    total: number
    subtitle: string
    icon: ReactNode
    /** Tailwind classes: gradient surface, icon color, icon background, bar color. */
    tone: { surface: string; icon: string; iconBg: string; bar: string }
}

/** One overview number with a progress bar toward its total, tinted in the color of its learning area. */
export function ProgressStatTile({ title, learned, total, subtitle, icon, tone }: Readonly<ProgressStatTileProps>) {
    const percent = total > 0 ? Math.min(100, Math.round((learned / total) * 100)) : 0
    return (
        <div className={cn("flex flex-col rounded-2xl bg-gradient-to-br p-5 transition duration-200 hover:-translate-y-1 hover:shadow-card", tone.surface)}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground/70">{title}</span>
                <span className={cn("flex size-9 items-center justify-center rounded-xl", tone.iconBg, tone.icon)} aria-hidden="true">
                    {icon}
                </span>
            </div>
            <p className="mt-3 text-4xl font-bold leading-none tracking-tight text-foreground">{learned}</p>
            <div
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={title}
                className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
            >
                <div className={cn("h-full rounded-full transition-all duration-700", tone.bar)} style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-foreground/60">{subtitle}</p>
        </div>
    )
}
