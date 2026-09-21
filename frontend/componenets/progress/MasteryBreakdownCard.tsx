"use client"

import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { Card } from "@/componenets/ui/card"
import { useI18n } from "@/componenets/I18nProvider"

export interface MasterySegment {
    key: string
    label: string
    count: number
    colorClass: string
}

interface MasteryBreakdownCardProps {
    title: string
    icon: LucideIcon
    segments: MasterySegment[]
    total: number
    emptyMessage: string
    ctaLabel?: string
    ctaHref?: string
}

export function MasteryBreakdownCard({
    title,
    icon: Icon,
    segments,
    total,
    emptyMessage,
    ctaLabel,
    ctaHref,
}: MasteryBreakdownCardProps) {
    const { t } = useI18n()
    return (
        <Card className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            </div>

            {total === 0 ? (
                <p className="mt-3 flex-1 text-sm text-foreground/60">{emptyMessage}</p>
            ) : (
                <div className="mt-4 flex-1">
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-foreground/10">
                        {segments
                            .filter((s) => s.count > 0)
                            .map((s) => (
                                <div
                                    key={s.key}
                                    className={s.colorClass}
                                    style={{ width: `${(s.count / total) * 100}%` }}
                                    title={`${s.label}: ${s.count}`}
                                />
                            ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                        {segments.map((s) => (
                            <div key={s.key} className="flex items-center gap-2 text-sm">
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.colorClass}`} />
                                <span className="text-foreground/70">{s.label}</span>
                                <span className="ms-auto font-medium text-foreground">{s.count}</span>
                            </div>
                        ))}
                    </div>

                    <p className="mt-3 text-xs text-foreground/50">{t.progress.total(total)}</p>
                </div>
            )}

            {ctaHref && ctaLabel && (
                <Link href={ctaHref} className="mt-4 text-sm font-medium text-primary hover:underline">
                    {ctaLabel}
                </Link>
            )}
        </Card>
    )
}
