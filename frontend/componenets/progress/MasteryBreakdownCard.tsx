"use client"

import Link from "next/link"
import { ArrowRight, LucideIcon } from "lucide-react"
import { useI18n } from "@/componenets/I18nProvider"

export interface MasterySegment {
    key: string
    label: string
    count: number
    /** Any CSS color, e.g. "var(--chart-1)". */
    color: string
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

const RADIUS = 44
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Mastery split as a donut with the total in the middle and a legend beside it. */
export function MasteryBreakdownCard({ title, icon: Icon, segments, total, emptyMessage, ctaLabel, ctaHref }: Readonly<MasteryBreakdownCardProps>) {
    const { t } = useI18n()

    const visible = segments.filter((s) => s.count > 0)
    const arcs = visible.map((s, i) => ({
        ...s,
        length: (s.count / total) * CIRCUMFERENCE,
        offset: (visible.slice(0, i).reduce((sum, v) => sum + v.count, 0) / total) * CIRCUMFERENCE,
    }))

    return (
        <section className="flex h-full flex-col rounded-2xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                </span>
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            </div>

            {total === 0 ? (
                <p className="mt-4 flex-1 text-sm text-foreground/60">{emptyMessage}</p>
            ) : (
                <div className="mt-5 flex flex-1 flex-wrap items-center justify-center gap-6 sm:flex-nowrap">
                    <div className="relative size-36 shrink-0">
                        <svg viewBox="0 0 120 120" className="size-full -rotate-90" role="img" aria-label={t.progress.total(total)}>
                            <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="14" />
                            {arcs.map((a) => (
                                <circle
                                    key={a.key}
                                    cx="60"
                                    cy="60"
                                    r={RADIUS}
                                    fill="none"
                                    stroke={a.color}
                                    strokeWidth="14"
                                    strokeDasharray={`${a.length} ${CIRCUMFERENCE - a.length}`}
                                    strokeDashoffset={-a.offset}
                                >
                                    <title>{`${a.label}: ${a.count}`}</title>
                                </circle>
                            ))}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-foreground">{total}</span>
                        </div>
                    </div>

                    <ul className="w-full min-w-0 space-y-2">
                        {segments.map((s) => (
                            <li key={s.key} className="flex items-center gap-2.5 text-sm">
                                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
                                <span className="text-foreground/70">{s.label}</span>
                                <span className="ms-auto font-semibold text-foreground">{s.count}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {ctaHref && ctaLabel && (
                <Link href={ctaHref} className="group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    {ctaLabel}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
            )}
        </section>
    )
}
