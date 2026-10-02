"use client"

import { Check, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/componenets/I18nProvider"
import { MilestoneLadder as MilestoneLadderType } from "@/types/userProgress"

interface MilestoneLadderProps {
    data: MilestoneLadderType
}

/** Vocabulary milestones as a path: reached steps are filled, the next one pulses, the rest are outlined. */
export function MilestoneLadder({ data }: Readonly<MilestoneLadderProps>) {
    const { t } = useI18n()
    return (
        <section className="rounded-2xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-motivation/12">
                    <Trophy className="size-5 text-motivation" aria-hidden="true" />
                </span>
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{t.progress.milestones.title}</h2>
                    <p className="text-sm text-foreground/60">
                        {t.progress.milestones.wordsMastered(data.wordsMastered)}
                        {data.nextThreshold
                            ? ` — ${t.progress.milestones.toGoUntil(data.nextThreshold - data.wordsMastered, data.nextThreshold)}`
                            : ` — ${t.progress.milestones.allReached}`}
                    </p>
                </div>
            </div>

            <ol className="mt-6 flex items-start overflow-x-auto pb-1">
                {data.thresholds.map((threshold, index) => {
                    const isReached = data.reached[index]
                    const isNext = !isReached && threshold === data.nextThreshold
                    const isLast = index === data.thresholds.length - 1
                    return (
                        <li key={threshold} className={cn("flex items-start", !isLast && "flex-1")}>
                            <div className="flex flex-col items-center gap-1.5">
                                <span
                                    className={cn(
                                        "relative flex size-11 items-center justify-center rounded-full text-xs font-bold transition",
                                        isReached && "bg-motivation text-white shadow-sm",
                                        isNext && "border-2 border-motivation bg-motivation/10 text-motivation",
                                        !isReached && !isNext && "border-2 border-foreground/15 text-foreground/40",
                                    )}
                                >
                                    {isNext && <span aria-hidden="true" className="absolute inset-0 rounded-full bg-motivation/25 motion-safe:animate-ping" />}
                                    {isReached ? <Check className="size-5" strokeWidth={3} aria-hidden="true" /> : <span className="relative">{threshold}</span>}
                                </span>
                                <span className={cn("text-[11px] font-medium", isReached ? "text-foreground/70" : "text-foreground/45")}>{threshold}</span>
                            </div>
                            {!isLast && <div className={cn("mx-1 mt-5 h-1 min-w-4 flex-1 rounded-full sm:mx-2", isReached ? "bg-motivation" : "bg-foreground/10")} />}
                        </li>
                    )
                })}
            </ol>
        </section>
    )
}
